"""End-to-end API tests on an in-memory SQLite database.

Run from backend/:  python -m unittest discover -s tests
Email is mocked and uploads are stored in the test database, so nothing leaves the machine.
"""
import io
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import User, UserRole, Category


class MarketplaceTestCase(unittest.TestCase):
    def setUp(self):
        self.sent_otps = {}
        self.patches = [
            patch('app.routes.auth.send_otp_email', side_effect=self._capture_otp),
        ]
        for p in self.patches:
            p.start()

        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        self.category = Category(name='Electronics', slug='electronics')
        db.session.add(self.category)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()
        for p in self.patches:
            p.stop()

    # ---------- helpers ----------

    def _capture_otp(self, email, otp, purpose='Verification'):
        self.sent_otps[email] = otp
        return True

    def register_and_login(self, email, phone='08031234567', **extra):
        payload = {'first_name': 'Test', 'last_name': 'User', 'email': email,
                   'phone': phone, 'password': 'password123', **extra}
        res = self.client.post('/api/v1/auth/register', json=payload)
        self.assertEqual(res.status_code, 201, res.get_json())
        res = self.client.post('/api/v1/auth/verify-otp', json={'email': email, 'otp': self.sent_otps[email]})
        self.assertEqual(res.status_code, 200, res.get_json())
        return self.login(email)

    def login(self, email, password='password123'):
        res = self.client.post('/api/v1/auth/login', json={'email': email, 'password': password})
        self.assertEqual(res.status_code, 200, res.get_json())
        body = res.get_json()
        return {'Authorization': f"Bearer {body['access_token']}"}, body['user']

    def make_admin(self, email, role=UserRole.SUPER_ADMIN):
        user = User.query.filter_by(email=email).first()
        user.role = role.value
        db.session.commit()

    def post_listing(self, headers, title='iPhone 12', price='250000', images=1, **fields):
        data = {'title': title, 'price': price, 'condition': 'used',
                'location': 'Block B hostel', 'category_id': str(self.category.id), **fields}
        data['images'] = [(io.BytesIO(b'img'), f'photo{i}.jpg') for i in range(images)]
        return self.client.post('/api/v1/products', data=data, headers=headers,
                                content_type='multipart/form-data')

    # ---------- auth ----------

    def test_register_normalizes_whatsapp_from_phone(self):
        _, user = self.register_and_login('ada@example.com', phone='0803 123 4567')
        self.assertEqual(user['whatsapp'], '2348031234567')

    def test_login_otp_can_verify_account(self):
        """Regression: the OTP sent on login used a purpose verify-otp never accepted"""
        self.client.post('/api/v1/auth/register', json={
            'first_name': 'A', 'last_name': 'B', 'email': 'late@example.com',
            'phone': '08030000000', 'password': 'password123'})
        res = self.client.post('/api/v1/auth/login', json={'email': 'late@example.com', 'password': 'password123'})
        self.assertEqual(res.status_code, 403)
        self.assertTrue(res.get_json()['needs_verification'])

        res = self.client.post('/api/v1/auth/verify-otp',
                               json={'email': 'late@example.com', 'otp': self.sent_otps['late@example.com']})
        self.assertEqual(res.status_code, 200)
        self.login('late@example.com')

    def test_otp_locks_after_too_many_wrong_guesses(self):
        self.client.post('/api/v1/auth/register', json={
            'first_name': 'A', 'last_name': 'B', 'email': 'brute@example.com',
            'phone': '08030000000', 'password': 'password123'})
        real = self.sent_otps['brute@example.com']
        wrong = '000000' if real != '000000' else '111111'
        for _ in range(5):
            self.client.post('/api/v1/auth/verify-otp', json={'email': 'brute@example.com', 'otp': wrong})
        res = self.client.post('/api/v1/auth/verify-otp', json={'email': 'brute@example.com', 'otp': real})
        self.assertEqual(res.status_code, 400)

    # ---------- listings ----------

    def test_any_user_can_post_and_buyers_see_seller_whatsapp(self):
        seller_headers, seller = self.register_and_login('seller@example.com')
        res = self.post_listing(seller_headers, images=2)
        self.assertEqual(res.status_code, 201, res.get_json())
        product = res.get_json()['product']
        self.assertEqual(len(product['media']), 2)

        # Logged-in buyers get the seller's WhatsApp; anonymous visitors only learn that one exists
        buyer_headers, _ = self.register_and_login('buyer@example.com', phone='08039999999')
        seen = self.client.get(f"/api/v1/products/{product['id']}", headers=buyer_headers).get_json()['product']
        self.assertEqual(seen['seller']['whatsapp'], seller['whatsapp'])
        self.assertNotIn('email', seen['seller'])
        anon = self.client.get(f"/api/v1/products/{product['id']}").get_json()['product']
        self.assertNotIn('whatsapp', anon['seller'])
        self.assertTrue(anon['seller']['has_whatsapp'])

        res = self.client.get('/api/v1/products?q=iphone&category=electronics')
        self.assertEqual(res.get_json()['pagination']['total'], 1)

    def test_listing_requires_photo_and_respects_photo_limit(self):
        headers, _ = self.register_and_login('s@example.com')
        self.assertEqual(self.post_listing(headers, images=0).status_code, 400)
        self.assertEqual(self.post_listing(headers, images=5).status_code, 400)

    def test_mark_sold_hides_from_browse_but_not_from_owner(self):
        headers, _ = self.register_and_login('s@example.com')
        pid = self.post_listing(headers).get_json()['product']['id']

        res = self.client.post(f'/api/v1/products/{pid}/sold', json={'is_sold': True}, headers=headers)
        self.assertTrue(res.get_json()['product']['is_sold'])
        self.assertEqual(self.client.get('/api/v1/products').get_json()['pagination']['total'], 0)
        mine = self.client.get('/api/v1/products/mine', headers=headers).get_json()
        self.assertEqual(len(mine['products']), 1)

    def test_only_owner_can_edit_or_delete(self):
        owner_headers, _ = self.register_and_login('owner@example.com')
        other_headers, _ = self.register_and_login('other@example.com', phone='08039999999')
        pid = self.post_listing(owner_headers).get_json()['product']['id']

        res = self.client.put(f'/api/v1/products/{pid}', data={'title': 'Hacked'}, headers=other_headers,
                              content_type='multipart/form-data')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.client.delete(f'/api/v1/products/{pid}', headers=other_headers).status_code, 403)

        res = self.client.put(f'/api/v1/products/{pid}', data={'title': 'iPhone 12 Pro', 'price': '260000'},
                              headers=owner_headers, content_type='multipart/form-data')
        self.assertEqual(res.get_json()['product']['title'], 'iPhone 12 Pro')
        self.assertEqual(self.client.delete(f'/api/v1/products/{pid}', headers=owner_headers).status_code, 200)
        self.assertEqual(self.client.get(f'/api/v1/products/{pid}').status_code, 404)

    # ---------- chat ----------

    def test_chat_about_listing(self):
        seller_headers, seller = self.register_and_login('seller@example.com')
        buyer_headers, buyer = self.register_and_login('buyer@example.com', phone='08039999999')
        pid = self.post_listing(seller_headers).get_json()['product']['id']

        self.assertEqual(self.client.post('/api/v1/chat/start', json={'product_id': pid},
                                          headers=seller_headers).status_code, 400)  # own listing

        chat = self.client.post('/api/v1/chat/start', json={'product_id': pid},
                                headers=buyer_headers).get_json()['chat']
        self.assertEqual(chat['other_user']['id'], seller['id'])
        self.assertEqual(chat['product']['id'], pid)

        res = self.client.post(f"/api/v1/chat/{chat['id']}/send", json={'content': 'Is this available?'},
                               headers=buyer_headers)
        self.assertEqual(res.status_code, 201)

        unread = self.client.get('/api/v1/chat/unread-count', headers=seller_headers).get_json()
        self.assertEqual(unread['unread_count'], 1)

        # Same pair reuses the chat
        again = self.client.post('/api/v1/chat/start', json={'user_id': seller['id']},
                                 headers=buyer_headers).get_json()['chat']
        self.assertEqual(again['id'], chat['id'])

        # Outsiders can't read it
        outsider_headers, _ = self.register_and_login('x@example.com', phone='08037777777')
        self.assertEqual(self.client.get(f"/api/v1/chat/{chat['id']}/messages",
                                         headers=outsider_headers).status_code, 404)

    # ---------- saved, reports, admin ----------

    def test_save_report_and_admin_moderation(self):
        seller_headers, seller = self.register_and_login('seller@example.com')
        buyer_headers, _ = self.register_and_login('buyer@example.com', phone='08039999999')
        admin_headers, _ = self.register_and_login('admin@example.com', phone='08038888888')
        self.make_admin('admin@example.com')
        pid = self.post_listing(seller_headers).get_json()['product']['id']

        self.client.post('/api/v1/wishlist', json={'product_id': pid}, headers=buyer_headers)
        saved = self.client.get('/api/v1/wishlist', headers=buyer_headers).get_json()
        self.assertEqual(len(saved['items']), 1)

        # Non-admins are blocked
        self.assertEqual(self.client.get('/api/v1/admin/dashboard', headers=buyer_headers).status_code, 403)

        # Admin features the listing
        self.client.patch(f'/api/v1/admin/products/{pid}', json={'is_featured': True}, headers=admin_headers)
        featured = self.client.get('/api/v1/products/featured').get_json()['products']
        self.assertEqual([p['id'] for p in featured], [pid])

        # Report -> admin removes listing -> seller notified
        res = self.client.post('/api/v1/reports', json={'entity_type': 'product', 'entity_id': pid,
                                                        'reason': 'Scam'}, headers=buyer_headers)
        self.assertEqual(res.status_code, 201)
        reports = self.client.get('/api/v1/admin/reports', headers=admin_headers).get_json()['reports']
        self.assertEqual(reports[0]['target']['name'], 'iPhone 12')

        self.client.post(f"/api/v1/admin/reports/{reports[0]['id']}/resolve",
                         json={'action': 'remove_listing'}, headers=admin_headers)
        self.assertEqual(self.client.get(f'/api/v1/products/{pid}').status_code, 404)
        notes = self.client.get('/api/v1/notifications', headers=seller_headers).get_json()
        self.assertTrue(any(n['type'] == 'moderation' for n in notes['notifications']))

        # Removed listings stay visible to admins so they can be restored
        removed = self.client.get('/api/v1/admin/products?status=removed', headers=admin_headers).get_json()
        self.assertEqual(removed['pagination']['total'], 1)

    def test_admin_dashboard_series(self):
        seller_headers, _ = self.register_and_login('seller@example.com')
        admin_headers, _ = self.register_and_login('admin@example.com', phone='08038888888')
        self.make_admin('admin@example.com')
        self.post_listing(seller_headers)

        body = self.client.get('/api/v1/admin/dashboard', headers=admin_headers).get_json()
        self.assertEqual(len(body['daily']), 14)
        self.assertEqual(body['daily'][-1]['listings'], 1)
        self.assertEqual(body['daily'][-1]['users'], 2)
        self.assertEqual(body['by_category'], [{'name': 'Electronics', 'count': 1}])
        self.assertEqual(len(body['recent_listings']), 1)

    def test_suspended_seller_listings_hidden(self):
        seller_headers, seller = self.register_and_login('seller@example.com')
        admin_headers, _ = self.register_and_login('admin@example.com', phone='08038888888')
        self.make_admin('admin@example.com')
        self.post_listing(seller_headers)

        self.client.post(f"/api/v1/admin/users/{seller['id']}/toggle-status", headers=admin_headers)
        self.assertEqual(self.client.get('/api/v1/products').get_json()['pagination']['total'], 0)

    def test_smtp_password_never_returned(self):
        admin_headers, _ = self.register_and_login('admin@example.com')
        self.make_admin('admin@example.com')
        self.client.post('/api/v1/admin/smtp-config', headers=admin_headers, json={
            'server': 'smtp.example.com', 'port': 587, 'username': 'u', 'password': 'secret',
            'from_email': 'noreply@example.com'})
        config = self.client.get('/api/v1/admin/smtp-config', headers=admin_headers).get_json()['config']
        self.assertTrue(config['has_password'])
        self.assertNotIn('secret', str(config))


    def test_admin_cannot_manage_super_admin_or_home_page(self):
        super_headers, boss = self.register_and_login('boss@example.com')
        admin_headers, admin = self.register_and_login('mod@example.com', phone='08038888888')
        user_headers, user = self.register_and_login('user@example.com', phone='08037777777')
        self.make_admin('boss@example.com')
        self.make_admin('mod@example.com', UserRole.ADMIN)

        # Admin can't edit or suspend the super admin, directly or through a report
        res = self.client.put(f"/api/v1/admin/users/{boss['id']}/edit", json={'first_name': 'X'}, headers=admin_headers)
        self.assertEqual(res.status_code, 403)
        res = self.client.post(f"/api/v1/admin/users/{boss['id']}/toggle-status", headers=admin_headers)
        self.assertEqual(res.status_code, 403)
        self.client.post('/api/v1/reports', json={'entity_type': 'user', 'entity_id': boss['id'], 'reason': 'Spam'},
                         headers=user_headers)
        report = self.client.get('/api/v1/admin/reports', headers=admin_headers).get_json()['reports'][0]
        self.assertEqual(report['target']['owner_role'], 'super_admin')
        res = self.client.post(f"/api/v1/admin/reports/{report['id']}/resolve", json={'action': 'suspend_user'},
                               headers=admin_headers)
        self.assertEqual(res.status_code, 403)
        self.assertTrue(db.session.get(User, boss['id']).is_active)

        # ...but can still moderate regular users
        res = self.client.post(f"/api/v1/admin/users/{user['id']}/toggle-status", headers=admin_headers)
        self.assertEqual(res.status_code, 200)

        # Banners and the home intro are super admin only
        self.assertEqual(self.client.get('/api/v1/admin/ads', headers=admin_headers).status_code, 403)
        res = self.client.post('/api/v1/admin/ads', data={'image': (io.BytesIO(b'img'), 'b.jpg')},
                               headers=admin_headers, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 403)
        res = self.client.post('/api/v1/admin/settings', json={'hero_title': 'Hi'}, headers=admin_headers)
        self.assertEqual(res.status_code, 403)
        res = self.client.post('/api/v1/uploads/site', data={'file': (io.BytesIO(b'img'), 'bg.jpg')},
                               headers=admin_headers, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 403)

        res = self.client.post('/api/v1/admin/ads', data={'image': (io.BytesIO(b'img'), 'b.jpg')},
                               headers=super_headers, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 201)

    def test_super_admin_sets_home_intro(self):
        headers, _ = self.register_and_login('boss@example.com')
        self.make_admin('boss@example.com')
        res = self.client.post('/api/v1/admin/settings', headers=headers, json={
            'hero_title': '  Welcome to MAU MART ', 'hero_message': 'Trade safely on campus.',
            'hero_image_url': '/api/v1/uploads/site/bg.jpg'})
        self.assertEqual(res.status_code, 200)
        settings = self.client.get('/api/v1/settings').get_json()['settings']
        self.assertEqual(settings['hero_title'], 'Welcome to MAU MART')
        self.assertEqual(settings['hero_image_url'], '/api/v1/uploads/site/bg.jpg')

        res = self.client.post('/api/v1/admin/settings', headers=headers, json={'hero_title': 'x' * 81})
        self.assertEqual(res.status_code, 400)

    def test_uploaded_photos_are_served_from_the_database(self):
        headers, _ = self.register_and_login('seller@example.com')
        product = self.post_listing(headers, images=2).get_json()['product']
        first = product['media'][0]
        url = first['url']
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, b'img')
        self.assertEqual(res.mimetype, 'image/jpeg')
        self.assertIn('immutable', res.headers['Cache-Control'])

        # Removing a photo removes the stored file too
        res = self.client.delete(f"/api/v1/products/{product['id']}/images/{first['id']}", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.client.get(url).status_code, 404)


if __name__ == '__main__':
    unittest.main()
