from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from datetime import datetime
from decimal import Decimal, InvalidOperation

from app import db
from app.models import Product, ProductMedia, Category, User, AdsBanner, ProductCondition
from app.services.storage import upload_file, delete_file
from app.utils import current_user_id, optional_user_id, page_args, pagination_meta, allowed_image

bp = Blueprint('products', __name__)

CONDITIONS = {c.value for c in ProductCondition}
SORTS = {
    'newest': Product.created_at.desc(),
    'price_low': Product.price.asc(),
    'price_high': Product.price.desc(),
}


def _visible_products():
    """Listings anyone can browse: not deleted, seller not suspended"""
    return Product.query.join(User, Product.user_id == User.id).filter(
        Product.is_active == True,  # noqa: E712
        User.is_active == True,  # noqa: E712
    )


def _parse_price(value):
    try:
        price = Decimal(str(value).replace(',', '').strip())
    except (InvalidOperation, AttributeError):
        return None
    return price if price >= 0 else None


def _save_images(product, files):
    """Upload new photos after the existing ones; returns an error message or None"""
    max_images = current_app.config['MAX_PRODUCT_IMAGES']
    files = [f for f in files if f and f.filename]
    if len(product.media) + len(files) > max_images:
        return f'A listing can have at most {max_images} photos'
    for f in files:
        if not allowed_image(f.filename):
            return 'Only image files (png, jpg, jpeg, gif, webp) are allowed'

    start_index = max((m.sort_order for m in product.media), default=-1) + 1
    for i, f in enumerate(files):
        order = start_index + i
        filename = f"{product.id}_{int(datetime.utcnow().timestamp())}_{order}_{secure_filename(f.filename)}"
        url = upload_file(f, filename, folder='products')
        db.session.add(ProductMedia(product_id=product.id, url=url, sort_order=order))
    return None


def _apply_fields(product, form, creating):
    """Validate and copy editable fields from the form. Returns an error message or None."""
    if creating or 'title' in form:
        title = (form.get('title') or '').strip()
        if not title:
            return 'Title is required'
        product.title = title[:200]

    if creating or 'price' in form:
        price = _parse_price(form.get('price'))
        if price is None:
            return 'Enter a valid price'
        product.price = price

    if 'description' in form:
        product.description = (form.get('description') or '').strip()

    if 'location' in form:
        product.location = (form.get('location') or '').strip()[:200] or None

    if 'condition' in form:
        condition = form.get('condition')
        if condition not in CONDITIONS:
            return 'Invalid condition'
        product.condition = condition

    if 'category_id' in form:
        category_id = form.get('category_id')
        if category_id:
            category = db.session.get(Category, int(category_id)) if str(category_id).isdigit() else None
            if not category or not category.is_active:
                return 'Invalid category'
            product.category_id = category.id
        else:
            product.category_id = None
    return None


def _get_owned_product(product_id):
    """Fetch an active product owned by the current user, or an error response"""
    product = db.session.get(Product, product_id)
    if not product or not product.is_active:
        return None, (jsonify({'message': 'Listing not found'}), 404)
    if product.user_id != current_user_id():
        return None, (jsonify({'message': 'You can only change your own listings'}), 403)
    return product, None


@bp.route('', methods=['GET'])
def list_products():
    """Browse/search listings.
    Query: q, category (slug), min_price, max_price, condition, sort (newest|price_low|price_high),
    include_sold (true|false, default false), page, limit
    """
    page, limit = page_args(request)
    query = _visible_products()

    q = (request.args.get('q') or '').strip()
    if q:
        like = f'%{q}%'
        query = query.outerjoin(Category, Product.category_id == Category.id).filter(
            db.or_(Product.title.ilike(like), Product.description.ilike(like), Category.name.ilike(like))
        )

    category_slug = request.args.get('category')
    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if not category:
            return jsonify({'products': [], 'pagination': {'page': page, 'limit': limit, 'total': 0, 'pages': 0}}), 200
        query = query.filter(Product.category_id == category.id)

    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    condition = request.args.get('condition')
    if condition in CONDITIONS:
        query = query.filter(Product.condition == condition)

    if request.args.get('include_sold', 'false').lower() != 'true':
        query = query.filter(Product.is_sold == False)  # noqa: E712

    sort = SORTS.get(request.args.get('sort'), SORTS['newest'])
    pagination = query.order_by(sort, Product.id.desc()).paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'pagination': pagination_meta(pagination),
    }), 200


@bp.route('/featured', methods=['GET'])
def featured_products():
    limit = min(request.args.get('limit', 10, type=int), 20)
    products = _visible_products().filter(
        Product.is_featured == True,  # noqa: E712
        Product.is_sold == False,  # noqa: E712
    ).order_by(Product.created_at.desc()).limit(limit).all()
    return jsonify({'products': [p.to_dict() for p in products]}), 200


@bp.route('/ads', methods=['GET'])
def get_ads():
    """Active home page banners (admin managed)"""
    ads = AdsBanner.query.filter_by(is_active=True) \
        .order_by(AdsBanner.sort_order, AdsBanner.created_at.desc()).all()
    return jsonify({'ads': [a.to_dict() for a in ads]}), 200


@bp.route('/mine', methods=['GET'])
@jwt_required()
def my_products():
    """Current user's listings, including sold ones"""
    page, limit = page_args(request, max_limit=100)
    query = Product.query.filter_by(user_id=current_user_id(), is_active=True)

    status = request.args.get('status')
    if status == 'available':
        query = query.filter_by(is_sold=False)
    elif status == 'sold':
        query = query.filter_by(is_sold=True)

    pagination = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
    return jsonify({
        'products': [p.to_dict(include_seller=False) for p in pagination.items],
        'pagination': pagination_meta(pagination),
    }), 200


@bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product or not product.is_active or not product.seller or not product.seller.is_active:
        return jsonify({'message': 'Listing not found'}), 404

    # Don't count the owner's own visits
    viewer_id = optional_user_id()
    if viewer_id != product.user_id:
        product.views = (product.views or 0) + 1
        db.session.commit()

    return jsonify({'product': product.to_dict(include_contact=viewer_id is not None)}), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    """Post a listing (multipart form: title, price, description, condition, location, category_id, images[])"""
    user = db.session.get(User, current_user_id())
    if not user or not user.is_active:
        return jsonify({'message': 'Account unavailable'}), 403

    product = Product(user_id=user.id)
    error = _apply_fields(product, request.form, creating=True)
    if error:
        return jsonify({'message': error}), 400

    images = request.files.getlist('images')
    if not any(f and f.filename for f in images):
        return jsonify({'message': 'Add at least one photo'}), 400

    db.session.add(product)
    db.session.flush()

    error = _save_images(product, images)
    if error:
        db.session.rollback()
        return jsonify({'message': error}), 400

    db.session.commit()
    return jsonify({'message': 'Listing posted', 'product': product.to_dict()}), 201


@bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Edit own listing. New photos go in images[]; remove photos via DELETE .../images/<id>."""
    product, error_response = _get_owned_product(product_id)
    if error_response:
        return error_response

    error = _apply_fields(product, request.form, creating=False)
    if error:
        return jsonify({'message': error}), 400

    images = request.files.getlist('images')
    if any(f and f.filename for f in images):
        error = _save_images(product, images)
        if error:
            db.session.rollback()
            return jsonify({'message': error}), 400

    db.session.commit()
    db.session.refresh(product)
    return jsonify({'message': 'Listing updated', 'product': product.to_dict()}), 200


@bp.route('/<int:product_id>/sold', methods=['POST'])
@jwt_required()
def set_sold(product_id):
    """Mark a listing sold or available again. Body: {"is_sold": true|false}"""
    product, error_response = _get_owned_product(product_id)
    if error_response:
        return error_response

    data = request.get_json(silent=True) or {}
    product.is_sold = bool(data.get('is_sold', True))
    db.session.commit()
    return jsonify({
        'message': 'Marked as sold' if product.is_sold else 'Marked as available',
        'product': product.to_dict(),
    }), 200


@bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Owner deletes their listing (kept in DB as inactive so chats still resolve)"""
    product, error_response = _get_owned_product(product_id)
    if error_response:
        return error_response

    product.is_active = False
    db.session.commit()
    return jsonify({'message': 'Listing deleted'}), 200


@bp.route('/<int:product_id>/images/<int:media_id>', methods=['DELETE'])
@jwt_required()
def delete_product_image(product_id, media_id):
    product, error_response = _get_owned_product(product_id)
    if error_response:
        return error_response

    media = db.session.get(ProductMedia, media_id)
    if not media or media.product_id != product.id:
        return jsonify({'message': 'Photo not found'}), 404
    if len(product.media) <= 1:
        return jsonify({'message': 'A listing needs at least one photo'}), 400

    delete_file(media.url)
    db.session.delete(media)
    db.session.commit()
    return jsonify({'message': 'Photo removed'}), 200
