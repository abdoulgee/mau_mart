from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import random
import string

from app import db
from app.models import User, OtpLog, AppSettings
from app.services.email import send_otp_email

bp = Blueprint('auth', __name__)


def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    required = ['first_name', 'last_name', 'email', 'phone', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({'message': f'{field} is required'}), 400
    
    # Check if email exists
    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'message': 'Email already registered'}), 409
    
    # Check if student_id exists (if provided)
    if data.get('student_id'):
        if User.query.filter_by(student_id=data['student_id']).first():
            return jsonify({'message': 'Student ID already registered'}), 409
    
    # Check if email verification is required
    require_verification = True
    try:
        settings_row = AppSettings.query.first()
        if settings_row and settings_row.data:
            require_verification = settings_row.data.get('require_email_verification', True)
    except:
        pass
    
    # Create user
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'].lower(),
        phone=data['phone'],
        student_id=data.get('student_id'),
        is_verified=not require_verification  # Auto-verify if verification not required
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    if require_verification:
        # Generate and send OTP
        otp = generate_otp()
        otp_log = OtpLog(
            email=user.email,
            otp_code=otp,
            purpose='verification',
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.session.add(otp_log)
        db.session.commit()
        
        # Send OTP email (also prints to console)
        send_otp_email(user.email, otp, 'Email Verification')
        
        return jsonify({
            'message': 'Registration successful. Please verify your email.',
            'email': user.email
        }), 201
    else:
        # Skip verification, allow immediate login
        return jsonify({
            'message': 'Registration successful. You can now log in.',
            'email': user.email,
            'auto_verified': True
        }), 201


@bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify email with OTP"""
    data = request.get_json()
    
    email = data.get('email', '').lower()
    otp = data.get('otp', '')
    
    if not email or not otp:
        return jsonify({'message': 'Email and OTP are required'}), 400
    
    # Find valid OTP
    otp_log = OtpLog.query.filter(
        OtpLog.email == email,
        OtpLog.otp_code == otp,
        OtpLog.purpose == 'verification',
        OtpLog.is_used == False,
        OtpLog.expires_at > datetime.utcnow()
    ).first()
    
    if not otp_log:
        return jsonify({'message': 'Invalid or expired OTP'}), 400
    
    # Mark OTP as used
    otp_log.is_used = True
    
    # Verify user
    user = User.query.filter_by(email=email).first()
    if user:
        user.is_verified = True
    
    db.session.commit()
    
    return jsonify({'message': 'Email verified successfully'}), 200


@bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend OTP to email"""
    data = request.get_json()
    email = data.get('email', '').lower()
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if user.is_verified:
        return jsonify({'message': 'Email already verified'}), 400
    
    # Generate new OTP
    otp = generate_otp()
    otp_log = OtpLog(
        email=email,
        otp_code=otp,
        purpose='verification',
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.session.add(otp_log)
    db.session.commit()
    
    send_otp_email(email, otp, 'Email Verification')
    
    return jsonify({'message': 'OTP sent to your email'}), 200


@bp.route('/login', methods=['POST'])
def login():
    """Login with email/student_id and password"""
    data = request.get_json()
    
    identifier = data.get('email', '').lower()  # Can be email or student_id
    password = data.get('password', '')
    
    if not identifier or not password:
        return jsonify({'message': 'Email/Student ID and password are required'}), 400
    
    # Find user by email or student_id
    user = User.query.filter(
        (User.email == identifier) | (User.student_id == identifier)
    ).first()
    
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    if not user.is_verified:
        # Check if email verification is required
        require_verification = True
        try:
            settings_row = AppSettings.query.first()
            if settings_row and settings_row.data:
                require_verification = settings_row.data.get('require_email_verification', True)
        except:
            pass
        
        if require_verification:
            return jsonify({'message': 'Please verify your email first', 'needs_verification': True}), 403
    
    if not user.is_active:
        return jsonify({'message': 'Your account has been suspended'}), 403
    
    # Generate tokens - identity MUST be a string for Flask-JWT-Extended
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    print(f"DEBUG: Refresh endpoint hit. Headers: {request.headers}")
    current_user_id = get_jwt_identity()
    print(f"DEBUG: Refresh success. User ID: {current_user_id}")
    # Identity is already a string, pass it directly to create new token
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': access_token
    }), 200


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset OTP"""
    data = request.get_json()
    email = data.get('email', '').lower()
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal if email exists or not for security
        return jsonify({'message': 'If this email exists, you will receive a reset code'}), 200
    
    # Generate OTP
    otp = generate_otp()
    otp_log = OtpLog(
        email=email,
        otp_code=otp,
        purpose='password_reset',
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.session.add(otp_log)
    db.session.commit()
    
    send_otp_email(email, otp, 'Password Reset')
    
    return jsonify({'message': 'If this email exists, you will receive a reset code'}), 200


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with OTP"""
    data = request.get_json()
    
    email = data.get('email', '').lower()
    otp = data.get('otp', '')
    new_password = data.get('new_password', '')
    
    if not email or not otp or not new_password:
        return jsonify({'message': 'Email, OTP, and new password are required'}), 400
    
    if len(new_password) < 8:
        return jsonify({'message': 'Password must be at least 8 characters'}), 400
    
    # Find valid OTP
    otp_log = OtpLog.query.filter(
        OtpLog.email == email,
        OtpLog.otp_code == otp,
        OtpLog.purpose == 'password_reset',
        OtpLog.is_used == False,
        OtpLog.expires_at > datetime.utcnow()
    ).first()
    
    if not otp_log:
        return jsonify({'message': 'Invalid or expired OTP'}), 400
    
    # Update password
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    user.set_password(new_password)
    otp_log.is_used = True
    db.session.commit()
    
    return jsonify({'message': 'Password reset successful'}), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile with seller state - SOURCE OF TRUTH"""
    from app.models import Store, StoreRequest
    
    current_user_id = get_jwt_identity()
    # Convert string identity back to int for database query
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Get user's store (if exists)
    store = Store.query.filter_by(owner_id=user.id).first()
    
    # Get user's seller request (most recent)
    seller_request = StoreRequest.query.filter_by(
        user_id=user.id
    ).order_by(StoreRequest.created_at.desc()).first()
    
    # Derive seller state - SOURCE OF TRUTH
    # A user is a seller ONLY IF: role === 'seller' AND has active store
    has_store = store is not None
    is_seller = user.role == 'seller' and has_store and store.is_active
    
    # Build response
    response_data = user.to_dict()
    response_data['has_store'] = has_store
    response_data['is_seller'] = is_seller
    
    if store:
        response_data['store'] = store.to_dict()
    
    if seller_request:
        response_data['seller_request'] = seller_request.to_dict()
    
    return jsonify({'user': response_data}), 200
