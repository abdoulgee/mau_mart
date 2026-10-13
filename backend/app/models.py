from datetime import datetime
from enum import Enum
from app import db
import bcrypt


class UserRole(str, Enum):
    USER = 'user'
    ADMIN = 'admin'
    SUPER_ADMIN = 'super_admin'


ADMIN_ROLES = (UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value)


class ProductCondition(str, Enum):
    NEW = 'new'
    LIKE_NEW = 'like_new'
    USED = 'used'


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    whatsapp = db.Column(db.String(20), nullable=True)
    student_id = db.Column(db.String(50), unique=True, nullable=True, index=True)
    bio = db.Column(db.String(300), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default=UserRole.USER.value)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = db.relationship('Product', backref='seller', lazy='dynamic')

    @property
    def is_admin(self):
        return self.role in ADMIN_ROLES

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_public_dict(self, include_contact=False):
        """Fields any visitor may see. The WhatsApp number is only shared with logged-in users."""
        data = {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'avatar_url': self.avatar_url,
            'bio': self.bio,
            'has_whatsapp': bool(self.whatsapp),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_contact:
            data['whatsapp'] = self.whatsapp
        return data

    def to_dict(self):
        """Full profile, for the user themselves and admins"""
        data = self.to_public_dict(include_contact=True)
        data.update({
            'email': self.email,
            'phone': self.phone,
            'student_id': self.student_id,
            'role': self.role,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
        })
        return data


class OtpLog(db.Model):
    __tablename__ = 'otp_logs'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    otp_code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)  # 'verification', 'password_reset'
    attempts = db.Column(db.Integer, default=0)
    is_used = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    icon = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'icon': self.icon,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
        }


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    condition = db.Column(db.String(20), default=ProductCondition.USED.value)
    location = db.Column(db.String(200), nullable=True)  # e.g. hostel or campus spot
    is_sold = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)  # False = deleted by owner or removed by admin
    is_featured = db.Column(db.Boolean, default=False)  # Set by admin only
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship('Category')
    media = db.relationship('ProductMedia', backref='product', lazy=True,
                            cascade='all, delete-orphan', order_by='ProductMedia.sort_order')

    def to_dict(self, include_seller=True, include_contact=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'price': float(self.price) if self.price is not None else 0,
            'condition': self.condition,
            'location': self.location,
            'is_sold': self.is_sold,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'views': self.views,
            'category': self.category.to_dict() if self.category else None,
            'media': [m.to_dict() for m in self.media],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_seller:
            data['seller'] = self.seller.to_public_dict(include_contact=include_contact) if self.seller else None
        return data


class ProductMedia(db.Model):
    __tablename__ = 'product_media'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'sort_order': self.sort_order,
        }


class Chat(db.Model):
    """A conversation between two users. One chat per pair; product_id is the listing last asked about."""
    __tablename__ = 'chats'

    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user1 = db.relationship('User', foreign_keys=[user1_id])
    user2 = db.relationship('User', foreign_keys=[user2_id])
    product = db.relationship('Product')
    messages = db.relationship('Message', backref='chat', lazy='dynamic', cascade='all, delete-orphan')

    def has_member(self, user_id):
        return user_id in (self.user1_id, self.user2_id)

    def other_user_id(self, user_id):
        return self.user2_id if self.user1_id == user_id else self.user1_id

    def to_dict(self, current_user_id):
        other_user = self.user2 if self.user1_id == current_user_id else self.user1
        last_msg = self.messages.order_by(Message.created_at.desc()).first()
        unread = self.messages.filter(
            Message.sender_id != current_user_id,
            Message.is_read == False  # noqa: E712
        ).count()

        return {
            'id': self.id,
            'other_user': other_user.to_public_dict(include_contact=True) if other_user else None,
            'product': self.product.to_dict(include_seller=False) if self.product else None,
            'last_message': last_msg.to_dict() if last_msg else None,
            'unread_count': unread,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
        }


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)
    message_type = db.Column(db.String(20), default='text')  # text, image
    media_url = db.Column(db.String(500), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'message_type': self.message_type,
            'media_url': self.media_url,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Wishlist(db.Model):
    __tablename__ = 'wishlists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product')

    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='uq_wishlist_user_product'),)


class AdsBanner(db.Model):
    """Home page banners, created by admins only"""
    __tablename__ = 'ads_banners'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=True)
    image_url = db.Column(db.String(500), nullable=False)
    link_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'image_url': self.image_url,
            'link_url': self.link_url,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SmtpConfig(db.Model):
    __tablename__ = 'smtp_configs'

    id = db.Column(db.Integer, primary_key=True)
    server = db.Column(db.String(200), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(200), nullable=False)
    password = db.Column(db.String(500), nullable=False)
    use_tls = db.Column(db.Boolean, default=True)
    from_email = db.Column(db.String(200), nullable=False)
    from_name = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default='general')
    data = db.Column(db.JSON, nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.notification_type,
            'data': self.data,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Report(db.Model):
    __tablename__ = 'reports'

    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # product, user
    entity_id = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, resolved, dismissed
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reporter = db.relationship('User', foreign_keys=[reporter_id])


class AppSettings(db.Model):
    """Single-row key-value store for site-wide settings"""
    __tablename__ = 'app_settings'

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON, nullable=False, default=dict)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StoredFile(db.Model):
    """Uploaded images, kept in the database instead of on disk"""
    __tablename__ = 'stored_files'

    id = db.Column(db.Integer, primary_key=True)
    path = db.Column(db.String(300), unique=True, nullable=False, index=True)  # e.g. products/1_123_photo.jpg
    content_type = db.Column(db.String(100), nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    size = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


def get_setting(key, default=None):
    """Read one value from the AppSettings row"""
    row = AppSettings.query.first()
    if row and row.data:
        return row.data.get(key, default)
    return default
