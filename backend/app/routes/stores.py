from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import re
import os
from werkzeug.utils import secure_filename

from app import db
from app.models import Store, StoreRequest, User, Product, StoreRequestStatus

bp = Blueprint('stores', __name__)


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


@bp.route('', methods=['GET'])
def get_stores():
    """Get all active stores"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    store_type = request.args.get('type')
    featured = request.args.get('featured', 'false').lower() == 'true'
    
    query = Store.query.filter_by(is_active=True)
    
    if store_type:
        query = query.filter_by(store_type=store_type)
    if featured:
        query = query.filter_by(is_featured=True)
    
    query = query.order_by(Store.rating.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'stores': [s.to_dict() for s in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/top-rated', methods=['GET'])
def get_top_rated_stores():
    """Get top rated stores for home page"""
    limit = request.args.get('limit', 6, type=int)
    
    stores = Store.query.filter_by(
        is_active=True
    ).order_by(Store.rating.desc(), Store.total_orders.desc()).limit(limit).all()
    
    return jsonify({
        'stores': [s.to_dict() for s in stores]
    }), 200


@bp.route('/<int:store_id>', methods=['GET'])
def get_store(store_id):
    """Get single store detail"""
    store = Store.query.get(store_id)
    
    if not store or not store.is_active:
        return jsonify({'message': 'Store not found'}), 404
    
    return jsonify({'store': store.to_dict()}), 200


@bp.route('/slug/<slug>', methods=['GET'])
def get_store_by_slug(slug):
    """Get store by slug"""
    store = Store.query.filter_by(slug=slug, is_active=True).first()
    
    if not store:
        return jsonify({'message': 'Store not found'}), 404
    
    return jsonify({'store': store.to_dict()}), 200


@bp.route('/<int:store_id>/products', methods=['GET'])
def get_store_products(store_id):
    """Get products from a specific store"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    store = Store.query.get(store_id)
    if not store or not store.is_active:
        return jsonify({'message': 'Store not found'}), 404
    
    products = Product.query.filter_by(
        store_id=store_id, 
        is_active=True
    ).order_by(Product.created_at.desc())
    
    pagination = products.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/my-store', methods=['GET'])
@jwt_required()
def get_my_store():
    """Get current user's store"""
    user_id = int(get_jwt_identity())
    store = Store.query.filter_by(owner_id=user_id).first()
    
    if not store:
        return jsonify({'message': 'You do not have a store yet'}), 404
    
    return jsonify({'store': store.to_dict(include_bank=True)}), 200


@bp.route('/my-store', methods=['PUT'])
@jwt_required()
def update_my_store():
    """Update current user's store"""
    user_id = int(get_jwt_identity())
    store = Store.query.filter_by(owner_id=user_id).first()
    
    if not store:
        return jsonify({'message': 'You do not have a store yet'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    updatable = ['name', 'description', 'address', 'phone', 'email', 'is_open',
                 'bank_name', 'account_number', 'account_name']
    
    for field in updatable:
        if field in data:
            setattr(store, field, data[field])
    
    store.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Store updated successfully',
        'store': store.to_dict(include_bank=True)
    }), 200


# Store Request endpoints
@bp.route('/request', methods=['POST'])
@jwt_required()
def create_store_request():
    """Submit a request to become a seller"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if user.is_seller:
        return jsonify({'message': 'You are already a seller'}), 400
    
    # Check for pending or approved request - only allow if rejected or no request
    existing = StoreRequest.query.filter(
        StoreRequest.user_id == user_id,
        StoreRequest.status.in_([StoreRequestStatus.PENDING.value, StoreRequestStatus.APPROVED.value])
    ).first()
    
    if existing:
        if existing.status == StoreRequestStatus.PENDING.value:
            return jsonify({'message': 'You already have a pending request'}), 400
        else:
            return jsonify({'message': 'You already have an approved store'}), 400
    
    data = request.get_json()
    
    store_request = StoreRequest(
        user_id=user_id,
        store_name=data.get('store_name'),
        store_type=data.get('store_type', 'general'),
        description=data.get('description'),
        business_address=data.get('business_address'),
        phone=data.get('phone'),
        email=data.get('email'),
        id_document_url=data.get('id_document_url')
    )
    
    db.session.add(store_request)
    db.session.commit()
    
    return jsonify({
        'message': 'Store request submitted successfully. We will review it shortly.',
        'request': store_request.to_dict()
    }), 201


@bp.route('/request/status', methods=['GET'])
@jwt_required()
def get_store_request_status():
    """Get current user's store request status"""
    user_id = int(get_jwt_identity())
    
    request_obj = StoreRequest.query.filter_by(user_id=user_id).order_by(
        StoreRequest.created_at.desc()
    ).first()
    
    if not request_obj:
        return jsonify({'message': 'No store request found'}), 404
    
    return jsonify({'request': request_obj.to_dict()}), 200
