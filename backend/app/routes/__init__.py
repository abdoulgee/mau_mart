from .auth import bp as auth_bp
from .users import bp as users_bp
from .stores import bp as stores_bp
from .products import bp as products_bp
from .categories import bp as categories_bp
from .orders import bp as orders_bp
from .chat import bp as chat_bp
from .reviews import bp as reviews_bp
from .admin import bp as admin_bp
from .uploads import bp as uploads_bp
from .subscriptions import subscriptions_bp
from .notifications import bp as notifications_bp
from .wishlist import bp as wishlist_bp
from .reports import reports_bp

# Re-export blueprints for easier import
auth = auth_bp
users = users_bp
stores = stores_bp
products = products_bp
categories = categories_bp
orders = orders_bp
chat = chat_bp
reviews = reviews_bp
admin = admin_bp
uploads = uploads_bp
subscriptions = subscriptions_bp
notifications = notifications_bp
wishlist = wishlist_bp
reports = reports_bp

__all__ = [
    'auth', 'users', 'stores', 'products', 'categories',
    'orders', 'chat', 'reviews', 'admin', 'uploads', 'subscriptions', 'notifications', 'wishlist', 'reports'
]


