"""
Subscription and Premium Features Routes
Handles seller subscriptions, featured listings, and ad placements
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.models import db, User, Store, Subscription, FeaturedListing, AdRequest

subscriptions_bp = Blueprint('subscriptions', __name__)


# ============== SUBSCRIPTION PLANS ==============

SUBSCRIPTION_PLANS = {
    'basic': {
        'name': 'Basic',
        'price': 0,
        'duration_days': 0,  # Free forever
        'max_products': 10,
        'featured_slots': 0,
        'priority_support': False,
        'analytics': False,
        'verified_badge': False
    },
    'starter': {
        'name': 'Starter',
        'price': 2000,  # NGN
        'duration_days': 30,
        'max_products': 30,
        'featured_slots': 1,
        'priority_support': False,
        'analytics': True,
        'verified_badge': False
    },
    'professional': {
        'name': 'Professional',
        'price': 5000,
        'duration_days': 30,
        'max_products': 100,
        'featured_slots': 3,
        'priority_support': True,
        'analytics': True,
        'verified_badge': True
    },
    'enterprise': {
        'name': 'Enterprise',
        'price': 10000,
        'duration_days': 30,
        'max_products': -1,  # Unlimited
        'featured_slots': 10,
        'priority_support': True,
        'analytics': True,
        'verified_badge': True
    }
}


@subscriptions_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get all available subscription plans"""
    return jsonify({'plans': SUBSCRIPTION_PLANS}), 200


@subscriptions_bp.route('/my-subscription', methods=['GET'])
@jwt_required()
def get_my_subscription():
    """Get current user's subscription status"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.store:
        return jsonify({'message': 'Store not found'}), 404
    
    subscription = Subscription.query.filter_by(
        store_id=user.store.id,
        is_active=True
    ).first()
    
    if not subscription:
        return jsonify({
            'subscription': None,
            'plan': SUBSCRIPTION_PLANS['basic'],
            'plan_key': 'basic'
        }), 200
    
    return jsonify({
        'subscription': subscription.to_dict(),
        'plan': SUBSCRIPTION_PLANS.get(subscription.plan, SUBSCRIPTION_PLANS['basic']),
        'plan_key': subscription.plan
    }), 200


@subscriptions_bp.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe():
    """Subscribe to a plan"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.store:
        return jsonify({'message': 'You must have a store to subscribe'}), 400
    
    data = request.get_json()
    plan_key = data.get('plan')
    payment_reference = data.get('payment_reference')
    
    if plan_key not in SUBSCRIPTION_PLANS:
        return jsonify({'message': 'Invalid plan'}), 400
    
    plan = SUBSCRIPTION_PLANS[plan_key]
    
    if plan['price'] > 0 and not payment_reference:
        return jsonify({'message': 'Payment reference required for paid plans'}), 400
    
    # Deactivate existing subscriptions
    Subscription.query.filter_by(store_id=user.store.id, is_active=True).update({
        'is_active': False
    })
    
    # Create new subscription
    subscription = Subscription(
        store_id=user.store.id,
        plan=plan_key,
        amount_paid=plan['price'],
        payment_reference=payment_reference,
        starts_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=plan['duration_days']) if plan['duration_days'] > 0 else None,
        is_active=True
    )
    
    db.session.add(subscription)
    
    # Update store verification if plan includes badge
    if plan['verified_badge']:
        user.store.is_verified = True
    
    db.session.commit()
    
    return jsonify({
        'message': f'Successfully subscribed to {plan["name"]} plan',
        'subscription': subscription.to_dict()
    }), 201


@subscriptions_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancel current subscription"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.store:
        return jsonify({'message': 'Store not found'}), 404
    
    subscription = Subscription.query.filter_by(
        store_id=user.store.id,
        is_active=True
    ).first()
    
    if not subscription:
        return jsonify({'message': 'No active subscription found'}), 404
    
    subscription.is_active = False
    subscription.cancelled_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Subscription cancelled'}), 200


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
    'category_sidebar': {'price': 1000, 'duration_days': 7, 'label': 'Category Sidebar'},
    'product_interstitial': {'price': 500, 'duration_days': 3, 'label': 'Product Page Ad'},
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

@subscriptions_bp.route('/admin/subscriptions', methods=['GET'])
@jwt_required()
def admin_get_subscriptions():
    """Get all subscriptions (admin only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    subscriptions = Subscription.query.order_by(Subscription.created_at.desc()).limit(100).all()
    
    return jsonify({
        'subscriptions': [s.to_dict() for s in subscriptions]
    }), 200


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
