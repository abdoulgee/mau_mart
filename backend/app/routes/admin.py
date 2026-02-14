from flask import Blueprint, request, jsonify, current_app
from app import db, socketio
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from functools import wraps
import re
import os
from werkzeug.utils import secure_filename

from app.models import (
    User, UserRole, Store, StoreRequest, StoreRequestStatus, Product, 
    Category, Order, Report, AdsBanner, SmtpConfig, ActivityLog, Review, Notification, AdminRole, AppSettings
)
from app.services.email import send_smtp_email

bp = Blueprint('admin', __name__)


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        # Convert string identity to int for database query
        user = User.query.get(int(user_id))
        
        if not user or user.role not in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value, UserRole.SUPPORT_ADMIN.value]:
            return jsonify({'message': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated


def super_admin_required(f):
    """Decorator to require super admin role"""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        # Convert string identity to int for database query
        user = User.query.get(int(user_id))
        
        if not user or user.role != UserRole.SUPER_ADMIN.value:
            return jsonify({'message': 'Super admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


# Dashboard
@bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    """Get admin dashboard stats"""
    total_users = User.query.filter_by(is_active=True).count()
    total_sellers = User.query.filter_by(is_seller=True).count()
    total_stores = Store.query.filter_by(is_active=True).count()
    total_products = Product.query.filter_by(is_active=True).count()
    total_orders = Order.query.count()
    pending_requests = StoreRequest.query.filter_by(status=StoreRequestStatus.PENDING.value).count()
    pending_reports = Report.query.filter_by(status='pending').count()
    
    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_sellers': total_sellers,
            'total_stores': total_stores,
            'total_products': total_products,
            'total_orders': total_orders,
            'pending_requests': pending_requests,
            'pending_reports': pending_reports
        }
    }), 200


# User Management
@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users with pagination"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    search = request.args.get('search', '')
    role = request.args.get('role')
    
    query = User.query
    
    if search:
        query = query.filter(
            (User.first_name.ilike(f'%{search}%')) |
            (User.last_name.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )
    
    if role:
        query = query.filter_by(role=role)
    
    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'users': [u.to_dict(include_sensitive=True) for u in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    """Suspend or activate a user"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    user.is_active = not user.is_active
    db.session.commit()
    
    status = 'activated' if user.is_active else 'suspended'
    return jsonify({
        'message': f'User {status} successfully',
        'user': user.to_dict(include_sensitive=True)
    }), 200


@bp.route('/users/<int:user_id>/role', methods=['PUT'])
@super_admin_required
def update_user_role(user_id):
    """Update user role (super admin only)"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in [r.value for r in UserRole]:
        return jsonify({'message': 'Invalid role'}), 400
    
    user.role = new_role
    
    # If making admin, also set is_seller if needed
    if new_role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]:
        user.is_seller = True
    
    db.session.commit()
    
    return jsonify({
        'message': 'Role updated successfully',
        'user': user.to_dict(include_sensitive=True)
    }), 200


@bp.route('/users/<int:user_id>/edit', methods=['PUT'])
@admin_required
def edit_user(user_id):
    """Edit user personal information"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if data.get('first_name'):
        user.first_name = data['first_name'].strip()
    if data.get('last_name'):
        user.last_name = data['last_name'].strip()
    
    # Email change — check uniqueness
    new_email = data.get('email', '').strip().lower()
    if new_email and new_email != user.email:
        existing = User.query.filter_by(email=new_email).first()
        if existing:
            return jsonify({'message': 'Email already in use by another user'}), 409
        user.email = new_email
    
    if 'phone' in data:
        user.phone = data['phone'].strip() if data['phone'] else user.phone
    
    # Student ID — check uniqueness
    new_sid = data.get('student_id', '').strip() if data.get('student_id') else None
    if new_sid and new_sid != user.student_id:
        existing = User.query.filter_by(student_id=new_sid).first()
        if existing:
            return jsonify({'message': 'Student ID already in use by another user'}), 409
        user.student_id = new_sid
    elif new_sid is None and 'student_id' in data:
        user.student_id = None
    
    db.session.commit()
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict(include_sensitive=True)
    }), 200


@bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@super_admin_required
def admin_reset_user_password(user_id):
    """Admin resets a user's password"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    new_password = data.get('new_password', '').strip()
    
    if not new_password or len(new_password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters'}), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({'message': f'Password reset successfully for {user.email}'}), 200


# Store Request Management
@bp.route('/store-requests', methods=['GET'])
@admin_required
def get_store_requests():
    """Get pending store requests"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status', StoreRequestStatus.PENDING.value)
    
    query = StoreRequest.query.filter_by(status=status).order_by(StoreRequest.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'requests': [r.to_dict() for r in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/store-requests/<int:request_id>/approve', methods=['POST'])
@admin_required
def approve_store_request(request_id):
    """Approve a store request - ATOMIC OPERATION"""
    admin_id = int(get_jwt_identity())
    store_request = StoreRequest.query.get(request_id)
    
    if not store_request:
        return jsonify({'message': 'Request not found'}), 404
    
    if store_request.status != StoreRequestStatus.PENDING.value:
        return jsonify({'message': 'Request already processed'}), 400
    
    # 1. Update request status
    store_request.status = StoreRequestStatus.APPROVED.value
    store_request.reviewed_by = admin_id
    store_request.reviewed_at = datetime.utcnow()
    
    # 2. Check if store already exists (update) or create new
    store = Store.query.filter_by(owner_id=store_request.user_id).first()
    
    if store:
        # Update existing store
        store.name = store_request.store_name
        store.description = store_request.description
        store.address = store_request.business_address
        store.phone = store_request.phone
        store.email = store_request.email
        store.store_type = store_request.store_type
        store.is_active = True  # Ensure store is ACTIVE
        store.updated_at = datetime.utcnow()
    else:
        # Create new store with ACTIVE status
        store = Store(
            owner_id=store_request.user_id,
            name=store_request.store_name,
            slug=slugify(store_request.store_name) + '-' + str(store_request.user_id),
            description=store_request.description,
            address=store_request.business_address,
            phone=store_request.phone,
            email=store_request.email,
            store_type=store_request.store_type,
            is_active=True  # Explicitly set store as ACTIVE
        )
        db.session.add(store)
    
    # 3. Update user to seller role
    user = User.query.get(store_request.user_id)
    if user:
        user.is_seller = True
        user.role = UserRole.SELLER.value
    
    # 4. Create notification for the user
    notification = Notification(
        user_id=store_request.user_id,
        title='Store Approved',
        message='Your store has been approved. You can now manage your store and post products.',
        notification_type='store_approved',
        data={'store_name': store_request.store_name}
    )
    db.session.add(notification)
    
    # Commit all changes atomically
    db.session.commit()
    
    return jsonify({
        'message': 'Store request approved',
        'store': store.to_dict()
    }), 200


@bp.route('/store-requests/<int:request_id>/reject', methods=['POST'])
@admin_required
def reject_store_request(request_id):
    """Reject a store request"""
    admin_id = int(get_jwt_identity())
    data = request.get_json()
    
    store_request = StoreRequest.query.get(request_id)
    
    if not store_request:
        return jsonify({'message': 'Request not found'}), 404
    
    if store_request.status != StoreRequestStatus.PENDING.value:
        return jsonify({'message': 'Request already processed'}), 400
    
    rejection_reason = data.get('reason', 'Request rejected')
    
    store_request.status = StoreRequestStatus.REJECTED.value
    store_request.reviewed_by = admin_id
    store_request.reviewed_at = datetime.utcnow()
    store_request.admin_notes = rejection_reason
    
    # Create rejection notification for the user
    notification = Notification(
        user_id=store_request.user_id,
        title='Store Request Rejected',
        message=f'Your store request for "{store_request.store_name}" was rejected. Reason: {rejection_reason}',
        notification_type='store_rejected',
        data={'store_name': store_request.store_name, 'reason': rejection_reason}
    )
    db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({'message': 'Store request rejected'}), 200


# Category Management
@bp.route('/categories', methods=['POST'])
@admin_required
def create_category():
    """Create a new category"""
    data = request.get_json()
    
    name = data.get('name')
    if not name:
        return jsonify({'message': 'Category name is required'}), 400
    
    category = Category(
        name=name,
        slug=slugify(name),
        icon=data.get('icon'),
        banner_url=data.get('banner_url'),
        description=data.get('description'),
        sort_order=data.get('sort_order', 0)
    )
    
    db.session.add(category)
    db.session.commit()
    
    # Emit socket event for real-time update
    socketio.emit('category_updated', {'action': 'create', 'category': category.to_dict()})
    
    return jsonify({
        'message': 'Category created',
        'category': category.to_dict()
    }), 201


@bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    """Update a category"""
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        category.name = data['name']
        category.slug = slugify(data['name'])
    if 'icon' in data:
        category.icon = data['icon']
    if 'banner_url' in data:
        category.banner_url = data['banner_url']
    if 'description' in data:
        category.description = data['description']
    if 'sort_order' in data:
        category.sort_order = data['sort_order']
    if 'is_active' in data:
        category.is_active = data['is_active']
    
    db.session.commit()
    
    # Emit socket event for real-time update
    socketio.emit('category_updated', {'action': 'update', 'category': category.to_dict()})
    
    return jsonify({
        'message': 'Category updated',
        'category': category.to_dict()
    }), 200


@bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    """Delete a category"""
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'message': 'Category not found'}), 404
    
    category.is_active = False
    db.session.commit()
    
    # Emit socket event for real-time update
    socketio.emit('category_updated', {'action': 'delete', 'category_id': category_id})
    
    return jsonify({'message': 'Category deleted'}), 200


# Reports Management
@bp.route('/reports', methods=['GET'])
@admin_required
def get_reports():
    """Get pending reports"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status', 'pending')
    
    query = Report.query.filter_by(status=status).order_by(Report.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    reports_data = []
    for r in pagination.items:
        # Get reported item name
        reported_item_name = "Unknown"
        if r.entity_type == 'product':
            p = Product.query.get(r.entity_id)
            reported_item_name = p.title if p else "Deleted Product"
        elif r.entity_type == 'store':
            s = Store.query.get(r.entity_id)
            reported_item_name = s.name if s else "Deleted Store"
        elif r.entity_type == 'user':
            u = User.query.get(r.entity_id)
            reported_item_name = f"{u.first_name} {u.last_name}" if u else "Deleted User"
        elif r.entity_type == 'review':
            rv = Review.query.get(r.entity_id)
            reported_item_name = f"Review by {rv.user.first_name}" if rv and rv.user else "Deleted Review"

        data = {
            'id': r.id,
            'reporter': r.reporter.to_dict() if r.reporter else None,
            'report_type': r.entity_type,  # Align with frontend
            'reported_id': r.entity_id,    # Align with frontend
            'reported_item_name': reported_item_name,
            'reason': r.reason,
            'description': r.description,
            'status': r.status,
            'created_at': r.created_at.isoformat()
        }
        reports_data.append(data)
    
    return jsonify({
        'reports': reports_data,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/reports/<int:report_id>/resolve', methods=['POST'])
@admin_required
def resolve_report(report_id):
    """Resolve a report"""
    admin_id = int(get_jwt_identity())
    data = request.get_json()
    
    report = Report.query.get(report_id)
    
    if not report:
        return jsonify({'message': 'Report not found'}), 404
    
    action = data.get('action', 'dismiss')  # dismiss, warn, suspend, remove
    
    report.status = 'resolved'
    report.reviewed_by = admin_id
    report.admin_notes = data.get('notes', '')
    
    # Take action based on entity type and action
    if action == 'remove':
        if report.entity_type == 'product':
            product = Product.query.get(report.entity_id)
            if product:
                product.is_active = False
        elif report.entity_type == 'store':
            store = Store.query.get(report.entity_id)
            if store:
                store.is_active = False
    
    db.session.commit()
    
    return jsonify({'message': f'Report resolved with action: {action}'}), 200


# SMTP Configuration (Super Admin)
@bp.route('/smtp', methods=['GET'])
@super_admin_required
def get_smtp_configs():
    """Get SMTP configurations"""
    configs = SmtpConfig.query.all()
    
    return jsonify({
        'configs': [{
            'id': c.id,
            'name': c.name,
            'server': c.server,
            'port': c.port,
            'from_email': c.from_email,
            'from_name': c.from_name,
            'is_active': c.is_active,
            'is_default': c.is_default
        } for c in configs]
    }), 200


@bp.route('/smtp-config', methods=['GET'])
@super_admin_required
def get_smtp_config_aligned():
    """Get the active/default SMTP configuration aligned with frontend fields"""
    config = SmtpConfig.query.filter_by(is_active=True).first()
    if not config:
        config = SmtpConfig.query.first()
    
    if not config:
        return jsonify({'config': None}), 200
        
    return jsonify({
        'config': {
            'mail_server': config.server,
            'mail_port': config.port,
            'mail_use_tls': config.use_tls,
            'mail_use_ssl': False, # Model only has use_tls
            'mail_username': config.username,
            'mail_password': config.password,
            'mail_default_sender': f"{config.from_name} <{config.from_email}>" if config.from_name else config.from_email
        }
    }), 200


@bp.route('/smtp-config', methods=['POST'])
@super_admin_required
def save_smtp_config_aligned():
    """Save SMTP configuration from frontend fields"""
    data = request.get_json()
    
    # Try to find existing config or create new
    config = SmtpConfig.query.first()
    
    # Parse mail_default_sender (format: Name <email@example.com> or just email@example.com)
    default_sender = data.get('mail_default_sender', '')
    from_name = ''
    from_email = default_sender
    
    if '<' in default_sender and '>' in default_sender:
        match = re.search(r'(.*)<(.*)>', default_sender)
        if match:
            from_name = match.group(1).strip()
            from_email = match.group(2).strip()

    if not config:
        config = SmtpConfig(name='Default SMTP')
        db.session.add(config)
    
    config.server = data.get('mail_server')
    config.port = data.get('mail_port', 587)
    config.username = data.get('mail_username')
    config.password = data.get('mail_password')
    config.use_tls = data.get('mail_use_tls', True)
    config.from_email = from_email
    config.from_name = from_name
    config.is_active = True
    config.is_default = True
    
    db.session.commit()
    
    return jsonify({'message': 'SMTP configuration saved successfully'}), 200


@bp.route('/smtp-test', methods=['POST'])
@super_admin_required
def test_smtp_config():
    """Test SMTP configuration by sending a test email"""
    data = request.get_json()
    test_email = data.get('email')
    
    if not test_email:
        return jsonify({'message': 'Test email address is required'}), 400
        
    # In a real scenario, you'd use Flask-Mail or similar here.
    # For now, we'll simulate a successful send if config exists.
    config = SmtpConfig.query.filter_by(is_active=True).first()
    if not config:
        return jsonify({'message': 'No active SMTP configuration found. Save configuration first.'}), 404
        
    # Logic to send test email
    success = send_smtp_email(
        to_email=test_email,
        subject="MAU MART - SMTP Test Email",
        body=f"This is a test email from MAU MART to verify your SMTP configuration.\n\nServer: {config.server}\nPort: {config.port}\nUsername: {config.username}\n\nIf you received this, your SMTP settings are correct!",
        config=config
    )
    
    if not success:
        return jsonify({'message': 'Failed to send test email. Please check your credentials and server settings.'}), 500
        
    return jsonify({'message': f'Test email sent to {test_email}'}), 200


# Categories GET endpoint
@bp.route('/categories', methods=['GET'])
@admin_required
def get_categories():
    """Get all active categories for admin"""
    categories = Category.query.filter_by(is_active=True).order_by(Category.sort_order, Category.name).all()
    return jsonify({
        'categories': [c.to_dict() for c in categories]
    }), 200


# Stores Management
@bp.route('/stores', methods=['GET'])
@admin_required
def get_stores():
    """Get all stores with pagination"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    search = request.args.get('search', '')
    
    query = Store.query
    if search:
        query = query.filter(Store.name.ilike(f'%{search}%'))
    
    query = query.order_by(Store.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'stores': [s.to_dict(include_owner=True) for s in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/stores/<int:store_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_store_status(store_id):
    """Toggle store active status"""
    store = Store.query.get(store_id)
    if not store:
        return jsonify({'message': 'Store not found'}), 404
    
    store.is_active = not store.is_active
    db.session.commit()
    
    return jsonify({
        'message': f'Store {"activated" if store.is_active else "deactivated"}',
        'store': store.to_dict()
    }), 200


@bp.route('/stores/<int:store_id>', methods=['PATCH'])
@admin_required
def update_store_admin(store_id):
    """Update store details as admin"""
    store = Store.query.get(store_id)
    if not store:
        return jsonify({'message': 'Store not found'}), 404
    
    data = request.get_json()
    if 'is_active' in data:
        store.is_active = data['is_active']
    if 'is_verified' in data:
        store.is_verified = data['is_verified']
    
    db.session.commit()
    return jsonify({'message': 'Store updated', 'store': store.to_dict()}), 200


# Orders Management
@bp.route('/orders', methods=['GET'])
@admin_required
def get_orders():
    """Get all orders with pagination"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    
    query = Order.query
    if status:
        query = query.filter_by(status=status)
    
    query = query.order_by(Order.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'orders': [o.to_dict(include_details=True) for o in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


# Reviews Management
@bp.route('/reviews', methods=['GET'])
@admin_required
def get_reviews():
    """Get all reviews with pagination"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    query = Review.query.order_by(Review.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'reviews': [r.to_dict() for r in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200


@bp.route('/reviews/<int:review_id>/toggle-hidden', methods=['POST'])
@admin_required
def toggle_review_hidden(review_id):
    """Toggle review visibility"""
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'message': 'Review not found'}), 404
    
    review.is_hidden = not review.is_hidden
    db.session.commit()
    
    return jsonify({
        'message': f'Review {"hidden" if review.is_hidden else "visible"}',
        'review': review.to_dict()
    }), 200


# Ads Management
@bp.route('/ads', methods=['GET'])
@admin_required
def get_ads():
    """Get all ad banners"""
    ads = AdsBanner.query.order_by(AdsBanner.created_at.desc()).all()
    return jsonify({
        'ads': [{
            'id': a.id,
            'title': a.title,
            'image_url': a.image_url,
            'link_url': a.link_url,
            'position': a.position,
            'is_active': a.is_active,
            'created_at': a.created_at.isoformat()
        } for a in ads]
    }), 200


@bp.route('/ads', methods=['POST'])
@admin_required
def create_ad():
    """Create a new ad banner with image upload"""
    title = request.form.get('title')
    link_url = request.form.get('link_url')
    position = request.form.get('position', 'home_banner')
    is_active = request.form.get('is_active', 'true').lower() == 'true'
    
    image_url = ''
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename:
            filename = f"ad_{int(datetime.utcnow().timestamp())}_{secure_filename(file.filename)}"
            upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'ads')
            file.save(os.path.join(upload_folder, filename))
            image_url = f"/api/v1/uploads/ads/{filename}"
    
    if not image_url:
        return jsonify({'message': 'Image is required for ad banner'}), 400
        
    starts_at = datetime.utcnow()
    ends_at = starts_at + timedelta(days=365) # Default 1 year
        
    ad = AdsBanner(
        title=title,
        image_url=image_url,
        link_url=link_url,
        position=position,
        is_active=is_active,
        starts_at=starts_at,
        ends_at=ends_at,
        is_approved=True  # Auto approve admin created ads
    )
    db.session.add(ad)
    db.session.commit()
    return jsonify({'message': 'Ad created', 'ad': {
        'id': ad.id, 'title': ad.title, 'image_url': ad.image_url,
        'link_url': ad.link_url, 'position': ad.position, 'is_active': ad.is_active
    }}), 201


@bp.route('/ads/<int:ad_id>', methods=['PUT'])
@admin_required
def update_ad(ad_id):
    """Update an ad banner with optional image upload"""
    ad = AdsBanner.query.get(ad_id)
    if not ad:
        return jsonify({'message': 'Ad not found'}), 404
    
    if 'title' in request.form:
        ad.title = request.form['title']
    if 'link_url' in request.form:
        ad.link_url = request.form['link_url']
    if 'position' in request.form:
        ad.position = request.form['position']
    if 'is_active' in request.form:
        ad.is_active = request.form['is_active'].lower() == 'true'
    
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename:
            filename = f"ad_{int(datetime.utcnow().timestamp())}_{secure_filename(file.filename)}"
            upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'ads')
            file.save(os.path.join(upload_folder, filename))
            ad.image_url = f"/api/v1/uploads/ads/{filename}"
    
    db.session.commit()
    return jsonify({'message': 'Ad updated', 'ad': {
        'id': ad.id, 'title': ad.title, 'image_url': ad.image_url,
        'link_url': ad.link_url, 'position': ad.position, 'is_active': ad.is_active
    }}), 200


@bp.route('/ads/<int:ad_id>', methods=['PATCH'])
@admin_required
def patch_ad(ad_id):
    """Partially update an ad banner"""
    ad = AdsBanner.query.get(ad_id)
    if not ad:
        return jsonify({'message': 'Ad not found'}), 404
    
    data = request.get_json()
    if 'is_active' in data:
        ad.is_active = data['is_active']
    
    db.session.commit()
    return jsonify({'message': 'Ad updated'}), 200


@bp.route('/ads/<int:ad_id>', methods=['DELETE'])
@admin_required
def delete_ad(ad_id):
    """Delete an ad banner"""
    ad = AdsBanner.query.get(ad_id)
    if not ad:
        return jsonify({'message': 'Ad not found'}), 404
    
    db.session.delete(ad)
    db.session.commit()
    return jsonify({'message': 'Ad deleted'}), 200

@bp.route('/products/<int:product_id>', methods=['PATCH'])
@admin_required
def update_product_admin(product_id):
    """Update product details as admin"""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    
    data = request.get_json()
    if 'is_active' in data:
        product.is_active = data['is_active']
    if 'is_featured' in data:
        product.is_featured = data['is_featured']
    
    db.session.commit()
    return jsonify({'message': 'Product updated', 'product': product.to_dict()}), 200


# Support Admins Management
VALID_PERMISSIONS = [
    'dashboard', 'users', 'stores', 'store_requests', 'products',
    'categories', 'orders', 'reports', 'reviews'
]


@bp.route('/support-admins', methods=['GET'])
@super_admin_required
def get_support_admins():
    """Get all support admin users"""
    support_admins = User.query.filter_by(role=UserRole.SUPPORT_ADMIN.value).all()
    
    result = []
    for sa in support_admins:
        data = sa.to_dict()
        admin_role = AdminRole.query.filter_by(user_id=sa.id).first()
        data['permissions'] = admin_role.permissions if admin_role else []
        result.append(data)
    
    return jsonify({'support_admins': result}), 200


@bp.route('/support-admins', methods=['POST'])
@super_admin_required
def create_support_admin():
    """Create a new support admin with selected permissions"""
    data = request.get_json()
    
    required = ['first_name', 'last_name', 'email', 'password', 'permissions']
    for field in required:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Validate permissions
    permissions = data.get('permissions', [])
    invalid = [p for p in permissions if p not in VALID_PERMISSIONS]
    if invalid:
        return jsonify({'message': f'Invalid permissions: {", ".join(invalid)}'}), 400
    
    if not permissions:
        return jsonify({'message': 'At least one permission is required'}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'message': 'Email already registered'}), 409
    
    # Create user with support_admin role
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'].lower(),
        phone=data.get('phone', ''),
        role=UserRole.SUPPORT_ADMIN.value,
        is_verified=True,
        is_active=True
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()  # Get user.id
    
    # Create admin role with permissions
    admin_role = AdminRole(
        user_id=user.id,
        permissions=permissions,
        created_by=int(get_jwt_identity())
    )
    db.session.add(admin_role)
    db.session.commit()
    
    result = user.to_dict()
    result['permissions'] = permissions
    
    return jsonify({'message': 'Support admin created', 'support_admin': result}), 201


@bp.route('/support-admins/<int:user_id>', methods=['PUT'])
@super_admin_required
def update_support_admin(user_id):
    """Update support admin permissions"""
    user = User.query.get(user_id)
    if not user or user.role != UserRole.SUPPORT_ADMIN.value:
        return jsonify({'message': 'Support admin not found'}), 404
    
    data = request.get_json()
    permissions = data.get('permissions', [])
    
    invalid = [p for p in permissions if p not in VALID_PERMISSIONS]
    if invalid:
        return jsonify({'message': f'Invalid permissions: {", ".join(invalid)}'}), 400
    
    admin_role = AdminRole.query.filter_by(user_id=user.id).first()
    if admin_role:
        admin_role.permissions = permissions
    else:
        admin_role = AdminRole(
            user_id=user.id,
            permissions=permissions,
            created_by=int(get_jwt_identity())
        )
        db.session.add(admin_role)
    
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    db.session.commit()
    
    result = user.to_dict()
    result['permissions'] = permissions
    return jsonify({'message': 'Support admin updated', 'support_admin': result}), 200


@bp.route('/support-admins/<int:user_id>', methods=['DELETE'])
@super_admin_required
def delete_support_admin(user_id):
    """Remove a support admin (revert to regular user)"""
    user = User.query.get(user_id)
    if not user or user.role != UserRole.SUPPORT_ADMIN.value:
        return jsonify({'message': 'Support admin not found'}), 404
    
    # Delete admin role record
    AdminRole.query.filter_by(user_id=user.id).delete()
    
    # Revert to regular user
    user.role = UserRole.USER.value
    db.session.commit()
    
    return jsonify({'message': 'Support admin removed'}), 200


# App Settings
@bp.route('/settings', methods=['GET'])
@admin_required
def get_app_settings():
    """Get all app settings"""
    row = AppSettings.query.first()
    return jsonify({'settings': row.data if row else {}}), 200


@bp.route('/settings', methods=['POST'])
@super_admin_required
def save_app_settings():
    """Save all app settings"""
    data = request.get_json()
    
    row = AppSettings.query.first()
    if not row:
        row = AppSettings(data=data)
        db.session.add(row)
    else:
        row.data = data
    
    db.session.commit()
    return jsonify({'message': 'Settings saved successfully', 'settings': row.data}), 200


# Email Marketing
@bp.route('/email-marketing/audience-count', methods=['GET'])
@super_admin_required
def email_marketing_audience_count():
    """Get count of recipients for a given audience"""
    audience = request.args.get('audience', 'all_users')
    
    if audience == 'all_users':
        count = User.query.filter_by(is_active=True).count()
    elif audience == 'sellers':
        count = User.query.filter_by(is_active=True, is_seller=True).count()
    elif audience == 'buyers':
        count = User.query.filter_by(is_active=True, is_seller=False).filter(
            User.role.in_([UserRole.USER.value])
        ).count()
    elif audience == 'verified':
        count = User.query.filter_by(is_active=True, is_verified=True).count()
    else:
        count = 0
    
    return jsonify({'count': count, 'audience': audience}), 200


@bp.route('/email-marketing/send', methods=['POST'])
@super_admin_required
def email_marketing_send():
    """Send bulk marketing email to selected audience"""
    import re
    data = request.get_json()
    
    subject = data.get('subject', '').strip()
    html_content = data.get('html_content', '').strip()
    audience = data.get('audience', 'all_users')
    
    if not subject:
        return jsonify({'message': 'Email subject is required'}), 400
    if not html_content:
        return jsonify({'message': 'Email content is required'}), 400
    
    # Get recipients based on audience
    if audience == 'all_users':
        users = User.query.filter_by(is_active=True).all()
    elif audience == 'sellers':
        users = User.query.filter_by(is_active=True, is_seller=True).all()
    elif audience == 'buyers':
        users = User.query.filter_by(is_active=True, is_seller=False).filter(
            User.role.in_([UserRole.USER.value])
        ).all()
    elif audience == 'verified':
        users = User.query.filter_by(is_active=True, is_verified=True).all()
    else:
        return jsonify({'message': 'Invalid audience'}), 400
    
    if not users:
        return jsonify({'message': 'No recipients found for this audience'}), 404
    
    # Strip HTML tags for plain text fallback
    plain_text = re.sub(r'<[^>]+>', '', html_content)
    plain_text = re.sub(r'\s+', ' ', plain_text).strip()
    
    # Send emails
    sent = 0
    failed = 0
    for user in users:
        try:
            success = send_smtp_email(
                to_email=user.email,
                subject=subject,
                body=plain_text,
                html=html_content
            )
            if success:
                sent += 1
            else:
                failed += 1
        except Exception as e:
            print(f"Failed to send to {user.email}: {str(e)}")
            failed += 1
    
    return jsonify({
        'message': f'Emails sent: {sent} successful, {failed} failed out of {len(users)} recipients',
        'sent': sent,
        'failed': failed,
        'total': len(users)
    }), 200
