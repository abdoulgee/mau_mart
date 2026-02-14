from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import User

bp = Blueprint('users', __name__)


@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Check if request is JSON or form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    # Update allowed fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'student_id' in data:
        new_sid = data['student_id'].strip() if data['student_id'] else None
        if new_sid and new_sid != user.student_id:
            existing = User.query.filter_by(student_id=new_sid).first()
            if existing and existing.id != user.id:
                return jsonify({'message': 'Student ID already in use'}), 409
        user.student_id = new_sid
    
    # Handle profile picture upload
    if 'profile_picture' in request.files:
        from flask import current_app
        from werkzeug.utils import secure_filename
        import os
        
        file = request.files['profile_picture']
        if file and file.filename:
            # Create upload directory if it doesn't exist
            upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'users')
            os.makedirs(upload_folder, exist_ok=True)
            
            # Generate filename
            filename = f"user_{user_id}_{secure_filename(file.filename)}"
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            
            # Update avatar URL
            user.avatar_url = f'/api/v1/uploads/users/{filename}'
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password for authenticated user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    if not user.check_password(current_password):
        return jsonify({'message': 'Current password is incorrect'}), 400
    
    if len(new_password) < 8:
        return jsonify({'message': 'New password must be at least 8 characters'}), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200


@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get public user profile"""
    user = User.query.get(user_id)
    
    if not user or not user.is_active:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200
