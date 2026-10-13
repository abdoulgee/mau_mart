from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models import Report, Product, User
from app.utils import current_user_id

bp = Blueprint('reports', __name__)

REPORTABLE = {'product': Product, 'user': User}


@bp.route('', methods=['POST'])
@jwt_required()
def submit_report():
    """Report a listing or a user. Body: entity_type (product|user), entity_id, reason, description"""
    reporter_id = current_user_id()
    data = request.get_json() or {}

    entity_type = data.get('entity_type')
    entity_id = data.get('entity_id')
    reason = (data.get('reason') or '').strip()

    if entity_type not in REPORTABLE or not entity_id or not reason:
        return jsonify({'message': 'entity_type, entity_id and reason are required'}), 400

    try:
        entity_id = int(entity_id)
    except (TypeError, ValueError):
        return jsonify({'message': 'Invalid entity_id'}), 400

    if not db.session.get(REPORTABLE[entity_type], entity_id):
        return jsonify({'message': f'Reported {entity_type} not found'}), 404

    if entity_type == 'user' and entity_id == reporter_id:
        return jsonify({'message': 'You cannot report yourself'}), 400

    already = Report.query.filter_by(
        reporter_id=reporter_id, entity_type=entity_type, entity_id=entity_id, status='pending'
    ).first()
    if already:
        return jsonify({'message': 'You have already reported this. Our team will review it.'}), 200

    report = Report(
        reporter_id=reporter_id,
        entity_type=entity_type,
        entity_id=entity_id,
        reason=reason[:100],
        description=(data.get('description') or '').strip(),
    )
    db.session.add(report)
    db.session.commit()

    return jsonify({'message': 'Report submitted', 'report': {'id': report.id, 'status': report.status}}), 201
