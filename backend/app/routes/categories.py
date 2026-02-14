from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import Category, Product

bp = Blueprint('categories', __name__)


@bp.route('', methods=['GET'])
def get_categories():
    """Get all active categories"""
    categories = Category.query.filter_by(
        is_active=True
    ).order_by(Category.sort_order, Category.name).all()
    
    return jsonify({
        'categories': [c.to_dict() for c in categories]
    }), 200


@bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Get single category"""
    category = Category.query.get(category_id)
    
    if not category or not category.is_active:
        return jsonify({'message': 'Category not found'}), 404
    
    return jsonify({'category': category.to_dict()}), 200


@bp.route('/slug/<slug>', methods=['GET'])
def get_category_by_slug(slug):
    """Get category by slug"""
    category = Category.query.filter_by(slug=slug, is_active=True).first()
    
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    
    return jsonify({'category': category.to_dict()}), 200


@bp.route('/slug/<slug>/products', methods=['GET'])
def get_category_products_by_slug(slug):
    """Get products in a category by slug"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    sort = request.args.get('sort', 'newest')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    category = Category.query.filter_by(slug=slug, is_active=True).first()
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    
    # Query products in this category
    query = Product.query.filter(
        Product.categories.contains(category),
        Product.is_active == True
    )
    
    # Apply filters
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Apply sorting
    if sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    elif sort == 'price_low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_high':
        query = query.order_by(Product.price.desc())
    elif sort == 'popular':
        query = query.order_by(Product.total_orders.desc())
    elif sort == 'rating':
        query = query.order_by(Product.rating.desc())
    else:
        query = query.order_by(Product.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'category': category.to_dict(),
        'products': [p.to_dict(include_store=True) for p in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/<int:category_id>/products', methods=['GET'])
def get_category_products(category_id):
    """Get products in a category"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    sort = request.args.get('sort', 'newest')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    
    # Query products in this category
    query = Product.query.filter(
        Product.categories.contains(category),
        Product.is_active == True
    )
    
    # Apply filters
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Apply sorting
    if sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    elif sort == 'price_low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_high':
        query = query.order_by(Product.price.desc())
    elif sort == 'popular':
        query = query.order_by(Product.total_orders.desc())
    elif sort == 'rating':
        query = query.order_by(Product.rating.desc())
    else:
        query = query.order_by(Product.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'category': category.to_dict(),
        'products': [p.to_dict(include_store=True) for p in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200
