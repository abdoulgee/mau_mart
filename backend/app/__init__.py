import os
from flask import Flask, jsonify
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
socketio = SocketIO()


def create_app(config_name=None):
    """Application factory for creating Flask app"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "supports_credentials": True
        }
    })
    socketio.init_app(app, cors_allowed_origins="*", async_mode='eventlet')
    
    # Create upload folder if not exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'products'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'stores'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'chat'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'reviews'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'users'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'ads'), exist_ok=True)
    
    # Import models to register them
    from . import models
    
    # Auto-create any missing tables (safe no-op for existing tables)
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    from .routes import auth, users, stores, products, categories, orders, chat, reviews, admin, uploads, subscriptions, notifications, wishlist, reports
    
    app.register_blueprint(auth, url_prefix='/api/v1/auth')
    app.register_blueprint(users, url_prefix='/api/v1/users')
    app.register_blueprint(stores, url_prefix='/api/v1/stores')
    app.register_blueprint(products, url_prefix='/api/v1/products')
    app.register_blueprint(categories, url_prefix='/api/v1/categories')
    app.register_blueprint(orders, url_prefix='/api/v1/orders')
    app.register_blueprint(chat, url_prefix='/api/v1/chat')
    app.register_blueprint(reviews, url_prefix='/api/v1/reviews')
    app.register_blueprint(admin, url_prefix='/api/v1/admin')
    app.register_blueprint(uploads, url_prefix='/api/v1/uploads')
    app.register_blueprint(subscriptions, url_prefix='/api/v1/subscriptions')
    app.register_blueprint(notifications, url_prefix='/api/v1/notifications')
    app.register_blueprint(wishlist, url_prefix='/api/v1/wishlist')
    app.register_blueprint(reports, url_prefix='/api/v1/reports')
    # Register socket events
    from .sockets import register_socket_events
    register_socket_events(socketio)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"DEBUG: Token expired. Header: {jwt_header}, Payload: {jwt_payload}")
        return {'message': 'Token has expired', 'error': 'token_expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"DEBUG: Invalid token. Error: {error}")
        return {'message': 'Invalid token', 'error': 'invalid_token'}, 401
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        print(f"DEBUG: Missing authorization token. Error: {error}")
        return {'message': 'Missing authorization token', 'error': 'authorization_required'}, 401
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'app': 'MAU MART API'}
    
    # Public settings endpoint (no auth required)
    @app.route('/api/v1/settings')
    def public_settings():
        from .models import AppSettings
        row = AppSettings.query.first()
        return {'settings': row.data if row else {}}
    
    # Maintenance mode middleware
    @app.before_request
    def check_maintenance_mode():
        from flask import request as req
        # Allow health check, settings, auth, and admin routes through
        allowed_prefixes = ['/api/health', '/api/v1/settings', '/api/v1/auth', '/api/v1/admin']
        if any(req.path.startswith(p) for p in allowed_prefixes):
            return None
        
        from .models import AppSettings
        try:
            row = AppSettings.query.first()
            if row and row.data and row.data.get('maintenance_mode', False):
                return jsonify({'message': 'Site is currently under maintenance. Please try again later.'}), 503
        except:
            pass
        return None
    
    return app
