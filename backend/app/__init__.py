import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO(manage_session=False)


def create_app(config_name=None):
    """Application factory for creating Flask app"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    frontend_url = app.config.get('FRONTEND_URL', 'http://localhost:5173')
    allowed_origins = list({
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        frontend_url,
    })
    CORS(app, resources={r"/api/*": {"origins": allowed_origins, "supports_credentials": True}})
    socketio.init_app(
        app,
        cors_allowed_origins=allowed_origins,
        async_mode=app.config.get('SOCKETIO_ASYNC_MODE', 'eventlet'),
        manage_session=False,
    )

    for folder in ('products', 'chat', 'users', 'ads', 'site'):
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], folder), exist_ok=True)

    from . import models  # noqa: F401  (registers models)

    # Schema is managed by migrations (`flask db upgrade`); tests create tables themselves
    if not app.testing:
        with app.app_context():
            _seed_admin(app)

    from .routes import auth, users, products, categories, chat, admin, uploads, notifications, wishlist, reports

    app.register_blueprint(auth, url_prefix='/api/v1/auth')
    app.register_blueprint(users, url_prefix='/api/v1/users')
    app.register_blueprint(products, url_prefix='/api/v1/products')
    app.register_blueprint(categories, url_prefix='/api/v1/categories')
    app.register_blueprint(chat, url_prefix='/api/v1/chat')
    app.register_blueprint(admin, url_prefix='/api/v1/admin')
    app.register_blueprint(uploads, url_prefix='/api/v1/uploads')
    app.register_blueprint(notifications, url_prefix='/api/v1/notifications')
    app.register_blueprint(wishlist, url_prefix='/api/v1/wishlist')
    app.register_blueprint(reports, url_prefix='/api/v1/reports')

    from .sockets import register_socket_events
    register_socket_events(socketio)

    @app.cli.command('seed')
    def seed_command():
        """Create the super admin and starter categories (safe to run more than once)."""
        from .models import Category
        _seed_admin(app)
        added = 0
        for order, (name, slug, icon) in enumerate(DEFAULT_CATEGORIES):
            if not Category.query.filter_by(slug=slug).first():
                db.session.add(Category(name=name, slug=slug, icon=icon, sort_order=order))
                added += 1
        db.session.commit()
        print(f'Seeded {added} categories')

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired', 'error': 'token_expired'}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'Invalid token', 'error': 'invalid_token'}, 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return {'message': 'Missing authorization token', 'error': 'authorization_required'}, 401

    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'app': 'MAU MART API'}

    @app.route('/api/v1/settings')
    def public_settings():
        from .models import AppSettings
        row = AppSettings.query.first()
        return {'settings': row.data if row else {}}

    @app.before_request
    def check_maintenance_mode():
        # Health, settings, auth and admin stay reachable so admins can log in and switch it off
        allowed_prefixes = ['/api/health', '/api/v1/settings', '/api/v1/auth', '/api/v1/admin', '/api/v1/uploads']
        if not request.path.startswith('/api/') or any(request.path.startswith(p) for p in allowed_prefixes):
            return None

        from .models import get_setting
        try:
            if get_setting('maintenance_mode', False):
                return jsonify({'message': 'Site is currently under maintenance. Please try again later.'}), 503
        except Exception:
            db.session.rollback()
        return None

    return app


# (name, slug, Lucide icon name) — icons must exist in the frontend's CATEGORY_ICONS map
DEFAULT_CATEGORIES = [
    ('Phones & Gadgets', 'phones-gadgets', 'smartphone'),
    ('Laptops & Computers', 'laptops-computers', 'laptop'),
    ('Books & Stationery', 'books-stationery', 'book-open'),
    ('Fashion', 'fashion', 'shirt'),
    ('Hostel & Room Items', 'hostel-room-items', 'bed-double'),
    ('Food & Drinks', 'food-drinks', 'utensils'),
    ('Services', 'services', 'wrench'),
    ('Other', 'other', 'package'),
]


def _seed_admin(app):
    """Create the super admin from ADMIN_EMAIL / ADMIN_PASSWORD if no such user exists."""
    from .models import User, UserRole

    admin_email = os.getenv('ADMIN_EMAIL', 'admin@maumart.com').lower()
    admin_password = os.getenv('ADMIN_PASSWORD')

    if not admin_password:
        if app.config.get('IS_PRODUCTION'):
            print('⚠️  ADMIN_PASSWORD not set — skipping super admin seeding')
            return
        admin_password = 'Admin123!'  # local development only

    try:
        user = User.query.filter_by(email=admin_email).first()
        if user:
            if user.role != UserRole.SUPER_ADMIN.value or not user.is_verified or not user.is_active:
                user.role = UserRole.SUPER_ADMIN.value
                user.is_verified = True
                user.is_active = True
                db.session.commit()
            return

        user = User(
            first_name='Super',
            last_name='Admin',
            email=admin_email,
            phone='00000000000',
            role=UserRole.SUPER_ADMIN.value,
            is_verified=True,
            is_active=True,
        )
        user.set_password(admin_password)
        db.session.add(user)
        db.session.commit()
        print(f'🔑 Super admin created: {admin_email} (change the password after first login)')
    except Exception as e:
        db.session.rollback()
        print(f'⚠️  Could not seed admin (run `flask db upgrade` first?): {type(e).__name__}')
