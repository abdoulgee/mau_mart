from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db
from app.models import Notification
from app.utils import current_user_id, page_args, pagination_meta

bp = Blueprint('notifications', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = current_user_id()
    page, limit = page_args(request)

    query = Notification.query.filter_by(user_id=user_id)
    if request.args.get('unread_only', 'false').lower() == 'true':
        query = query.filter_by(is_read=False)

    pagination = query.order_by(Notification.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        'notifications': [n.to_dict() for n in pagination.items],
        'pagination': pagination_meta(pagination),
        'unread_count': Notification.query.filter_by(user_id=user_id, is_read=False).count(),
    }), 200


@bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    notification = db.session.get(Notification, notification_id)
    if not notification or notification.user_id != current_user_id():
        return jsonify({'message': 'Notification not found'}), 404

    notification.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'}), 200


@bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    Notification.query.filter_by(user_id=current_user_id(), is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200
