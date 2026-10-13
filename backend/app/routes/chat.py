from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime

from app import db, socketio
from app.models import Chat, Message, User, Product
from app.utils import current_user_id, create_notification, page_args, pagination_meta

bp = Blueprint('chat', __name__)


def _find_chat(user_a, user_b):
    return Chat.query.filter(
        ((Chat.user1_id == user_a) & (Chat.user2_id == user_b)) |
        ((Chat.user1_id == user_b) & (Chat.user2_id == user_a))
    ).first()


@bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = current_user_id()
    chats = Chat.query.filter(
        (Chat.user1_id == user_id) | (Chat.user2_id == user_id)
    ).order_by(Chat.last_message_at.desc()).all()

    return jsonify({'conversations': [c.to_dict(current_user_id=user_id) for c in chats]}), 200


@bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = current_user_id()
    count = Message.query.join(Chat).filter(
        (Chat.user1_id == user_id) | (Chat.user2_id == user_id),
        Message.sender_id != user_id,
        Message.is_read == False,  # noqa: E712
    ).count()
    return jsonify({'unread_count': count}), 200


@bp.route('/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_chat_messages(chat_id):
    user_id = current_user_id()
    page, limit = page_args(request, default_limit=50, max_limit=100)

    chat = db.session.get(Chat, chat_id)
    if not chat or not chat.has_member(user_id):
        return jsonify({'message': 'Chat not found'}), 404

    messages = Message.query.filter_by(chat_id=chat_id) \
        .order_by(Message.created_at.desc()) \
        .paginate(page=page, per_page=limit, error_out=False)

    updated = Message.query.filter(
        Message.chat_id == chat_id,
        Message.sender_id != user_id,
        Message.is_read == False,  # noqa: E712
    ).update({'is_read': True})
    db.session.commit()
    if updated:
        socketio.emit('messages_read', {'chat_id': chat_id, 'read_by': user_id}, room=f'chat_{chat_id}')

    return jsonify({
        'chat': chat.to_dict(current_user_id=user_id),
        'messages': [m.to_dict() for m in reversed(messages.items)],
        'pagination': pagination_meta(messages),
    }), 200


@bp.route('/start', methods=['POST'])
@jwt_required()
def start_chat():
    """Open (or reuse) the chat with another user, optionally about a listing.
    Body: {"product_id": 12} or {"user_id": 7}
    """
    user_id = current_user_id()
    data = request.get_json() or {}

    product = None
    other_id = data.get('user_id')
    if data.get('product_id'):
        product = db.session.get(Product, int(data['product_id']))
        if not product or not product.is_active:
            return jsonify({'message': 'Listing not found'}), 404
        other_id = product.user_id

    if not other_id:
        return jsonify({'message': 'product_id or user_id is required'}), 400
    other_id = int(other_id)

    if other_id == user_id:
        return jsonify({'message': 'This is your own listing'}), 400

    other = db.session.get(User, other_id)
    if not other or not other.is_active:
        return jsonify({'message': 'User not found'}), 404

    chat = _find_chat(user_id, other_id)
    if not chat:
        chat = Chat(user1_id=user_id, user2_id=other_id)
        db.session.add(chat)
    if product:
        chat.product_id = product.id
    db.session.commit()

    return jsonify({'chat': chat.to_dict(current_user_id=user_id)}), 200


@bp.route('/<int:chat_id>/send', methods=['POST'])
@jwt_required()
def send_message(chat_id):
    user_id = current_user_id()
    data = request.get_json() or {}

    chat = db.session.get(Chat, chat_id)
    if not chat or not chat.has_member(user_id):
        return jsonify({'message': 'Chat not found'}), 404

    content = (data.get('content') or '').strip()
    media_url = data.get('media_url')
    if not content and not media_url:
        return jsonify({'message': 'Message content or image required'}), 400

    message = Message(
        chat_id=chat_id,
        sender_id=user_id,
        content=content or None,
        message_type='image' if media_url else 'text',
        media_url=media_url,
    )
    db.session.add(message)
    chat.last_message_at = datetime.utcnow()

    other_user_id = chat.other_user_id(user_id)
    sender = db.session.get(User, user_id)
    preview = '📷 Photo' if media_url and not content else (content[:60] + ('…' if len(content) > 60 else ''))
    create_notification(
        user_id=other_user_id,
        title=f'New message from {sender.first_name}',
        message=preview,
        notification_type='chat',
        data={'chat_id': chat_id},
    )
    db.session.commit()

    message_data = message.to_dict()
    socketio.emit('new_message', message_data, room=f'chat_{chat_id}')
    socketio.emit('new_message_notification', {'chat_id': chat_id, 'message': message_data},
                  room=f'user_{other_user_id}')

    return jsonify({'message': message_data}), 201
