from .auth import bp as auth
from .users import bp as users
from .products import bp as products
from .categories import bp as categories
from .chat import bp as chat
from .admin import bp as admin
from .uploads import bp as uploads
from .notifications import bp as notifications
from .wishlist import bp as wishlist
from .reports import bp as reports

__all__ = [
    'auth', 'users', 'products', 'categories', 'chat',
    'admin', 'uploads', 'notifications', 'wishlist', 'reports',
]
