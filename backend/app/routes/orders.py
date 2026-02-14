from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

from app import db, socketio
from app.models import Order, OrderStatus, Product, Store, User, Chat, Message, Notification

bp = Blueprint('orders', __name__)


def generate_order_number():
    """Generate a unique order number"""
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M')
    unique_id = str(uuid.uuid4())[:6].upper()
    return f'ORD-{timestamp}-{unique_id}'


def create_notification(user_id, title, message, notification_type='order', data=None):
    """Helper to create and emit a notification"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        data=data or {}
    )
    db.session.add(notification)
    db.session.flush()  # Get the ID
    
    # Emit real-time notification via WebSocket
    socketio.emit('notification', {
        'id': notification.id,
        'title': title,
        'message': message,
        'type': notification_type,
        'data': data or {}
    }, room=f'user_{user_id}')
    
    return notification


def emit_order_status_update(order, buyer_id, seller_id):
    """Emit order status update to both buyer and seller"""
    order_data = order.to_dict(include_details=True)
    
    # Emit to buyer
    socketio.emit('order_status_update', {
        'order_id': order.id,
        'status': order.status,
        'order': order_data
    }, room=f'user_{buyer_id}')
    
    # Emit to seller
    socketio.emit('order_status_update', {
        'order_id': order.id,
        'status': order.status,
        'order': order_data
    }, room=f'user_{seller_id}')


@bp.route('', methods=['GET'])
@jwt_required()
def get_my_orders():
    """Get current user's orders as buyer"""
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    
    query = Order.query.filter_by(buyer_id=user_id)
    
    if status:
        query = query.filter_by(status=status)
    
    query = query.order_by(Order.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'orders': [o.to_dict(include_details=True) for o in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/seller', methods=['GET'])
@jwt_required()
def get_seller_orders():
    """Get orders for current user's store"""
    user_id = int(get_jwt_identity())
    store = Store.query.filter_by(owner_id=user_id).first()
    
    if not store:
        return jsonify({'message': 'You do not have a store'}), 404
    
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    
    query = Order.query.filter_by(store_id=store.id)
    
    if status:
        query = query.filter_by(status=status)
    
    query = query.order_by(Order.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'orders': [o.to_dict(include_details=True) for o in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get single order detail"""
    user_id = int(get_jwt_identity())
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    # Check if user is buyer or seller
    if order.buyer_id != user_id and order.store.owner_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    return jsonify({'order': order.to_dict(include_details=True)}), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    """Create a new order (manual payment flow)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    buyer_note = data.get('buyer_note', '')
    
    # Validate product
    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({'message': 'Product not found'}), 404
    
    if not product.is_in_stock or product.stock_quantity < quantity:
        return jsonify({'message': 'Product out of stock'}), 400
    
    # Prevent buying own products
    if product.store.owner_id == user_id:
        return jsonify({'message': 'You cannot buy your own products'}), 400
    
    # Calculate total
    total_price = float(product.price) * quantity
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        buyer_id=user_id,
        store_id=product.store_id,
        product_id=product_id,
        quantity=quantity,
        unit_price=product.price,
        total_price=total_price,
        buyer_note=buyer_note,
        status=OrderStatus.PENDING_PAYMENT.value
    )
    
    db.session.add(order)
    db.session.commit()
    
    # Notify seller of new order
    buyer = User.query.get(user_id)
    create_notification(
        user_id=product.store.owner_id,
        title='New Order! 🛒',
        message=f'{buyer.first_name} placed an order for {product.title} (×{quantity}). Total: ₦{total_price:,.0f}',
        notification_type='order',
        data={'order_id': order.id}
    )
    db.session.commit()
    
    # Return order with seller bank details
    response = order.to_dict(include_details=True)
    response['bank_details'] = {
        'bank_name': product.store.bank_name,
        'account_number': product.store.account_number,
        'account_name': product.store.account_name
    }
    
    return jsonify({
        'message': 'Order created. Please complete payment.',
        'order': response
    }), 201


@bp.route('/<int:order_id>/confirm-payment', methods=['POST'])
@jwt_required()
def confirm_payment(order_id):
    """Buyer confirms they have made payment"""
    user_id = int(get_jwt_identity())
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    if order.buyer_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    if order.status != OrderStatus.PENDING_PAYMENT.value:
        return jsonify({'message': 'Invalid order status'}), 400
    
    # Update status
    order.status = OrderStatus.AWAITING_APPROVAL.value
    order.payment_confirmed_at = datetime.utcnow()
    
    # Get store and product info
    store = Store.query.get(order.store_id)
    product = Product.query.get(order.product_id)
    buyer = User.query.get(user_id)
    
    # Find or create chat between buyer and store owner
    chat = Chat.query.filter(
        ((Chat.user1_id == user_id) & (Chat.user2_id == store.owner_id)) |
        ((Chat.user1_id == store.owner_id) & (Chat.user2_id == user_id))
    ).first()
    
    if not chat:
        chat = Chat(
            user1_id=user_id,
            user2_id=store.owner_id,
            product_id=order.product_id
        )
        db.session.add(chat)
        db.session.flush()
    
    # Create receipt message with order details
    receipt_content = f"""📧 PAYMENT RECEIPT

Order: #{order.order_number}
Product: {product.title}
Quantity: {order.quantity}
Amount: ₦{float(order.total_price):,.2f}

Status: Awaiting your approval
Buyer: {buyer.first_name} {buyer.last_name}

Please verify and approve/reject this payment."""

    message = Message(
        chat_id=chat.id,
        sender_id=user_id,
        content=receipt_content,
        message_type='receipt',
        order_id=order.id
    )
    db.session.add(message)
    chat.last_message_at = datetime.utcnow()
    
    # Create notification for seller
    create_notification(
        user_id=store.owner_id,
        title='Payment Received',
        message=f'{buyer.first_name} has made payment for order #{order.order_number}. Please verify and approve.',
        notification_type='order',
        data={'order_id': order.id, 'chat_id': chat.id}
    )
    
    db.session.commit()
    
    # Emit real-time order status update
    emit_order_status_update(order, user_id, store.owner_id)
    
    # Emit new message to chat room
    socketio.emit('new_message', message.to_dict(), room=f'chat_{chat.id}')
    socketio.emit('new_message_notification', {
        'chat_id': chat.id,
        'message': message.to_dict()
    }, room=f'user_{store.owner_id}')
    
    return jsonify({
        'message': 'Payment confirmation sent to seller',
        'order': order.to_dict(include_details=True),
        'chat_id': chat.id
    }), 200


@bp.route('/<int:order_id>/approve', methods=['POST'])
@jwt_required()
def approve_order(order_id):
    """Seller approves an order after confirming payment"""
    user_id = int(get_jwt_identity())
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    if order.store.owner_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    if order.status != OrderStatus.AWAITING_APPROVAL.value:
        return jsonify({'message': 'Invalid order status'}), 400
    
    # Update status
    order.status = OrderStatus.APPROVED.value
    order.approved_at = datetime.utcnow()
    
    # Update product stock
    product = Product.query.get(order.product_id)
    if product:
        product.stock_quantity -= order.quantity
        product.total_orders += 1
        if product.stock_quantity <= 0:
            product.is_in_stock = False
    
    # Update store total orders
    store = order.store
    store.total_orders += 1
    
    # Find chat between buyer and seller
    chat = Chat.query.filter(
        ((Chat.user1_id == order.buyer_id) & (Chat.user2_id == user_id)) |
        ((Chat.user1_id == user_id) & (Chat.user2_id == order.buyer_id))
    ).first()
    
    if chat:
        # Send approval message to chat
        approval_message = Message(
            chat_id=chat.id,
            sender_id=user_id,
            content=f"✅ PAYMENT APPROVED\n\nOrder #{order.order_number} has been approved!\n\nYour order is ready for pickup. Please contact the seller to arrange pickup.",
            message_type='receipt',
            order_id=order.id
        )
        db.session.add(approval_message)
        chat.last_message_at = datetime.utcnow()
    
    # Create notification for buyer
    seller = User.query.get(user_id)
    create_notification(
        user_id=order.buyer_id,
        title='Payment Approved! ✅',
        message=f'Your payment for order #{order.order_number} has been approved by {seller.first_name}. Your order is ready for pickup!',
        notification_type='order',
        data={'order_id': order.id, 'chat_id': chat.id if chat else None}
    )
    
    db.session.commit()
    
    # Emit real-time order status update
    emit_order_status_update(order, order.buyer_id, user_id)
    
    # Emit new message to chat room
    if chat:
        socketio.emit('new_message', approval_message.to_dict(), room=f'chat_{chat.id}')
        socketio.emit('new_message_notification', {
            'chat_id': chat.id,
            'message': approval_message.to_dict()
        }, room=f'user_{order.buyer_id}')
    
    return jsonify({
        'message': 'Order approved successfully',
        'order': order.to_dict(include_details=True)
    }), 200


@bp.route('/<int:order_id>/reject', methods=['POST'])
@jwt_required()
def reject_order(order_id):
    """Seller rejects an order"""
    user_id = int(get_jwt_identity())
    order = Order.query.get(order_id)
    data = request.get_json() or {}
    
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    if order.store.owner_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    if order.status != OrderStatus.AWAITING_APPROVAL.value:
        return jsonify({'message': 'Invalid order status'}), 400
    
    # Update status
    reason = data.get('reason', 'Payment not confirmed')
    order.status = OrderStatus.REJECTED.value
    order.seller_note = reason
    
    # Find chat between buyer and seller
    chat = Chat.query.filter(
        ((Chat.user1_id == order.buyer_id) & (Chat.user2_id == user_id)) |
        ((Chat.user1_id == user_id) & (Chat.user2_id == order.buyer_id))
    ).first()
    
    if chat:
        # Send rejection message to chat
        rejection_message = Message(
            chat_id=chat.id,
            sender_id=user_id,
            content=f"❌ PAYMENT REJECTED\n\nOrder #{order.order_number} has been rejected.\n\nReason: {reason}\n\nPlease contact the seller for more information.",
            message_type='receipt',
            order_id=order.id
        )
        db.session.add(rejection_message)
        chat.last_message_at = datetime.utcnow()
    
    # Create notification for buyer
    seller = User.query.get(user_id)
    create_notification(
        user_id=order.buyer_id,
        title='Payment Rejected ❌',
        message=f'Your payment for order #{order.order_number} was rejected. Reason: {reason}',
        notification_type='order',
        data={'order_id': order.id, 'chat_id': chat.id if chat else None}
    )
    
    db.session.commit()
    
    # Emit real-time order status update
    emit_order_status_update(order, order.buyer_id, user_id)
    
    # Emit new message to chat room
    if chat:
        socketio.emit('new_message', rejection_message.to_dict(), room=f'chat_{chat.id}')
        socketio.emit('new_message_notification', {
            'chat_id': chat.id,
            'message': rejection_message.to_dict()
        }, room=f'user_{order.buyer_id}')
    
    return jsonify({
        'message': 'Order rejected',
        'order': order.to_dict(include_details=True)
    }), 200


@bp.route('/<int:order_id>/complete', methods=['POST'])
@jwt_required()
def complete_order(order_id):
    """Mark order as completed (buyer received the item)"""
    user_id = int(get_jwt_identity())
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    if order.buyer_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    if order.status != OrderStatus.APPROVED.value:
        return jsonify({'message': 'Invalid order status'}), 400
    
    order.status = OrderStatus.COMPLETED.value
    order.completed_at = datetime.utcnow()
    
    # Notify seller of order completion
    buyer = User.query.get(user_id)
    create_notification(
        user_id=order.store.owner_id,
        title='Order Completed ✅',
        message=f'{buyer.first_name} confirmed receipt of order #{order.order_number}.',
        notification_type='order',
        data={'order_id': order.id}
    )
    
    db.session.commit()
    
    # Emit real-time update
    emit_order_status_update(order, user_id, order.store.owner_id)
    
    return jsonify({
        'message': 'Order completed. Please leave a review!',
        'order': order.to_dict(include_details=True)
    }), 200
