from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room

from app import db
from app.models import User, Chat, Message

# socket sid -> user id (int)
connected_users = {}


def _chat_for_member(sid, chat_id):
    """Return (user_id, chat) if the socket's user belongs to the chat, else (None, None)"""
    user_id = connected_users.get(sid)
    if not user_id or not chat_id:
        return None, None
    try:
        chat = db.session.get(Chat, int(chat_id))
    except (TypeError, ValueError):
        return None, None
    if not chat or not chat.has_member(user_id):
        return None, None
    return user_id, chat


def register_socket_events(socketio):
    """Socket.IO is used for delivery only; messages are sent through the REST API."""

    @socketio.on('connect')
    def handle_connect(auth=None):
        token = (auth or {}).get('token') or request.args.get('token')
        if not token:
            return False

        try:
            # JWT identity is a string; chats store ints, so convert once here
            user_id = int(decode_token(token).get('sub'))
        except Exception:
            return False

        user = db.session.get(User, user_id)
        if not user or not user.is_active:
            return False

        connected_users[request.sid] = user_id
        join_room(f'user_{user_id}')
        return True

    @socketio.on('disconnect')
    def handle_disconnect(*args):
        connected_users.pop(request.sid, None)

    @socketio.on('join_chat')
    def handle_join_chat(data):
        user_id, chat = _chat_for_member(request.sid, (data or {}).get('chat_id'))
        if chat:
            join_room(f'chat_{chat.id}')
            emit('joined_chat', {'chat_id': chat.id})

    @socketio.on('leave_chat')
    def handle_leave_chat(data):
        chat_id = (data or {}).get('chat_id')
        if chat_id:
            leave_room(f'chat_{chat_id}')

    @socketio.on('typing')
    def handle_typing(data):
        user_id, chat = _chat_for_member(request.sid, (data or {}).get('chat_id'))
        if not chat:
            return
        emit('user_typing', {
            'chat_id': chat.id,
            'user_id': user_id,
            'is_typing': bool(data.get('is_typing', True)),
        }, room=f'chat_{chat.id}', include_self=False)

    @socketio.on('mark_read')
    def handle_mark_read(data):
        user_id, chat = _chat_for_member(request.sid, (data or {}).get('chat_id'))
        if not chat:
            return

        Message.query.filter(
            Message.chat_id == chat.id,
            Message.sender_id != user_id,
            Message.is_read == False,  # noqa: E712
        ).update({'is_read': True})
        db.session.commit()

        emit('messages_read', {'chat_id': chat.id, 'read_by': user_id}, room=f'chat_{chat.id}')
