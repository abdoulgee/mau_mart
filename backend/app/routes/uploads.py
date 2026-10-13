from flask import Blueprint, request, jsonify, send_from_directory, current_app, abort
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from datetime import datetime
import os

from app.services.storage import upload_file
from app.utils import current_user_id, allowed_image, super_admin_required

bp = Blueprint('uploads', __name__)

# Folders served from local disk when Supabase storage isn't configured
SERVED_FOLDERS = {'products', 'chat', 'users', 'ads', 'site'}


@bp.route('/<folder>/<filename>')
def serve_media(folder, filename):
    if folder not in SERVED_FOLDERS:
        abort(404)
    return send_from_directory(os.path.join(current_app.config['UPLOAD_FOLDER'], folder), filename)


def _upload(folder, prefix):
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'message': 'No file provided'}), 400
    if not allowed_image(file.filename):
        return jsonify({'message': 'Only image files are allowed'}), 400

    filename = f"{prefix}_{int(datetime.utcnow().timestamp() * 1000)}_{secure_filename(file.filename)}"
    return jsonify({'url': upload_file(file, filename, folder=folder)}), 201


@bp.route('/chat', methods=['POST'])
@jwt_required()
def upload_chat_image():
    return _upload('chat', str(current_user_id()))


@bp.route('/site', methods=['POST'])
@super_admin_required
def upload_site_image():
    """Super admin uploads (site logo, home intro background)"""
    return _upload('site', 'site')
