from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import os
import re
from werkzeug.utils import secure_filename

from app import db
from app.models import Product, ProductMedia, Store, Category, User, ProductType, Review, Order, OrderStatus, AdsBanner

bp = Blueprint('products', __name__)


def slugify(text):
    """Convert text to URL-friendly slug"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


@bp.route('', methods=['GET'])
def get_products():
    """Get all active products with pagination"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    product_type = request.args.get('type')
    
    query = Product.query.filter_by(is_active=True)
    
    if product_type:
        query = query.filter_by(product_type=product_type)
    
    query = query.order_by(Product.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'products': [p.to_dict(include_store=True) for p in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/ads', methods=['GET'])
def get_ads():
    """Get active and approved ad banners"""
    position = request.args.get('position')
    now = datetime.utcnow()
    
    query = AdsBanner.query.filter(
        AdsBanner.is_active == True,
        AdsBanner.is_approved == True,
        AdsBanner.starts_at <= now,
        AdsBanner.ends_at >= now
    )
    
    if position:
        query = query.filter_by(position=position)
    
    ads = query.order_by(AdsBanner.created_at.desc()).all()
    
    return jsonify({
        'ads': [a.to_dict() for a in ads]
    }), 200


@bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get featured products for home page"""
    limit = request.args.get('limit', 10, type=int)
    
    products = Product.query.filter_by(
        is_active=True, 
        is_featured=True
    ).order_by(Product.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'products': [p.to_dict(include_store=True) for p in products]
    }), 200


@bp.route('/recent', methods=['GET'])
def get_recent_products():
    """Get recently added products"""
    limit = request.args.get('limit', 10, type=int)
    
    products = Product.query.filter_by(
        is_active=True
    ).order_by(Product.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'products': [p.to_dict(include_store=True) for p in products]
    }), 200


@bp.route('/search', methods=['GET'])
def search_products():
    """Search products by title"""
    query = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    if not query:
        return jsonify({'products': [], 'pagination': {}}), 200
    
    products = Product.query.outerjoin(Product.categories).filter(
        Product.is_active == True,
        db.or_(
            Product.title.ilike(f'%{query}%'),
            Category.name.ilike(f'%{query}%')
        )
    ).distinct().order_by(Product.created_at.desc())
    
    pagination = products.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'products': [p.to_dict(include_store=True) for p in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product detail"""
    product = Product.query.get(product_id)
    
    if not product or not product.is_active:
        return jsonify({'message': 'Product not found'}), 404
    
    # Increment views
    product.views += 1
    db.session.commit()
    
    return jsonify({
        'product': product.to_dict(include_store=True)
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product (seller only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.is_seller:
        return jsonify({'message': 'You must be a seller to create products'}), 403
    
    store = Store.query.filter_by(owner_id=user_id).first()
    if not store:
        return jsonify({'message': 'You need a store to create products'}), 403
    
    # Handle form data
    title = request.form.get('title')
    description = request.form.get('description', '')
    price = request.form.get('price', type=float)
    compare_price = request.form.get('compare_price', type=float)
    product_type = request.form.get('product_type', ProductType.PHYSICAL.value)
    stock_quantity = request.form.get('stock_quantity', 1, type=int)
    pickup_location = request.form.get('pickup_location', '')
    prep_time = request.form.get('prep_time', '')
    category_ids = request.form.getlist('category_ids')
    
    if not title or not price:
        return jsonify({'message': 'Title and price are required'}), 400
    
    # Create product
    product = Product(
        store_id=store.id,
        title=title,
        slug=slugify(title) + '-' + str(int(datetime.utcnow().timestamp())),
        description=description,
        price=price,
        compare_price=compare_price,
        product_type=product_type,
        stock_quantity=stock_quantity,
        pickup_location=pickup_location,
        prep_time=prep_time
    )
    
    # Add categories
    if category_ids:
        categories = Category.query.filter(Category.id.in_(category_ids)).all()
        product.categories = categories
    
    db.session.add(product)
    db.session.flush()  # Get the product ID
    
    # Handle media uploads
    media_files = request.files.getlist('media')
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'products')
    
    for i, file in enumerate(media_files[:4]):  # Max 4 media files
        if file and file.filename:
            filename = f"{product.id}_{i}_{secure_filename(file.filename)}"
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            
            # Determine media type
            extension = filename.rsplit('.', 1)[-1].lower()
            media_type = 'video' if extension in current_app.config.get('ALLOWED_VIDEO_EXTENSIONS', []) else 'image'
            
            media = ProductMedia(
                product_id=product.id,
                url=f'/api/v1/uploads/products/{filename}',
                media_type=media_type,
                sort_order=i
            )
            db.session.add(media)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Product created successfully',
        'product': product.to_dict()
    }), 201


@bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update a product (owner only)"""
    user_id = int(get_jwt_identity())
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    if product.store.owner_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Update fields
    if 'title' in request.form:
        product.title = request.form['title']
    if 'description' in request.form:
        product.description = request.form['description']
    if 'price' in request.form:
        product.price = float(request.form['price'])
    if 'compare_price' in request.form:
        product.compare_price = float(request.form['compare_price']) if request.form['compare_price'] else None
    if 'stock_quantity' in request.form:
        product.stock_quantity = int(request.form['stock_quantity'])
    if 'is_in_stock' in request.form:
        product.is_in_stock = request.form['is_in_stock'].lower() == 'true'
    if 'pickup_location' in request.form:
        product.pickup_location = request.form['pickup_location']
    if 'prep_time' in request.form:
        product.prep_time = request.form['prep_time']
    
    # Update categories
    category_ids = request.form.getlist('category_ids')
    if category_ids:
        categories = Category.query.filter(Category.id.in_(category_ids)).all()
        product.categories = categories
    
    # Handle new media uploads
    media_files = request.files.getlist('media')
    if media_files and media_files[0].filename:
        # Count existing media
        existing_count = ProductMedia.query.filter_by(product_id=product.id).count()
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'products')
        
        for i, file in enumerate(media_files[:4 - existing_count]):
            if file and file.filename:
                filename = f"{product.id}_{existing_count + i}_{secure_filename(file.filename)}"
                filepath = os.path.join(upload_folder, filename)
                file.save(filepath)
                
                extension = filename.rsplit('.', 1)[-1].lower()
                media_type = 'video' if extension in current_app.config.get('ALLOWED_VIDEO_EXTENSIONS', []) else 'image'
                
                media = ProductMedia(
                    product_id=product.id,
                    url=f'/api/v1/uploads/products/{filename}',
                    media_type=media_type,
                    sort_order=existing_count + i
                )
                db.session.add(media)
    
    product.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict()
    }), 200


@bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete a product (owner only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    # Allow deletion if user is the owner OR is an admin
    is_owner = product.store.owner_id == user_id
    is_admin = user and user.role in ['admin', 'super_admin']
    
    if not is_owner and not is_admin:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Soft delete
    product.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'}), 200


@bp.route('/<int:product_id>/media/<int:media_id>', methods=['DELETE'])
@jwt_required()
def delete_product_media(product_id, media_id):
    """Delete a product media (owner only)"""
    user_id = int(get_jwt_identity())
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    if product.store.owner_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    media = ProductMedia.query.get(media_id)
    if not media or media.product_id != product_id:
        return jsonify({'message': 'Media not found'}), 404
    
    db.session.delete(media)
    db.session.commit()
    
    return jsonify({'message': 'Media deleted successfully'}), 200


# Review endpoints
@bp.route('/<int:product_id>/reviews', methods=['GET'])
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
    
    # Calculate stats
    all_reviews = Review.query.filter_by(
        product_id=product_id,
        is_approved=True,
        is_hidden=False
    ).all()
    
    total = len(all_reviews)
    average = sum(r.rating for r in all_reviews) / total if total > 0 else 0
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in all_reviews:
        distribution[r.rating] = distribution.get(r.rating, 0) + 1
    
    return jsonify({
        'reviews': [r.to_dict() for r in pagination.items],
        'stats': {
            'average': round(average, 1),
            'total': total,
            'distribution': distribution
        },
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/<int:product_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(product_id):
    """Create a review (verified buyers only)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    order_id = data.get('order_id')
    rating = data.get('rating')
    comment = data.get('comment', '')
    media_urls = data.get('media_urls', [])
    
    if not product_id or not rating:
        return jsonify({'message': 'product_id and rating are required'}), 400
    
    if rating < 1 or rating > 5:
        return jsonify({'message': 'Rating must be between 1 and 5'}), 400
    
    # Verify user has purchased this product (approved or completed orders)
    order = Order.query.filter(
        Order.buyer_id == user_id,
        Order.product_id == product_id,
        Order.status.in_([OrderStatus.APPROVED.value, OrderStatus.COMPLETED.value])
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
    
    db.session.commit()
    
    return jsonify({
        'message': 'Review submitted successfully',
        'review': review.to_dict()
    }), 201

