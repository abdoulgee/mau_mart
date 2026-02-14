from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app import db, socketio
from app.models import Review, Product, Order, OrderStatus, Notification, User, Store

bp = Blueprint('reviews', __name__)


@bp.route('/product/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    """Get reviews for a product"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    reviews = Review.query.filter_by(
        product_id=product_id,
        is_approved=True,
        is_hidden=False
    ).order_by(Review.created_at.desc())
    
    pagination = reviews.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'reviews': [r.to_dict() for r in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_reviews():
    """Get current user's reviews"""
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    reviews = Review.query.filter_by(user_id=user_id)\
        .order_by(Review.created_at.desc())
    pagination = reviews.paginate(page=page, per_page=limit, error_out=False)

    results = []
    for r in pagination.items:
        data = r.to_dict()
        product = Product.query.get(r.product_id)
        if product:
            data['product'] = {
                'id': product.id,
                'title': product.title,
                'slug': product.slug,
                'media': [m.to_dict() for m in product.media[:1]],
            }
        results.append(data)

    return jsonify({
        'reviews': results,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_review():
    """Create a review (verified buyers only)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    product_id = data.get('product_id')
    order_id = data.get('order_id')
    rating = data.get('rating')
    comment = data.get('comment', '')
    media_urls = data.get('media_urls', [])
    
    if not product_id or not rating:
        return jsonify({'message': 'product_id and rating are required'}), 400
    
    if rating < 1 or rating > 5:
        return jsonify({'message': 'Rating must be between 1 and 5'}), 400
    
    # Verify user has purchased this product
    order = Order.query.filter_by(
        buyer_id=user_id,
        product_id=product_id,
        status=OrderStatus.COMPLETED.value
    ).first()
    
    if not order:
        return jsonify({'message': 'You must purchase this product before reviewing'}), 403
    
    # Check if already reviewed this order
    existing = Review.query.filter_by(
        user_id=user_id,
        product_id=product_id,
        order_id=order.id
    ).first()
    
    if existing:
        return jsonify({'message': 'You have already reviewed this order'}), 400
    
    review = Review(
        product_id=product_id,
        user_id=user_id,
        order_id=order.id,
        rating=rating,
        comment=comment,
        media_urls=media_urls if media_urls else None,
        is_approved=True  # Auto-approve for now
    )
    
    db.session.add(review)
    
    # Update product rating
    product = Product.query.get(product_id)
    if product:
        total_rating = (product.rating * product.total_reviews) + rating
        product.total_reviews += 1
        product.rating = round(total_rating / product.total_reviews, 1)
        
        # Update store rating
        store = product.store
        if store:
            # Recalculate store rating from all products
            all_products = store.products.all()
            if all_products:
                avg_rating = sum(p.rating for p in all_products) / len(all_products)
                store.rating = round(avg_rating, 1)
                store.total_reviews += 1
    
    db.session.flush()
    
    # Notify store owner of new review
    if product and product.store:
        reviewer = User.query.get(user_id)
        stars = '⭐' * rating
        notification = Notification(
            user_id=product.store.owner_id,
            title=f'New Review {stars}',
            message=f'{reviewer.first_name} left a {rating}-star review on {product.title}',
            notification_type='review',
            data={'product_id': product_id, 'review_id': review.id}
        )
        db.session.add(notification)
        db.session.flush()
        
        socketio.emit('notification', {
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'type': 'review',
            'data': notification.data
        }, room=f'user_{product.store.owner_id}')
    
    db.session.commit()
    
    return jsonify({
        'message': 'Review submitted successfully',
        'review': review.to_dict()
    }), 201


@bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """Delete own review"""
    user_id = int(get_jwt_identity())
    review = Review.query.get(review_id)
    
    if not review:
        return jsonify({'message': 'Review not found'}), 404
    
    if review.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Update product rating before deletion
    product = Product.query.get(review.product_id)
    if product and product.total_reviews > 1:
        total_rating = (product.rating * product.total_reviews) - review.rating
        product.total_reviews -= 1
        product.rating = round(total_rating / product.total_reviews, 1)
    elif product:
        product.rating = 0
        product.total_reviews = 0
    
    db.session.delete(review)
    db.session.commit()
    
    return jsonify({'message': 'Review deleted'}), 200
