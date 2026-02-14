from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Report, Product, Store, User, Review

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('', methods=['POST'])
@jwt_required()
def submit_report():
    """Submit a new report"""
    reporter_id = int(get_jwt_identity())
    data = request.get_json()
    
    entity_type = data.get('entity_type')
    entity_id = data.get('entity_id')
    reason = data.get('reason')
    description = data.get('description', '')
    
    if not all([entity_type, entity_id, reason]):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Simple validation of entity existence
    exists = False
    if entity_type == 'product':
        exists = Product.query.get(entity_id) is not None
    elif entity_type == 'store':
        exists = Store.query.get(entity_id) is not None
    elif entity_type == 'user':
        exists = User.query.get(entity_id) is not None
    elif entity_type == 'review':
        exists = Review.query.get(entity_id) is not None
        
    if not exists:
        return jsonify({'message': f'Reported {entity_type} not found'}), 404
    
    report = Report(
        reporter_id=reporter_id,
        entity_type=entity_type,
        entity_id=entity_id,
        reason=reason,
        description=description,
        status='pending'
    )
    
    db.session.add(report)
    db.session.commit()
    
    return jsonify({
        'message': 'Report submitted successfully',
        'report': {
            'id': report.id,
            'status': report.status
        }
    }), 201
