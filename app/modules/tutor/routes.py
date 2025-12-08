"""
Tutor Routes Module: API endpoints for tutor operations.
Requires authentication and 'tutor' role.
"""

import logging
from flask import Blueprint, jsonify, session, request
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


@tutor_bp.route('/tutor/session/<session_id>', methods=['PUT'])
@auth_required
@role_required('tutor')
def update_tutor_session(session_id):
    """Update a tutor session's details (date_time, location, duration_minutes, course_name)

    Expects JSON body with fields to update.
    Sends notifications to students who have bookings for this session (confirmed/pending).
    """
    try:
        tutor_id = session.get('user_id')
        if not tutor_id:
            return jsonify({'status': 'error', 'message': 'Not authenticated', 'data': None}), 401

        data = request.get_json() or {}
        allowed = {'date_time', 'location', 'duration_minutes', 'course_name'}
        updates = {k: v for k, v in data.items() if k in allowed}
        if not updates:
            return jsonify({'status': 'error', 'message': 'No valid fields to update', 'data': None}), 400

        updated = TutorSessionManager.update_session(session_id, updates)
        if not updated:
            return jsonify({'status': 'error', 'message': 'Session not found or update failed', 'data': None}), 404

        # Notify affected students (bookings tied to this session)
        from app.data_manager import StudentBookingManager
        from app.modules.notification.services import NotificationService

        bookings = StudentBookingManager.get_all_bookings()
        affected_students = set()
        for b in bookings:
            if b.get('session_id') == session_id and b.get('status') in ('confirmed', 'pending'):
                affected_students.add(b.get('student_id'))

        notif_service = NotificationService()
        tutor_profile = DatacoreManager.get_user_profile(tutor_id)
        tutor_name = tutor_profile.get('name') if tutor_profile else 'Tutor'

        if affected_students:
            # Use notify_schedule_updated to create standardized event notifications
            notif_service.notify_schedule_updated(
                tutor_id=tutor_id,
                student_ids=list(affected_students),
                schedule_id=session_id,
                old_info={},
                new_info={
                    'time': updates.get('date_time', updated.get('date_time')),
                    'location': updates.get('location', updated.get('location'))
                }
            )

        return jsonify({'status': 'success', 'message': 'Session updated', 'data': updated}), 200
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        return jsonify({'status': 'error', 'message': str(e), 'data': None}), 500


@tutor_bp.route('/tutor/students', methods=['GET'])
@auth_required
@role_required('tutor')
def get_tutor_students():
    """
    GET /api/tutor/students
    
    Get list of students (from datacore).
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
                        "id": "SE2025001",
                        "name": "Nguyễn Văn An",
                        "student_id": "SE2025001",
                        "email": "student1@hcmut.edu.vn",
                        "phone": "+84-9-xxx-xxxx",
                        "faculty": "Computer Science",
                        "department": "Software Engineering",
                        "courses": ["CSC101", "CSC102", "CSC201"]
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
        
        # Get all students from datacore
        all_students = DatacoreManager.get_all_students()
        
        logger.info(f"Retrieved {len(all_students)} students for tutor {tutor_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Students retrieved successfully',
            'data': {
                'tutor_id': tutor_id,
                'tutor_name': tutor_profile.get('name'),
                'total_students': len(all_students),
                'students': all_students
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutor students: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500