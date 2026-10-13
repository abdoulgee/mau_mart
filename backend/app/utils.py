from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from app import db, socketio
from app.models import User, Notification, UserRole, ADMIN_ROLES


def current_user_id():
    """JWT identity is stored as a string; the database uses ints"""
    return int(get_jwt_identity())


def optional_user_id():
    """Current user's id if a token was sent, else None (for public endpoints).
    An expired token still gets a 401 so the client refreshes instead of silently browsing as a guest."""
    verify_jwt_in_request(optional=True)
    identity = get_jwt_identity()
    return int(identity) if identity else None


def pagination_meta(pagination):
    return {
        'page': pagination.page,
        'limit': pagination.per_page,
        'total': pagination.total,
        'pages': pagination.pages,
    }


def page_args(request, default_limit=20, max_limit=50):
    page = max(request.args.get('page', 1, type=int), 1)
    limit = min(max(request.args.get('limit', default_limit, type=int), 1), max_limit)
    return page, limit


def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user = db.session.get(User, current_user_id())
        if not user or not user.is_active or user.role not in ADMIN_ROLES:
            return jsonify({'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def super_admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user = db.session.get(User, current_user_id())
        if not user or not user.is_active or user.role != UserRole.SUPER_ADMIN.value:
            return jsonify({'message': 'Super admin access required'}), 403
        return f(*args, **kwargs)
    return decorated


def create_notification(user_id, title, message, notification_type='general', data=None):
    """Store a notification and push it to the user's socket room. Caller commits."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        data=data or {},
    )
    db.session.add(notification)
    db.session.flush()
    socketio.emit('notification', notification.to_dict(), room=f'user_{user_id}')
    return notification


def normalize_whatsapp(raw, default_country_code='234'):
    """Turn '0803 123 4567' or '+234 803...' into wa.me format ('2348031234567'). None if invalid."""
    digits = ''.join(ch for ch in str(raw or '') if ch.isdigit())
    if digits.startswith('0'):
        digits = default_country_code + digits[1:]
    if not 10 <= len(digits) <= 15:
        return None
    return digits


def allowed_image(filename):
    if '.' not in filename:
        return False
    return filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_IMAGE_EXTENSIONS']
