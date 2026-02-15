from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename
from app.services.storage import upload_file

bp = Blueprint('uploads', __name__)


def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


@bp.route('/users/<filename>')
def serve_user_media(filename):
    """Serve user profile pictures (local fallback only)"""
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'users')
    return send_from_directory(upload_folder, filename)


@bp.route('/products/<filename>')
def serve_product_media(filename):
    """Serve product media files (local fallback only)"""
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'products')
    return send_from_directory(upload_folder, filename)


@bp.route('/stores/<filename>')
def serve_store_media(filename):
    """Serve store media files (local fallback only)"""
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'stores')
    return send_from_directory(upload_folder, filename)


@bp.route('/chat/<filename>')
def serve_chat_media(filename):
    """Serve chat media files (local fallback only)"""
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'chat')
    return send_from_directory(upload_folder, filename)


@bp.route('/reviews/<filename>')
def serve_review_media(filename):
    """Serve review media files (local fallback only)"""
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reviews')
    return send_from_directory(upload_folder, filename)


@bp.route('/ads/<filename>')
def serve_ad_media(filename):
    """Serve ad banner files (local fallback only)"""
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'ads')
    return send_from_directory(upload_folder, filename)


@bp.route('/chat', methods=['POST'])
@jwt_required()
def upload_chat_media():
    """Upload media for chat"""
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    allowed = current_app.config['ALLOWED_IMAGE_EXTENSIONS'] | current_app.config['ALLOWED_VIDEO_EXTENSIONS']
    
    if not allowed_file(file.filename, allowed):
        return jsonify({'message': 'File type not allowed'}), 400
    
    user_id = int(get_jwt_identity())
    filename = f"{user_id}_{int(os.times()[4] * 1000)}_{secure_filename(file.filename)}"
    
    url = upload_file(file, filename, folder='chat')
    
    return jsonify({'url': url}), 201


@bp.route('/review', methods=['POST'])
@jwt_required()
def upload_review_media():
    """Upload media for review"""
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    allowed = current_app.config['ALLOWED_IMAGE_EXTENSIONS'] | current_app.config['ALLOWED_VIDEO_EXTENSIONS']
    
    if not allowed_file(file.filename, allowed):
        return jsonify({'message': 'File type not allowed'}), 400
    
    user_id = int(get_jwt_identity())
    filename = f"review_{user_id}_{int(os.times()[4] * 1000)}_{secure_filename(file.filename)}"
    
    url = upload_file(file, filename, folder='reviews')
    
    return jsonify({'url': url}), 201


@bp.route('/store', methods=['POST'])
@jwt_required()
def upload_store_media():
    """Upload store logo/banner"""
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    allowed = current_app.config['ALLOWED_IMAGE_EXTENSIONS']
    
    if not allowed_file(file.filename, allowed):
        return jsonify({'message': 'Only images allowed'}), 400
    
    user_id = int(get_jwt_identity())
    media_type = request.form.get('type', 'logo')  # logo or banner
    filename = f"store_{user_id}_{media_type}_{secure_filename(file.filename)}"
    
    url = upload_file(file, filename, folder='stores')
    
    return jsonify({'url': url}), 201
