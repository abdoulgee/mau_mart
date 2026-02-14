from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room
from jwt.exceptions import InvalidTokenError

from app import db
from app.models import User, Chat, Message

# Store connected users
connected_users = {}


def register_socket_events(socketio):
    """Register Socket.IO events for real-time chat"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        token = request.args.get('token')
        
        if not token:
            return False
        
        try:
            payload = decode_token(token)
            user_id = payload.get('sub')
            
            if not user_id:
                return False
            
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return False
            
            # Store connection
            connected_users[request.sid] = {
                'user_id': user_id,
                'username': f"{user.first_name} {user.last_name}"
            }
            
            # Join personal room
            join_room(f'user_{user_id}')
            
            # Notify that user is online
            emit('user_online', {'user_id': user_id}, broadcast=True)
            
            print(f"User {user_id} connected via Socket.IO")
            return True
            
        except (InvalidTokenError, Exception) as e:
            print(f"Socket auth failed: {str(e)}")
            return False
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        user_data = connected_users.pop(request.sid, None)
        
        if user_data:
            user_id = user_data['user_id']
            leave_room(f'user_{user_id}')
            emit('user_offline', {'user_id': user_id}, broadcast=True)
            print(f"User {user_id} disconnected")
    
    @socketio.on('join_chat')
    def handle_join_chat(data):
        """Join a specific chat room"""
        user_data = connected_users.get(request.sid)
        if not user_data:
            return
        
        chat_id = data.get('chat_id')
        if not chat_id:
            return
        
        user_id = user_data['user_id']
        
        # Verify user is part of this chat
        chat = Chat.query.get(chat_id)
        if not chat:
            return
        
        if chat.user1_id != user_id and chat.user2_id != user_id:
            return
        
        join_room(f'chat_{chat_id}')
        emit('joined_chat', {'chat_id': chat_id})
    
    @socketio.on('leave_chat')
    def handle_leave_chat(data):
        """Leave a chat room"""
        chat_id = data.get('chat_id')
        if chat_id:
            leave_room(f'chat_{chat_id}')
    
    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle sending a message"""
        user_data = connected_users.get(request.sid)
        if not user_data:
            emit('error', {'message': 'Not authenticated'})
            return
        
        chat_id = data.get('chat_id')
        content = data.get('content', '').strip()
        message_type = data.get('type', 'text')
        media_url = data.get('media_url')
        
        if not chat_id or (not content and not media_url):
            emit('error', {'message': 'Invalid message data'})
            return
        
        user_id = user_data['user_id']
        
        # Verify user is part of this chat
        chat = Chat.query.get(chat_id)
        if not chat or (chat.user1_id != user_id and chat.user2_id != user_id):
            emit('error', {'message': 'Unauthorized'})
            return
        
        # Create message
        message = Message(
            chat_id=chat_id,
            sender_id=user_id,
            content=content,
            message_type=message_type,
            media_url=media_url
        )
        
        from datetime import datetime
        chat.last_message_at = datetime.utcnow()
        
        db.session.add(message)
        db.session.commit()
        
        # Get the other user
        other_user_id = chat.user2_id if chat.user1_id == user_id else chat.user1_id
        
        # Emit to chat room
        emit('new_message', message.to_dict(), room=f'chat_{chat_id}')
        
        # Also emit to other user's personal room (for notification)
        emit('new_message_notification', {
            'chat_id': chat_id,
            'message': message.to_dict()
        }, room=f'user_{other_user_id}')
    
    @socketio.on('typing')
    def handle_typing(data):
        """Handle typing indicator"""
        user_data = connected_users.get(request.sid)
        if not user_data:
            return
        
        chat_id = data.get('chat_id')
        is_typing = data.get('is_typing', True)
        
        if not chat_id:
            return
        
        emit('user_typing', {
            'chat_id': chat_id,
            'user_id': user_data['user_id'],
            'is_typing': is_typing
        }, room=f'chat_{chat_id}', include_self=False)
    
    @socketio.on('mark_read')
    def handle_mark_read(data):
        """Mark messages as read"""
        user_data = connected_users.get(request.sid)
        if not user_data:
            return
        
        chat_id = data.get('chat_id')
        if not chat_id:
            return
        
        user_id = user_data['user_id']
        
        # Mark messages from other user as read
        Message.query.filter(
            Message.chat_id == chat_id,
            Message.sender_id != user_id,
            Message.is_read == False
        ).update({'is_read': True})
        
        db.session.commit()
        
        # Notify the chat room
        emit('messages_read', {
            'chat_id': chat_id,
            'read_by': user_id
        }, room=f'chat_{chat_id}')
