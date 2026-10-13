from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import secrets

from app import db
from app.models import User, OtpLog, get_setting
from app.services.email import send_otp_email
from app.utils import normalize_whatsapp

bp = Blueprint('auth', __name__)

PURPOSE_VERIFICATION = 'verification'
PURPOSE_PASSWORD_RESET = 'password_reset'


def _issue_otp(email, purpose, subject):
    """Create a fresh OTP (invalidating older ones for the same purpose) and email it"""
    OtpLog.query.filter_by(email=email, purpose=purpose, is_used=False).update({'is_used': True})
    otp = ''.join(secrets.choice('0123456789') for _ in range(6))
    db.session.add(OtpLog(
        email=email,
        otp_code=otp,
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=current_app.config['OTP_EXPIRY_MINUTES']),
    ))
    db.session.commit()
    send_otp_email(email, otp, subject)


def _consume_otp(email, purpose, code):
    """Return True if code matches the active OTP. Wrong guesses count toward a limit."""
    otp_log = OtpLog.query.filter(
        OtpLog.email == email,
        OtpLog.purpose == purpose,
        OtpLog.is_used == False,  # noqa: E712
        OtpLog.expires_at > datetime.utcnow(),
    ).order_by(OtpLog.created_at.desc()).first()

    if not otp_log:
        return False

    if not secrets.compare_digest(otp_log.otp_code, str(code)):
        otp_log.attempts = (otp_log.attempts or 0) + 1
        if otp_log.attempts >= current_app.config['OTP_MAX_ATTEMPTS']:
            otp_log.is_used = True
        db.session.commit()
        return False

    otp_log.is_used = True
    return True


def _verification_required():
    try:
        return bool(get_setting('require_email_verification', True))
    except Exception:
        db.session.rollback()
        return True


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    for field in ['first_name', 'last_name', 'email', 'phone', 'password']:
        if not str(data.get(field) or '').strip():
            return jsonify({'message': f'{field.replace("_", " ").capitalize()} is required'}), 400

    email = data['email'].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 409

    if len(data['password']) < 8:
        return jsonify({'message': 'Password must be at least 8 characters'}), 400

    student_id = str(data.get('student_id') or '').strip() or None
    if student_id and User.query.filter_by(student_id=student_id).first():
        return jsonify({'message': 'Student ID already registered'}), 409

    whatsapp = normalize_whatsapp(data.get('whatsapp') or data['phone'])
    if data.get('whatsapp') and not whatsapp:
        return jsonify({'message': 'Enter a valid WhatsApp number'}), 400

    require_verification = _verification_required()
    user = User(
        first_name=data['first_name'].strip(),
        last_name=data['last_name'].strip(),
        email=email,
        phone=data['phone'].strip(),
        whatsapp=whatsapp,
        student_id=student_id,
        is_verified=not require_verification,
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    if require_verification:
        _issue_otp(user.email, PURPOSE_VERIFICATION, 'Email Verification')
        return jsonify({
            'message': 'Registration successful. Please verify your email.',
            'email': user.email,
        }), 201

    return jsonify({
        'message': 'Registration successful. You can now log in.',
        'email': user.email,
        'auto_verified': True,
    }), 201


@bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    otp = (data.get('otp') or '').strip()

    if not email or not otp:
        return jsonify({'message': 'Email and OTP are required'}), 400

    if not _consume_otp(email, PURPOSE_VERIFICATION, otp):
        return jsonify({'message': 'Invalid or expired OTP'}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        user.is_verified = True
    db.session.commit()

    return jsonify({'message': 'Email verified successfully'}), 200


@bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    # Same response either way so this can't be used to discover accounts
    if user and not user.is_verified:
        _issue_otp(email, PURPOSE_VERIFICATION, 'Email Verification')

    return jsonify({'message': 'If this account needs verification, a new code has been sent'}), 200


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = (data.get('email') or '').strip()  # email or student ID
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'message': 'Email/Student ID and password are required'}), 400

    user = User.query.filter(
        (User.email == identifier.lower()) | (User.student_id == identifier)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'message': 'Your account has been suspended'}), 403

    if not user.is_verified and _verification_required():
        _issue_otp(user.email, PURPOSE_VERIFICATION, 'Email Verification')
        return jsonify({
            'message': 'Please verify your email first. A new verification code has been sent.',
            'needs_verification': True,
            'email': user.email,
        }), 403

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': create_access_token(identity=str(user.id)),
        'refresh_token': create_refresh_token(identity=str(user.id)),
    }), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active:
        return jsonify({'message': 'Account unavailable'}), 401
    return jsonify({'access_token': create_access_token(identity=str(user.id))}), 200


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    if User.query.filter_by(email=email).first():
        _issue_otp(email, PURPOSE_PASSWORD_RESET, 'Password Reset')

    return jsonify({'message': 'If this email exists, you will receive a reset code'}), 200


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    otp = (data.get('otp') or '').strip()
    new_password = data.get('new_password') or ''

    if not email or not otp or not new_password:
        return jsonify({'message': 'Email, OTP, and new password are required'}), 400

    if len(new_password) < 8:
        return jsonify({'message': 'Password must be at least 8 characters'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not _consume_otp(email, PURPOSE_PASSWORD_RESET, otp):
        return jsonify({'message': 'Invalid or expired OTP'}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password reset successful'}), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200
