from datetime import datetime
from enum import Enum
from app import db
import bcrypt


class UserRole(str, Enum):
    USER = 'user'
    SELLER = 'seller'
    ADMIN = 'admin'
    SUPER_ADMIN = 'super_admin'
    SUPPORT_ADMIN = 'support_admin'


class OrderStatus(str, Enum):
    PENDING_PAYMENT = 'pending_payment'
    AWAITING_APPROVAL = 'awaiting_approval'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'


class ProductType(str, Enum):
    PHYSICAL = 'physical'
    ACCOMMODATION = 'accommodation'
    FOOD = 'food'
    SERVICE = 'service'


class StoreRequestStatus(str, Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'


# Association tables
product_categories = db.Table('product_categories',
    db.Column('product_id', db.Integer, db.ForeignKey('products.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id'), primary_key=True)
)


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    student_id = db.Column(db.String(50), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default=UserRole.USER.value)
    is_seller = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    store = db.relationship('Store', backref='owner', uselist=False, lazy=True)
    orders = db.relationship('Order', backref='buyer', lazy=True, foreign_keys='Order.buyer_id')
    reviews = db.relationship('Review', backref='author', lazy=True)
    
    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'student_id': self.student_id,
            'role': self.role,
            'is_seller': self.is_seller,
            'is_verified': self.is_verified,
            'avatar_url': self.avatar_url,
            'profile_photo_url': self.avatar_url,  # Alias for frontend compatibility
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active,
        }
        # Include permissions for support admins
        if self.role == 'support_admin':
            admin_role = AdminRole.query.filter_by(user_id=self.id).first() if self.id else None
            data['permissions'] = admin_role.permissions if admin_role else []
        return data


class OtpLog(db.Model):
    __tablename__ = 'otp_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    otp_code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)  # 'verification', 'password_reset'
    is_used = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Store(db.Model):
    __tablename__ = 'stores'
    
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(500), nullable=True)
    banner_url = db.Column(db.String(500), nullable=True)
    address = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    store_type = db.Column(db.String(50), default='general')  # general, kitchen, service
    is_open = db.Column(db.Boolean, default=True)  # For food vendors
    bank_name = db.Column(db.String(100), nullable=True)
    account_number = db.Column(db.String(50), nullable=True)
    account_name = db.Column(db.String(200), nullable=True)
    rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    total_orders = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='store', lazy='dynamic')
    orders = db.relationship('Order', backref='store', lazy=True)
    
    def to_dict(self, include_bank=False, include_owner=False):
        data = {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'logo_url': self.logo_url,
            'banner_url': self.banner_url,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'store_type': self.store_type,
            'is_open': self.is_open,
            'rating': self.rating,
            'total_reviews': self.total_reviews,
            'total_orders': self.total_orders,
            'total_products': self.products.count() if self.products else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_bank:
            data['bank_name'] = self.bank_name
            data['account_number'] = self.account_number
            data['account_name'] = self.account_name
        
        if include_owner and self.owner:
            data['owner'] = self.owner.to_dict()
            
        return data


class StoreRequest(db.Model):
    __tablename__ = 'store_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    store_name = db.Column(db.String(200), nullable=False)
    store_type = db.Column(db.String(50), default='general')
    description = db.Column(db.Text, nullable=True)
    business_address = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    id_document_url = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default=StoreRequestStatus.PENDING.value)
    admin_notes = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='store_requests')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'store_name': self.store_name,
            'store_type': self.store_type,
            'description': self.description,
            'business_address': self.business_address,
            'phone': self.phone,
            'email': self.email,
            'id_document_url': self.id_document_url,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.user.to_dict() if self.user else None,
        }


class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    icon = db.Column(db.String(100), nullable=True)
    banner_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'icon': self.icon,
            'banner_url': self.banner_url,
            'description': self.description,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
        }


class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    slug = db.Column(db.String(300), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    compare_price = db.Column(db.Numeric(12, 2), nullable=True)  # Original price for discounts
    product_type = db.Column(db.String(50), default=ProductType.PHYSICAL.value)
    stock_quantity = db.Column(db.Integer, default=1)
    is_in_stock = db.Column(db.Boolean, default=True)
    pickup_location = db.Column(db.Text, nullable=True)
    prep_time = db.Column(db.String(50), nullable=True)  # For food items
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    total_orders = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    categories = db.relationship('Category', secondary=product_categories, backref='products')
    media = db.relationship('ProductMedia', backref='product', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='product', lazy=True)
    
    def to_dict(self, include_store=False):
        data = {
            'id': self.id,
            'store_id': self.store_id,
            'title': self.title,
            'slug': self.slug,
            'description': self.description,
            'price': float(self.price) if self.price else 0,
            'compare_price': float(self.compare_price) if self.compare_price else None,
            'product_type': self.product_type,
            'stock_quantity': self.stock_quantity,
            'is_in_stock': self.is_in_stock,
            'pickup_location': self.pickup_location,
            'prep_time': self.prep_time,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'rating': self.rating,
            'total_reviews': self.total_reviews,
            'total_orders': self.total_orders,
            'views': self.views,
            'categories': [c.to_dict() for c in self.categories],
            'media': [m.to_dict() for m in self.media],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_store:
            data['store'] = self.store.to_dict(include_bank=True) if self.store else None
        return data


class ProductMedia(db.Model):
    __tablename__ = 'product_media'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    media_type = db.Column(db.String(20), default='image')  # image, video
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'media_type': self.media_type,
            'sort_order': self.sort_order,
        }


class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(30), default=OrderStatus.PENDING_PAYMENT.value)
    buyer_note = db.Column(db.Text, nullable=True)
    seller_note = db.Column(db.Text, nullable=True)
    payment_confirmed_at = db.Column(db.DateTime, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    receipt_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='orders')
    
    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'buyer_id': self.buyer_id,
            'store_id': self.store_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_price': float(self.total_price),
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_details:
            data['product'] = self.product.to_dict() if self.product else None
            data['store'] = self.store.to_dict() if self.store else None
            data['buyer'] = self.buyer.to_dict() if self.buyer else None
            data['buyer_note'] = self.buyer_note
            data['seller_note'] = self.seller_note
            data['receipt_url'] = self.receipt_url
        return data


class Chat(db.Model):
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user1 = db.relationship('User', foreign_keys=[user1_id])
    user2 = db.relationship('User', foreign_keys=[user2_id])
    product = db.relationship('Product')
    messages = db.relationship('Message', backref='chat', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, current_user_id=None):
        other_user = self.user2 if self.user1_id == current_user_id else self.user1
        last_msg = self.messages.order_by(Message.created_at.desc()).first()
        unread = self.messages.filter(
            Message.sender_id != current_user_id,
            Message.is_read == False
        ).count() if current_user_id else 0
        
        other_user_data = other_user.to_dict() if other_user else None
        if other_user_data and other_user and other_user.store:
            other_user_data['store_id'] = other_user.store.id
            other_user_data['store_name'] = other_user.store.name
        
        return {
            'id': self.id,
            'other_user': other_user_data,
            'product': self.product.to_dict() if self.product else None,
            'last_message': last_msg.to_dict() if last_msg else None,
            'unread_count': unread,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
        }


class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)
    message_type = db.Column(db.String(20), default='text')  # text, image, video, order
    media_url = db.Column(db.String(500), nullable=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = db.relationship('User')
    order = db.relationship('Order')
    
    def to_dict(self):
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'message_type': self.message_type,
            'media_url': self.media_url,
            'order_id': self.order_id,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender': self.sender.to_dict() if self.sender else None,
        }


class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text, nullable=True)
    media_urls = db.Column(db.JSON, nullable=True)  # Array of image/video urls
    is_approved = db.Column(db.Boolean, default=False)
    is_hidden = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'rating': self.rating,
            'comment': self.comment,
            'media_urls': self.media_urls,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.author.to_dict() if self.author else None,  # Changed from 'author' to 'user'
            'is_verified_purchase': self.order_id is not None,  # Add verified purchase flag
        }


class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    plan = db.Column(db.String(50), nullable=False)  # basic, starter, professional, enterprise
    amount_paid = db.Column(db.Numeric(12, 2), default=0)
    payment_reference = db.Column(db.String(200), nullable=True)
    starts_at = db.Column(db.DateTime, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    store = db.relationship('Store', backref='subscriptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'plan': self.plan,
            'amount_paid': float(self.amount_paid) if self.amount_paid else 0,
            'starts_at': self.starts_at.isoformat() if self.starts_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Wishlist(db.Model):
    __tablename__ = 'wishlists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='wishlists')
    product = db.relationship('Product')

    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='uq_wishlist_user_product'),)


class FeaturedProduct(db.Model):
    __tablename__ = 'featured_products'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    starts_at = db.Column(db.DateTime, nullable=False)
    ends_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product')
    store = db.relationship('Store')


class AdsBanner(db.Model):
    __tablename__ = 'ads_banners'
    
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=True)
    title = db.Column(db.String(200), nullable=True)
    image_url = db.Column(db.String(500), nullable=False)
    link_url = db.Column(db.String(500), nullable=True)
    position = db.Column(db.String(50), default='home')  # home, category, etc
    starts_at = db.Column(db.DateTime, nullable=False)
    ends_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)
    impressions = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    store = db.relationship('Store', backref='ads')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'image_url': self.image_url,
            'link_url': self.link_url,
            'position': self.position,
        }


class VerificationRequest(db.Model):
    __tablename__ = 'verification_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    admin_notes = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    store = db.relationship('Store', backref='verification_requests')


class AdminRole(db.Model):
    __tablename__ = 'admin_roles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    permissions = db.Column(db.JSON, nullable=True)  # Array of permission strings
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='admin_role')


class SmtpConfig(db.Model):
    __tablename__ = 'smtp_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    server = db.Column(db.String(200), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(200), nullable=False)
    password = db.Column(db.String(500), nullable=False)  # Encrypted
    use_tls = db.Column(db.Boolean, default=True)
    from_email = db.Column(db.String(200), nullable=False)
    from_name = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), default='general')
    data = db.Column(db.JSON, nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50), nullable=True)
    entity_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # product, store, user, review
    entity_id = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, reviewed, resolved, dismissed
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    reporter = db.relationship('User', foreign_keys=[reporter_id])


class FeaturedListing(db.Model):
    """Featured listing requests from sellers"""
    __tablename__ = 'featured_listings'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    listing_type = db.Column(db.String(50), nullable=False)  # home_featured, category_top, search_boost
    amount_paid = db.Column(db.Numeric(12, 2), default=0)
    payment_reference = db.Column(db.String(200), nullable=True)
    starts_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, expired
    approved_at = db.Column(db.DateTime, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product')
    store = db.relationship('Store')
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'store_id': self.store_id,
            'listing_type': self.listing_type,
            'amount_paid': float(self.amount_paid) if self.amount_paid else 0,
            'starts_at': self.starts_at.isoformat() if self.starts_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'product': self.product.to_dict() if self.product else None,
        }


class AdRequest(db.Model):
    """Ad placement requests from sellers"""
    __tablename__ = 'ad_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    placement = db.Column(db.String(50), nullable=False)  # home_banner, category_sidebar, product_interstitial
    image_url = db.Column(db.String(500), nullable=False)
    link_url = db.Column(db.String(500), nullable=True)
    amount_paid = db.Column(db.Numeric(12, 2), default=0)
    payment_reference = db.Column(db.String(200), nullable=True)
    duration_days = db.Column(db.Integer, default=7)
    starts_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, expired
    approved_at = db.Column(db.DateTime, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    store = db.relationship('Store')
    
    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'placement': self.placement,
            'image_url': self.image_url,
            'link_url': self.link_url,
            'amount_paid': float(self.amount_paid) if self.amount_paid else 0,
            'duration_days': self.duration_days,
            'starts_at': self.starts_at.isoformat() if self.starts_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AppSettings(db.Model):
    """Single-row key-value store for site-wide settings"""
    __tablename__ = 'app_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON, nullable=False, default=dict)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
