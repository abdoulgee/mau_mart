from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models import Wishlist, Product
from app.utils import current_user_id, page_args, pagination_meta

bp = Blueprint('wishlist', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_wishlist():
    """Saved listings (deleted listings are hidden; sold ones are shown with is_sold)"""
    page, limit = page_args(request)
    pagination = Wishlist.query.join(Product).filter(
        Wishlist.user_id == current_user_id(),
        Product.is_active == True,  # noqa: E712
    ).order_by(Wishlist.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        'items': [{
            'id': item.id,
            'product_id': item.product_id,
            'created_at': item.created_at.isoformat() if item.created_at else None,
            'product': item.product.to_dict(),
        } for item in pagination.items],
        'pagination': pagination_meta(pagination),
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    user_id = current_user_id()
    product_id = (request.get_json() or {}).get('product_id')
    if not product_id:
        return jsonify({'message': 'product_id is required'}), 400

    product = db.session.get(Product, int(product_id))
    if not product or not product.is_active:
        return jsonify({'message': 'Listing not found'}), 404

    if Wishlist.query.filter_by(user_id=user_id, product_id=product.id).first():
        return jsonify({'message': 'Already saved'}), 200

    db.session.add(Wishlist(user_id=user_id, product_id=product.id))
    db.session.commit()
    return jsonify({'message': 'Saved'}), 201


@bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(product_id):
    item = Wishlist.query.filter_by(user_id=current_user_id(), product_id=product_id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return jsonify({'message': 'Removed from saved items'}), 200


@bp.route('/check/<int:product_id>', methods=['GET'])
@jwt_required()
def check_wishlist(product_id):
    item = Wishlist.query.filter_by(user_id=current_user_id(), product_id=product_id).first()
    return jsonify({'is_saved': item is not None}), 200
