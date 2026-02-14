from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app import db, socketio
from app.models import Chat, Message, User, Product, Notification

bp = Blueprint('chat', __name__)


def create_notification(user_id, title, message, notification_type='chat', data=None):
    """Helper to create and emit a notification"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        data=data or {}
    )
    db.session.add(notification)
    db.session.flush()

    socketio.emit('notification', {
        'id': notification.id,
        'title': title,
        'message': message,
        'type': notification_type,
        'data': data or {}
    }, room=f'user_{user_id}')

    return notification


@bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get user's chat conversations"""
    user_id = int(get_jwt_identity())
    
    chats = Chat.query.filter(
        (Chat.user1_id == user_id) | (Chat.user2_id == user_id)
    ).order_by(Chat.last_message_at.desc()).all()
    
    return jsonify({
        'conversations': [c.to_dict(current_user_id=user_id) for c in chats]
    }), 200


@bp.route('/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_chat_messages(chat_id):
    """Get messages for a specific chat"""
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    
    chat = Chat.query.get(chat_id)
    
    if not chat:
        return jsonify({'message': 'Chat not found'}), 404
    
    # Check user is participant
    if chat.user1_id != user_id and chat.user2_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Get messages
    messages = Message.query.filter_by(chat_id=chat_id).order_by(
        Message.created_at.desc()
    ).paginate(page=page, per_page=limit, error_out=False)
    
    # Mark messages as read
    Message.query.filter(
        Message.chat_id == chat_id,
        Message.sender_id != user_id,
        Message.is_read == False
    ).update({'is_read': True})
    db.session.commit()
    
    return jsonify({
        'chat': chat.to_dict(current_user_id=user_id),
        'messages': [m.to_dict() for m in reversed(messages.items)],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': messages.total,
            'pages': messages.pages
        }
    }), 200


@bp.route('/start', methods=['POST'])
@jwt_required()
def start_chat():
    """Start or get existing chat with a seller"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    seller_id = data.get('seller_id')
    product_id = data.get('product_id')
    
    if not seller_id:
        return jsonify({'message': 'seller_id is required'}), 400
    
    if seller_id == user_id:
        return jsonify({'message': 'Cannot chat with yourself'}), 400
    
    # Check if chat exists
    chat = Chat.query.filter(
        ((Chat.user1_id == user_id) & (Chat.user2_id == seller_id)) |
        ((Chat.user1_id == seller_id) & (Chat.user2_id == user_id))
    ).first()
    
    if not chat:
        chat = Chat(
            user1_id=user_id,
            user2_id=seller_id,
            product_id=product_id
        )
        db.session.add(chat)
        db.session.commit()
    
    return jsonify({
        'chat': chat.to_dict(current_user_id=user_id)
    }), 200


@bp.route('/<int:chat_id>/send', methods=['POST'])
@jwt_required()
def send_message(chat_id):
    """Send a message in a chat (REST endpoint with real-time delivery)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    chat = Chat.query.get(chat_id)
    
    if not chat:
        return jsonify({'message': 'Chat not found'}), 404
    
    if chat.user1_id != user_id and chat.user2_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    content = data.get('content', '').strip()
    message_type = data.get('type', 'text')
    media_url = data.get('media_url')
    
    if not content and not media_url:
        return jsonify({'message': 'Message content or media required'}), 400
    
    message = Message(
        chat_id=chat_id,
        sender_id=user_id,
        content=content,
        message_type=message_type,
        media_url=media_url
    )
    
    db.session.add(message)
    chat.last_message_at = datetime.utcnow()
    
    # Get the other user
    other_user_id = chat.user2_id if chat.user1_id == user_id else chat.user1_id
    sender = User.query.get(user_id)
    
    # Create notification for the recipient
    msg_preview = content[:50] + '...' if len(content) > 50 else content
    if message_type in ('image', 'media'):
        msg_preview = '📷 Sent a photo'
    create_notification(
        user_id=other_user_id,
        title=f'New message from {sender.first_name}',
        message=msg_preview or 'Sent a media file',
        notification_type='chat',
        data={'chat_id': chat_id}
    )
    
    db.session.commit()
    
    # Emit the new message to the chat room (for real-time delivery)
    message_data = message.to_dict()
    socketio.emit('new_message', message_data, room=f'chat_{chat_id}')
    
    # Also emit to the other user's personal room (for notification badge updates)
    socketio.emit('new_message_notification', {
        'chat_id': chat_id,
        'message': message_data
    }, room=f'user_{other_user_id}')
    
    return jsonify({
        'message': message_data
    }), 201
