"""
Monetization Routes
Handles featured listings and ad placements (WhatsApp-based payment flow)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.models import db, User, Store, Subscription, FeaturedListing, AdRequest

subscriptions_bp = Blueprint('subscriptions', __name__)




# ============== FEATURED LISTINGS ==============

FEATURED_PRICES = {
    'home_featured': {'price': 500, 'duration_days': 7, 'label': 'Home Page Featured'},
    'category_top': {'price': 300, 'duration_days': 7, 'label': 'Category Top Listing'},
    'search_boost': {'price': 200, 'duration_days': 3, 'label': 'Search Results Boost'},
}


@subscriptions_bp.route('/featured/prices', methods=['GET'])
def get_featured_prices():
    """Get featured listing prices"""
    return jsonify({'prices': FEATURED_PRICES}), 200


@subscriptions_bp.route('/featured/request', methods=['POST'])
@jwt_required()
def request_featured():
    """Request a featured listing for a product"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.store:
        return jsonify({'message': 'Store not found'}), 404
    
    data = request.get_json()
    product_id = data.get('product_id')
    listing_type = data.get('listing_type')
    payment_reference = data.get('payment_reference')
    
    if listing_type not in FEATURED_PRICES:
        return jsonify({'message': 'Invalid listing type'}), 400
    
    if not payment_reference:
        return jsonify({'message': 'Payment reference required'}), 400
    
    pricing = FEATURED_PRICES[listing_type]
    
    featured = FeaturedListing(
        product_id=product_id,
        store_id=user.store.id,
        listing_type=listing_type,
        amount_paid=pricing['price'],
        payment_reference=payment_reference,
        starts_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=pricing['duration_days']),
        status='pending'
    )
    
    db.session.add(featured)
    db.session.commit()
    
    return jsonify({
        'message': 'Featured listing request submitted',
        'featured': featured.to_dict()
    }), 201


@subscriptions_bp.route('/featured/my-listings', methods=['GET'])
@jwt_required()
def get_my_featured():
    """Get all featured listings for current store"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.store:
        return jsonify({'message': 'Store not found'}), 404
    
    listings = FeaturedListing.query.filter_by(store_id=user.store.id).order_by(
        FeaturedListing.created_at.desc()
    ).all()
    
    return jsonify({
        'listings': [l.to_dict() for l in listings]
    }), 200


# ============== AD REQUESTS ==============

AD_PLACEMENTS = {
    'home_banner': {'price': 2000, 'duration_days': 7, 'label': 'Home Page Banner'},
    'search_results': {'price': 1000, 'duration_days': 7, 'label': 'Search Results'},
    'bottom_cta': {'price': 500, 'duration_days': 3, 'label': 'Bottom CTA'},
}


@subscriptions_bp.route('/ads/placements', methods=['GET'])
def get_ad_placements():
    """Get ad placement options and prices"""
    return jsonify({'placements': AD_PLACEMENTS}), 200


@subscriptions_bp.route('/ads/request', methods=['POST'])
@jwt_required()
def request_ad():
    """Request an ad placement"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.store:
        return jsonify({'message': 'Store not found'}), 404
    
    data = request.get_json()
    placement = data.get('placement')
    image_url = data.get('image_url')
    link_url = data.get('link_url')
    payment_reference = data.get('payment_reference')
    
    if placement not in AD_PLACEMENTS:
        return jsonify({'message': 'Invalid placement'}), 400
    
    if not image_url or not payment_reference:
        return jsonify({'message': 'Image URL and payment reference required'}), 400
    
    pricing = AD_PLACEMENTS[placement]
    
    ad_request = AdRequest(
        store_id=user.store.id,
        placement=placement,
        image_url=image_url,
        link_url=link_url,
        amount_paid=pricing['price'],
        payment_reference=payment_reference,
        duration_days=pricing['duration_days'],
        status='pending'
    )
    
    db.session.add(ad_request)
    db.session.commit()
    
    return jsonify({
        'message': 'Ad request submitted for review',
        'ad_request': ad_request.to_dict()
    }), 201


@subscriptions_bp.route('/ads/my-requests', methods=['GET'])
@jwt_required()
def get_my_ad_requests():
    """Get all ad requests for current store"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.store:
        return jsonify({'message': 'Store not found'}), 404
    
    requests = AdRequest.query.filter_by(store_id=user.store.id).order_by(
        AdRequest.created_at.desc()
    ).all()
    
    return jsonify({
        'requests': [r.to_dict() for r in requests]
    }), 200


# ============== ADMIN ENDPOINTS ==============


@subscriptions_bp.route('/admin/featured', methods=['GET'])
@jwt_required()
def admin_get_featured():
    """Get all featured listings for admin"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    listings = FeaturedListing.query.order_by(FeaturedListing.created_at.desc()).all()
    
    return jsonify({
        'listings': [l.to_dict() for l in listings]
    }), 200


@subscriptions_bp.route('/admin/featured/<int:featured_id>/approve', methods=['POST'])
@jwt_required()
def admin_approve_featured(featured_id):
    """Approve a featured listing request"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    featured = FeaturedListing.query.get(featured_id)
    if not featured:
        return jsonify({'message': 'Featured listing not found'}), 404
    
    featured.status = 'approved'
    featured.approved_at = datetime.utcnow()
    featured.approved_by = user_id
    db.session.commit()
    
    return jsonify({'message': 'Featured listing approved', 'featured': featured.to_dict()}), 200


@subscriptions_bp.route('/admin/featured/<int:featured_id>/reject', methods=['POST'])
@jwt_required()
def admin_reject_featured(featured_id):
    """Reject a featured listing request"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    featured = FeaturedListing.query.get(featured_id)
    if not featured:
        return jsonify({'message': 'Featured listing not found'}), 404
    
    data = request.get_json()
    featured.status = 'rejected'
    featured.rejection_reason = data.get('reason', '')
    db.session.commit()
    
    return jsonify({'message': 'Featured listing rejected'}), 200


@subscriptions_bp.route('/admin/ads/<int:ad_id>/approve', methods=['POST'])
@jwt_required()
def admin_approve_ad(ad_id):
    """Approve an ad request"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    ad_request = AdRequest.query.get(ad_id)
    if not ad_request:
        return jsonify({'message': 'Ad request not found'}), 404
    
    ad_request.status = 'approved'
    ad_request.approved_at = datetime.utcnow()
    ad_request.starts_at = datetime.utcnow()
    ad_request.expires_at = datetime.utcnow() + timedelta(days=ad_request.duration_days)
    db.session.commit()
    
    return jsonify({'message': 'Ad approved', 'ad': ad_request.to_dict()}), 200


@subscriptions_bp.route('/admin/ads/<int:ad_id>/reject', methods=['POST'])
@jwt_required()
def admin_reject_ad(ad_id):
    """Reject an ad request"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    ad_request = AdRequest.query.get(ad_id)
    if not ad_request:
        return jsonify({'message': 'Ad request not found'}), 404
    
    data = request.get_json()
    ad_request.status = 'rejected'
    ad_request.rejection_reason = data.get('reason', '')
    db.session.commit()
    
    return jsonify({'message': 'Ad rejected'}), 200
