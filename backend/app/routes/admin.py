from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from sqlalchemy import func
import re

from app import db
from app.models import (
    User, UserRole, Product, Category, Chat, Report, AdsBanner, SmtpConfig, AppSettings,
)
from app.services.storage import upload_file, delete_file
from app.utils import (
    admin_required, super_admin_required, current_user_id, page_args, pagination_meta,
    create_notification, allowed_image, normalize_whatsapp,
)

bp = Blueprint('admin', __name__)


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[-\s]+', '-', text)


# ---------- Dashboard ----------

@bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    days = 14
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    def per_day(model):
        day = func.date(model.created_at)
        rows = db.session.query(day, func.count(model.id)) \
            .filter(model.created_at >= start).group_by(day).all()
        return {str(d): c for d, c in rows}

    listings_by_day, users_by_day = per_day(Product), per_day(User)
    daily = []
    for i in range(days):
        d = (start + timedelta(days=i)).date().isoformat()
        daily.append({'date': d, 'listings': listings_by_day.get(d, 0), 'users': users_by_day.get(d, 0)})

    by_category = db.session.query(Category.name, func.count(Product.id)) \
        .join(Product, Product.category_id == Category.id) \
        .filter(Product.is_active == True, Product.is_sold == False) \
        .group_by(Category.name).order_by(func.count(Product.id).desc()).all()  # noqa: E712
    uncategorized = Product.query.filter_by(is_active=True, is_sold=False, category_id=None).count()

    recent = Product.query.order_by(Product.created_at.desc()).limit(6).all()

    return jsonify({
        'stats': {
            'total_users': User.query.count(),
            'new_users_7d': User.query.filter(User.created_at >= week_ago).count(),
            'active_listings': Product.query.filter_by(is_active=True, is_sold=False).count(),
            'sold_listings': Product.query.filter_by(is_active=True, is_sold=True).count(),
            'new_listings_7d': Product.query.filter(Product.created_at >= week_ago).count(),
            'featured_listings': Product.query.filter_by(is_active=True, is_featured=True).count(),
            'total_chats': Chat.query.count(),
            'pending_reports': Report.query.filter_by(status='pending').count(),
        },
        'daily': daily,
        'by_category': [{'name': n, 'count': c} for n, c in by_category]
                       + ([{'name': 'Uncategorized', 'count': uncategorized}] if uncategorized else []),
        'recent_listings': [p.to_dict() for p in recent],
    }), 200


# ---------- Users ----------

@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    page, limit = page_args(request)
    query = User.query

    search = (request.args.get('search') or '').strip()
    if search:
        like = f'%{search}%'
        query = query.filter(db.or_(
            User.first_name.ilike(like), User.last_name.ilike(like),
            User.email.ilike(like), User.student_id.ilike(like),
        ))

    role = request.args.get('role')
    if role:
        query = query.filter_by(role=role)

    status = request.args.get('status')
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'suspended':
        query = query.filter_by(is_active=False)

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)

    users = []
    for u in pagination.items:
        data = u.to_dict()
        data['listings_count'] = u.products.filter_by(is_active=True).count()
        users.append(data)

    return jsonify({'users': users, 'pagination': pagination_meta(pagination)}), 200


def _can_manage(target):
    """Admins can't act on themselves; only super admins can edit or suspend admins and super admins"""
    actor = db.session.get(User, current_user_id())
    if target.id == actor.id:
        return 'You cannot do this to your own account'
    if target.is_admin and actor.role != UserRole.SUPER_ADMIN.value:
        return 'Only a super admin can manage admin accounts'
    return None


@bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    error = _can_manage(user)
    if error:
        return jsonify({'message': error}), 403

    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({
        'message': f'User {"activated" if user.is_active else "suspended"}',
        'user': user.to_dict(),
    }), 200


@bp.route('/users/<int:user_id>/role', methods=['PUT'])
@super_admin_required
def update_user_role(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if user.id == current_user_id():
        return jsonify({'message': 'You cannot change your own role'}), 403

    new_role = (request.get_json() or {}).get('role')
    if new_role not in [r.value for r in UserRole]:
        return jsonify({'message': 'Invalid role'}), 400

    user.role = new_role
    db.session.commit()
    return jsonify({'message': 'Role updated', 'user': user.to_dict()}), 200


@bp.route('/users/<int:user_id>/edit', methods=['PUT'])
@admin_required
def edit_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if user.id != current_user_id():
        error = _can_manage(user)
        if error:
            return jsonify({'message': error}), 403

    data = request.get_json() or {}

    for field in ('first_name', 'last_name', 'phone'):
        if (data.get(field) or '').strip():
            setattr(user, field, data[field].strip())

    new_email = (data.get('email') or '').strip().lower()
    if new_email and new_email != user.email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({'message': 'Email already in use by another user'}), 409
        user.email = new_email

    if 'whatsapp' in data:
        raw = (data.get('whatsapp') or '').strip()
        user.whatsapp = normalize_whatsapp(raw) if raw else None
        if raw and not user.whatsapp:
            return jsonify({'message': 'Invalid WhatsApp number'}), 400

    if 'student_id' in data:
        new_sid = (data.get('student_id') or '').strip() or None
        if new_sid and new_sid != user.student_id:
            existing = User.query.filter_by(student_id=new_sid).first()
            if existing and existing.id != user.id:
                return jsonify({'message': 'Student ID already in use by another user'}), 409
        user.student_id = new_sid

    if 'is_verified' in data:
        user.is_verified = bool(data['is_verified'])

    db.session.commit()
    return jsonify({'message': 'User updated', 'user': user.to_dict()}), 200


@bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@super_admin_required
def admin_reset_user_password(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    new_password = ((request.get_json() or {}).get('new_password') or '').strip()
    if len(new_password) < 8:
        return jsonify({'message': 'Password must be at least 8 characters'}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': f'Password reset for {user.email}'}), 200


# ---------- Listings ----------

@bp.route('/products', methods=['GET'])
@admin_required
def get_products():
    """All listings. status: active | sold | removed | featured"""
    page, limit = page_args(request)
    query = Product.query

    search = (request.args.get('search') or '').strip()
    if search:
        query = query.filter(Product.title.ilike(f'%{search}%'))

    status = request.args.get('status')
    if status == 'active':
        query = query.filter_by(is_active=True, is_sold=False)
    elif status == 'sold':
        query = query.filter_by(is_active=True, is_sold=True)
    elif status == 'removed':
        query = query.filter_by(is_active=False)
    elif status == 'featured':
        query = query.filter_by(is_active=True, is_featured=True)

    user_id = request.args.get('user_id', type=int)
    if user_id:
        query = query.filter_by(user_id=user_id)

    pagination = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'pagination': pagination_meta(pagination),
    }), 200


@bp.route('/products/<int:product_id>', methods=['PATCH'])
@admin_required
def update_product_admin(product_id):
    """Feature/unfeature, remove or restore a listing"""
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Listing not found'}), 404

    data = request.get_json() or {}
    if 'is_featured' in data:
        product.is_featured = bool(data['is_featured'])
    if 'is_active' in data:
        was_active = product.is_active
        product.is_active = bool(data['is_active'])
        if was_active and not product.is_active:
            product.is_featured = False
            create_notification(
                product.user_id, 'Listing removed',
                f'Your listing "{product.title}" was removed by an admin for breaking the community rules.',
                notification_type='moderation', data={'product_id': product.id},
            )

    db.session.commit()
    return jsonify({'message': 'Listing updated', 'product': product.to_dict()}), 200


# ---------- Categories ----------

@bp.route('/categories', methods=['GET'])
@admin_required
def get_categories():
    categories = Category.query.order_by(Category.sort_order, Category.name).all()
    result = []
    for c in categories:
        data = c.to_dict()
        data['listings_count'] = Product.query.filter_by(category_id=c.id, is_active=True).count()
        result.append(data)
    return jsonify({'categories': result}), 200


def _unique_slug(name, exclude_id=None):
    base = slugify(name) or 'category'
    slug, n = base, 2
    while True:
        existing = Category.query.filter_by(slug=slug).first()
        if not existing or existing.id == exclude_id:
            return slug
        slug, n = f'{base}-{n}', n + 1


@bp.route('/categories', methods=['POST'])
@admin_required
def create_category():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'message': 'Category name is required'}), 400

    category = Category(
        name=name,
        slug=_unique_slug(name),
        icon=(data.get('icon') or '').strip() or None,
        sort_order=int(data.get('sort_order') or 0),
    )
    db.session.add(category)
    db.session.commit()
    return jsonify({'message': 'Category created', 'category': category.to_dict()}), 201


@bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404

    data = request.get_json() or {}
    if (data.get('name') or '').strip():
        category.name = data['name'].strip()
        category.slug = _unique_slug(category.name, exclude_id=category.id)
    if 'icon' in data:
        category.icon = (data.get('icon') or '').strip() or None
    if 'sort_order' in data:
        category.sort_order = int(data.get('sort_order') or 0)
    if 'is_active' in data:
        category.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({'message': 'Category updated', 'category': category.to_dict()}), 200


@bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    """Hide a category (listings keep it, so it can be restored)"""
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    category.is_active = False
    db.session.commit()
    return jsonify({'message': 'Category hidden'}), 200


# ---------- Reports ----------

def _report_target(report):
    if report.entity_type == 'product':
        p = db.session.get(Product, report.entity_id)
        return {
            'name': p.title if p else 'Deleted listing',
            'is_active': bool(p and p.is_active),
            'owner_id': p.user_id if p else None,
            'owner_role': p.seller.role if p and p.seller else None,
        }
    u = db.session.get(User, report.entity_id)
    return {
        'name': f'{u.first_name} {u.last_name}' if u else 'Deleted user',
        'is_active': bool(u and u.is_active),
        'owner_id': u.id if u else None,
        'owner_role': u.role if u else None,
    }


@bp.route('/reports', methods=['GET'])
@admin_required
def get_reports():
    page, limit = page_args(request)
    status = request.args.get('status', 'pending')
    query = Report.query
    if status != 'all':
        query = query.filter_by(status=status)
    pagination = query.order_by(Report.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        'reports': [{
            'id': r.id,
            'reporter': r.reporter.to_public_dict() if r.reporter else None,
            'entity_type': r.entity_type,
            'entity_id': r.entity_id,
            'target': _report_target(r),
            'reason': r.reason,
            'description': r.description,
            'status': r.status,
            'admin_notes': r.admin_notes,
            'created_at': r.created_at.isoformat() if r.created_at else None,
        } for r in pagination.items],
        'pagination': pagination_meta(pagination),
    }), 200


@bp.route('/reports/<int:report_id>/resolve', methods=['POST'])
@admin_required
def resolve_report(report_id):
    """action: dismiss | remove_listing | suspend_user"""
    report = db.session.get(Report, report_id)
    if not report:
        return jsonify({'message': 'Report not found'}), 404

    data = request.get_json() or {}
    action = data.get('action', 'dismiss')

    if action == 'remove_listing':
        if report.entity_type != 'product':
            return jsonify({'message': 'This report is not about a listing'}), 400
        product = db.session.get(Product, report.entity_id)
        if product and product.is_active:
            product.is_active = False
            product.is_featured = False
            create_notification(
                product.user_id, 'Listing removed',
                f'Your listing "{product.title}" was removed after a report: {report.reason}.',
                notification_type='moderation', data={'product_id': product.id},
            )
    elif action == 'suspend_user':
        target_id = report.entity_id
        if report.entity_type == 'product':
            product = db.session.get(Product, report.entity_id)
            target_id = product.user_id if product else None
        user = db.session.get(User, target_id) if target_id else None
        if user:
            error = _can_manage(user)
            if error:
                return jsonify({'message': error}), 403
            user.is_active = False
    elif action != 'dismiss':
        return jsonify({'message': 'Invalid action'}), 400

    report.status = 'dismissed' if action == 'dismiss' else 'resolved'
    report.reviewed_by = current_user_id()
    report.admin_notes = (data.get('notes') or '').strip() or None
    db.session.commit()

    return jsonify({'message': 'Report dismissed' if action == 'dismiss' else 'Report resolved'}), 200


# ---------- Banners ----------

@bp.route('/ads', methods=['GET'])
@super_admin_required
def get_ads():
    ads = AdsBanner.query.order_by(AdsBanner.sort_order, AdsBanner.created_at.desc()).all()
    return jsonify({'ads': [a.to_dict() for a in ads]}), 200


def _ad_image(required):
    file = request.files.get('image')
    if not file or not file.filename:
        return (None, 'Image is required') if required else (None, None)
    if not allowed_image(file.filename):
        return None, 'Banner must be an image'
    filename = f"ad_{int(datetime.utcnow().timestamp())}_{secure_filename(file.filename)}"
    return upload_file(file, filename, folder='ads'), None


@bp.route('/ads', methods=['POST'])
@super_admin_required
def create_ad():
    """Multipart: image (required), title, link_url, is_active, sort_order"""
    image_url, error = _ad_image(required=True)
    if error:
        return jsonify({'message': error}), 400

    ad = AdsBanner(
        title=(request.form.get('title') or '').strip() or None,
        link_url=(request.form.get('link_url') or '').strip() or None,
        image_url=image_url,
        is_active=request.form.get('is_active', 'true').lower() == 'true',
        sort_order=request.form.get('sort_order', 0, type=int),
    )
    db.session.add(ad)
    db.session.commit()
    return jsonify({'message': 'Banner created', 'ad': ad.to_dict()}), 201


@bp.route('/ads/<int:ad_id>', methods=['PUT'])
@super_admin_required
def update_ad(ad_id):
    ad = db.session.get(AdsBanner, ad_id)
    if not ad:
        return jsonify({'message': 'Banner not found'}), 404

    if request.is_json:
        form = request.get_json() or {}
    else:
        form = request.form
        image_url, error = _ad_image(required=False)
        if error:
            return jsonify({'message': error}), 400
        if image_url:
            ad.image_url = image_url

    if 'title' in form:
        ad.title = (form.get('title') or '').strip() or None
    if 'link_url' in form:
        ad.link_url = (form.get('link_url') or '').strip() or None
    if 'sort_order' in form:
        ad.sort_order = int(form.get('sort_order') or 0)
    if 'is_active' in form:
        value = form.get('is_active')
        ad.is_active = value if isinstance(value, bool) else str(value).lower() == 'true'

    db.session.commit()
    return jsonify({'message': 'Banner updated', 'ad': ad.to_dict()}), 200


@bp.route('/ads/<int:ad_id>', methods=['DELETE'])
@super_admin_required
def delete_ad(ad_id):
    ad = db.session.get(AdsBanner, ad_id)
    if not ad:
        return jsonify({'message': 'Banner not found'}), 404
    delete_file(ad.image_url)
    db.session.delete(ad)
    db.session.commit()
    return jsonify({'message': 'Banner deleted'}), 200


# ---------- App settings ----------

HERO_TEXT_LIMITS = {'hero_title': 80, 'hero_message': 240}

@bp.route('/settings', methods=['GET'])
@admin_required
def get_app_settings():
    row = AppSettings.query.first()
    return jsonify({'settings': row.data if row else {}}), 200


@bp.route('/settings', methods=['POST'])
@super_admin_required
def save_app_settings():
    """Merges the given keys into the stored settings"""
    data = request.get_json() or {}
    for key, limit in HERO_TEXT_LIMITS.items():
        if key in data:
            data[key] = str(data[key] or '').strip()
            if len(data[key]) > limit:
                return jsonify({'message': f'{key.replace("_", " ").capitalize()} must be {limit} characters or fewer'}), 400
    row = AppSettings.query.first()
    if not row:
        row = AppSettings(data={})
        db.session.add(row)
    row.data = {**(row.data or {}), **data}
    db.session.commit()
    return jsonify({'message': 'Settings saved', 'settings': row.data}), 200


# ---------- Email (SMTP) ----------

@bp.route('/smtp-config', methods=['GET'])
@super_admin_required
def get_smtp_config():
    config = SmtpConfig.query.filter_by(is_active=True).first() or SmtpConfig.query.first()
    if not config:
        return jsonify({'config': None}), 200

    return jsonify({'config': {
        'server': config.server,
        'port': config.port,
        'username': config.username,
        'use_tls': config.use_tls,
        'from_email': config.from_email,
        'from_name': config.from_name,
        'has_password': bool(config.password),  # the password itself is never sent back
    }}), 200


@bp.route('/smtp-config', methods=['POST'])
@super_admin_required
def save_smtp_config():
    data = request.get_json() or {}
    config = SmtpConfig.query.first()

    for field in ('server', 'username', 'from_email'):
        if not (data.get(field) or '').strip():
            return jsonify({'message': f'{field.replace("_", " ").capitalize()} is required'}), 400

    password = data.get('password') or ''
    if not config and not password:
        return jsonify({'message': 'Password is required'}), 400

    if not config:
        config = SmtpConfig()
        db.session.add(config)

    config.server = data['server'].strip()
    config.port = int(data.get('port') or 587)
    config.username = data['username'].strip()
    if password:  # blank keeps the saved password
        config.password = password
    config.use_tls = bool(data.get('use_tls', True))
    config.from_email = data['from_email'].strip()
    config.from_name = (data.get('from_name') or '').strip() or None
    config.is_active = True

    db.session.commit()
    return jsonify({'message': 'Email settings saved'}), 200


@bp.route('/smtp-test', methods=['POST'])
@super_admin_required
def test_smtp_config():
    test_email = ((request.get_json() or {}).get('email') or '').strip()
    if not test_email:
        return jsonify({'message': 'Test email address is required'}), 400

    from app.services.email import send_email
    success = send_email(
        to_email=test_email,
        subject='MAU MART - Test Email',
        html="<div style='font-family: sans-serif; padding: 20px;'><h2>✅ Email is working!</h2>"
             "<p>This is a test email from MAU MART.</p></div>",
        text='MAU MART - Test Email\n\nIf you received this, your email settings are correct.',
    )
    if not success:
        return jsonify({'message': 'Failed to send test email. Check the settings and server logs.'}), 500
    return jsonify({'message': f'Test email sent to {test_email}'}), 200
