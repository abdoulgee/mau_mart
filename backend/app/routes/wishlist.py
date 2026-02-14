from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import Wishlist, Product

bp = Blueprint('wishlist', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_wishlist():
    """Get current user's saved items"""
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    items = Wishlist.query.filter_by(user_id=user_id)\
        .order_by(Wishlist.created_at.desc())
    pagination = items.paginate(page=page, per_page=limit, error_out=False)

    results = []
    for item in pagination.items:
        product = Product.query.get(item.product_id)
        if product and product.is_active:
            results.append({
                'id': item.id,
                'product_id': item.product_id,
                'created_at': item.created_at.isoformat() if item.created_at else None,
                'product': product.to_dict(include_store=True),
            })

    return jsonify({
        'items': results,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    """Save a product to wishlist"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    product_id = data.get('product_id')

    if not product_id:
        return jsonify({'message': 'product_id is required'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    existing = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return jsonify({'message': 'Product already saved'}), 400

    item = Wishlist(user_id=user_id, product_id=product_id)
    db.session.add(item)
    db.session.commit()

    return jsonify({'message': 'Product saved', 'id': item.id}), 201


@bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(product_id):
    """Remove a product from wishlist"""
    user_id = int(get_jwt_identity())

    item = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
    if not item:
        return jsonify({'message': 'Item not in wishlist'}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({'message': 'Product removed from saved items'}), 200


@bp.route('/check/<int:product_id>', methods=['GET'])
@jwt_required()
def check_wishlist(product_id):
    """Check if a product is in the user's wishlist"""
    user_id = int(get_jwt_identity())

    item = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()

    return jsonify({'is_saved': item is not None}), 200
