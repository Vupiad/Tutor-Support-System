"""
Tutor Routes Module: API endpoints for tutor operations.
Requires authentication and 'tutor' role.
"""

import logging
from flask import Blueprint, jsonify, session
from app.modules.auth.routes import auth_required, role_required
from app.data_manager import (
    TutorSessionManager, AssignmentManager, DatacoreManager
)

logger = logging.getLogger(__name__)

tutor_bp = Blueprint('tutor', __name__, url_prefix='/api')


@tutor_bp.route('/tutor/sessions', methods=['GET'])
@auth_required
@role_required('tutor')
def get_tutor_sessions():
    """
    GET /api/tutor/sessions
    
    Get list of tutor sessions for the authenticated tutor.
    Requires: authentication, tutor role
    
    Response (200):
        {
            "status": "success",
            "message": "Tutor sessions retrieved successfully",
            "data": {
                "tutor_id": "LECTURER_001",
                "tutor_name": "Phạm Thị Tú",
                "sessions": [
                    {
                        "session_id": "TS001",
                        "course_name": "CSC101",
                        "date_time": "2025-12-01T09:00:00Z",
                        "status": "scheduled",
                        "student_count": 2,
                        "duration_minutes": 60
                    },
                    ...
                ]
            }
        }
    """
    try:
        tutor_id = session.get('user_id')
        
        # Get tutor info
        tutor_profile = DatacoreManager.get_user_profile(tutor_id)
        if not tutor_profile:
            logger.warning(f"Tutor profile not found for ID: {tutor_id}")
            return jsonify({
                'status': 'error',
                'message': 'Tutor profile not found',
                'data': None
            }), 404
        
        # Get tutor sessions
        sessions = TutorSessionManager.get_sessions_by_tutor(tutor_id)
        
        logger.info(f"Retrieved {len(sessions)} sessions for tutor {tutor_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Tutor sessions retrieved successfully',
            'data': {
                'tutor_id': tutor_id,
                'tutor_name': tutor_profile.get('name'),
                'sessions': sessions
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutor sessions: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500


@tutor_bp.route('/tutor/students', methods=['GET'])
@auth_required
@role_required('tutor')
def get_tutor_students():
    """
    GET /api/tutor/students
    
    Get list of students assigned to the authenticated tutor.
    Requires: authentication, tutor role
    
    Response (200):
        {
            "status": "success",
            "message": "Students retrieved successfully",
            "data": {
                "tutor_id": "LECTURER_001",
                "tutor_name": "Phạm Thị Tú",
                "total_students": 2,
                "students": [
                    {
                        "assignment_id": "ASN001",
                        "student_id": "SE2025001",
                        "student_name": "Nguyễn Văn An",
                        "course_name": "CSC101",
                        "class_name": "SE-K2024-1",
                        "start_date": "2025-11-20",
                        "rating": 4.5
                    },
                    ...
                ]
            }
        }
    """
    try:
        tutor_id = session.get('user_id')
        
        # Get tutor info
        tutor_profile = DatacoreManager.get_user_profile(tutor_id)
        if not tutor_profile:
            logger.warning(f"Tutor profile not found for ID: {tutor_id}")
            return jsonify({
                'status': 'error',
                'message': 'Tutor profile not found',
                'data': None
            }), 404
        
        # Get assignments for this tutor
        assignments = AssignmentManager.get_assignments_by_tutor(tutor_id)
        
        logger.info(f"Retrieved {len(assignments)} students for tutor {tutor_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Students retrieved successfully',
            'data': {
                'tutor_id': tutor_id,
                'tutor_name': tutor_profile.get('name'),
                'total_students': len(assignments),
                'students': assignments
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutor students: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500
