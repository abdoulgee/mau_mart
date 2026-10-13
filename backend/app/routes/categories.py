from flask import Blueprint, jsonify

from app.models import Category

bp = Blueprint('categories', __name__)


@bp.route('', methods=['GET'])
def get_categories():
    categories = Category.query.filter_by(is_active=True) \
        .order_by(Category.sort_order, Category.name).all()
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200


@bp.route('/slug/<slug>', methods=['GET'])
def get_category_by_slug(slug):
    category = Category.query.filter_by(slug=slug, is_active=True).first()
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    return jsonify({'category': category.to_dict()}), 200
