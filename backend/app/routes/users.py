from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from datetime import datetime

from app import db
from app.models import User, Product
from app.services.storage import upload_file
from app.utils import current_user_id, optional_user_id, normalize_whatsapp, allowed_image, page_args, pagination_meta

bp = Blueprint('users', __name__)


@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user = db.session.get(User, current_user_id())
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update own profile. Accepts JSON or multipart (with optional 'avatar' file)."""
    user = db.session.get(User, current_user_id())
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json() if request.is_json else request.form.to_dict()

    for field in ('first_name', 'last_name', 'phone'):
        if field in data:
            value = (data[field] or '').strip()
            if not value:
                return jsonify({'message': f'{field.replace("_", " ").capitalize()} cannot be empty'}), 400
            setattr(user, field, value)

    if 'bio' in data:
        user.bio = (data['bio'] or '').strip()[:300] or None

    if 'whatsapp' in data:
        raw = (data['whatsapp'] or '').strip()
        if raw:
            whatsapp = normalize_whatsapp(raw)
            if not whatsapp:
                return jsonify({'message': 'Enter a valid WhatsApp number'}), 400
            user.whatsapp = whatsapp
        else:
            user.whatsapp = None

    if 'student_id' in data:
        new_sid = (data['student_id'] or '').strip() or None
        if new_sid and new_sid != user.student_id:
            existing = User.query.filter_by(student_id=new_sid).first()
            if existing and existing.id != user.id:
                return jsonify({'message': 'Student ID already in use'}), 409
        user.student_id = new_sid

    avatar = request.files.get('avatar')
    if avatar and avatar.filename:
        if not allowed_image(avatar.filename):
            return jsonify({'message': 'Profile picture must be an image'}), 400
        filename = f"user_{user.id}_{int(datetime.utcnow().timestamp())}_{secure_filename(avatar.filename)}"
        user.avatar_url = upload_file(avatar, filename, folder='users')

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user = db.session.get(User, current_user_id())
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json() or {}
    if not user.check_password(data.get('current_password') or ''):
        return jsonify({'message': 'Current password is incorrect'}), 400

    new_password = data.get('new_password') or ''
    if len(new_password) < 8:
        return jsonify({'message': 'New password must be at least 8 characters'}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'}), 200


@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Public seller profile"""
    user = db.session.get(User, user_id)
    if not user or not user.is_active:
        return jsonify({'message': 'User not found'}), 404

    data = user.to_public_dict(include_contact=optional_user_id() is not None)
    data['active_listings'] = user.products.filter_by(is_active=True, is_sold=False).count()
    data['sold_listings'] = user.products.filter_by(is_active=True, is_sold=True).count()
    return jsonify({'user': data}), 200


@bp.route('/<int:user_id>/products', methods=['GET'])
def get_user_products(user_id):
    """A user's visible listings (available first, then sold)"""
    user = db.session.get(User, user_id)
    if not user or not user.is_active:
        return jsonify({'message': 'User not found'}), 404

    page, limit = page_args(request)
    pagination = Product.query.filter_by(user_id=user_id, is_active=True) \
        .order_by(Product.is_sold.asc(), Product.created_at.desc()) \
        .paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        'products': [p.to_dict(include_seller=False) for p in pagination.items],
        'pagination': pagination_meta(pagination),
    }), 200
