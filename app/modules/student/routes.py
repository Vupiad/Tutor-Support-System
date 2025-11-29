"""
Student Routes Module: API endpoints for student operations.
Requires authentication and 'student' role.
"""

import logging
from flask import Blueprint, jsonify, session, request
from app.modules.auth.routes import auth_required, role_required
from app.data_manager import (
    DatacoreManager, ScheduleManager, AssignmentManager
)

logger = logging.getLogger(__name__)

student_bp = Blueprint('student', __name__, url_prefix='/api')


@student_bp.route('/student/tutors/search', methods=['GET'])
@auth_required
@role_required('student')
def search_tutors_by_course():
    """
    GET /api/student/tutors/search?course_name=CSC101
    
    Search for tutors by course name.
    Requires: authentication, student role
    Query Parameters:
        - course_name: Course code/name to search for (required)
    
    Response (200):
        {
            "status": "success",
            "message": "Tutors found",
            "data": {
                "course_name": "CSC101",
                "tutor_count": 1,
                "tutors": [
                    {
                        "tutor_id": "LECTURER_001",
                        "tutor_name": "Phạm Thị Tú",
                        "specialization": "M.Sc. in Computer Science",
                        "subjects": ["CSC101", "CSC102", "CSC201"],
                        "rating": 4.8,
                        "email": "tutor1@hcmut.edu.vn"
                    },
                    ...
                ]
            }
        }
    """
    try:
        course_name = request.args.get('course_name')
        
        if not course_name:
            logger.warning("Search attempt without course_name parameter")
            return jsonify({
                'status': 'error',
                'message': 'Missing required parameter: course_name',
                'data': None
            }), 400
        
        # Find tutors teaching this course
        tutors = DatacoreManager.find_tutors_by_course(course_name)
        
        # Format response
        tutors_data = []
        for tutor in tutors:
            tutors_data.append({
                'tutor_id': tutor.get('id'),
                'tutor_name': tutor.get('name'),
                'specialization': tutor.get('bio', 'N/A'),
                'subjects': tutor.get('subjects', []),
                'rating': tutor.get('rating', 0),
                'email': tutor.get('email')
            })
        
        logger.info(f"Found {len(tutors_data)} tutors for course {course_name}")
        
        return jsonify({
            'status': 'success',
            'message': f'Found {len(tutors_data)} tutors for course "{course_name}"',
            'data': {
                'course_name': course_name,
                'tutor_count': len(tutors_data),
                'tutors': tutors_data
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching tutors: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500


@student_bp.route('/student/tutors/<tutor_id>', methods=['GET'])
@auth_required
@role_required('student')
def get_tutor_details(tutor_id):
    """
    GET /api/student/tutors/<tutor_id>
    
    Get detailed information about a specific tutor.
    Requires: authentication, student role
    
    Path Parameters:
        - tutor_id: ID of the tutor
    
    Response (200):
        {
            "status": "success",
            "message": "Tutor details retrieved",
            "data": {
                "tutor_id": "LECTURER_001",
                "tutor_name": "Phạm Thị Tú",
                "contact_email": "tutor1@hcmut.edu.vn",
                "specialization": "M.Sc. in Computer Science",
                "teaching_courses": ["CSC101", "CSC102", "CSC201"],
                "available_slots": [
                    {
                        "id": 101,
                        "start": "2025-12-01T09:00:00Z",
                        "end": "2025-12-01T10:00:00Z"
                    },
                    ...
                ]
            }
        }
    """
    try:
        # Get tutor profile
        tutor_profile = DatacoreManager.get_tutor_by_id(tutor_id)
        if not tutor_profile:
            logger.warning(f"Tutor not found: {tutor_id}")
            return jsonify({
                'status': 'error',
                'message': f'Tutor with ID "{tutor_id}" not found',
                'data': None
            }), 404
        
        # Get tutor's available slots
        available_slots = ScheduleManager.get_tutor_slots(tutor_id)
        
        logger.info(f"Retrieved details for tutor {tutor_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Tutor details retrieved',
            'data': {
                'tutor_id': tutor_profile.get('id'),
                'tutor_name': tutor_profile.get('name'),
                'contact_email': tutor_profile.get('email'),
                'specialization': tutor_profile.get('bio', 'N/A'),
                'teaching_courses': tutor_profile.get('subjects', []),
                'available_slots': available_slots,
                'rating': tutor_profile.get('rating', 0),
                'department': tutor_profile.get('department')
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutor details: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500


@student_bp.route('/student/tutors/my-courses', methods=['GET'])
@auth_required
@role_required('student')
def get_tutors_for_my_courses():
    """
    GET /api/student/tutors/my-courses
    
    Get list of tutors teaching courses that the current student is enrolled in.
    Requires: authentication, student role
    
    Response (200):
        {
            "status": "success",
            "message": "Tutors retrieved",
            "data": {
                "student_id": "SE2025001",
                "student_name": "Nguyễn Văn An",
                "enrolled_courses": ["CSC101", "CSC102", "CSC201"],
                "tutor_count": 2,
                "tutors": [
                    {
                        "tutor_id": "LECTURER_001",
                        "tutor_name": "Phạm Thị Tú",
                        "specialization": "M.Sc. in Computer Science",
                        "teaching_courses": ["CSC101", "CSC102", "CSC201"],
                        "rating": 4.8
                    },
                    ...
                ]
            }
        }
    """
    try:
        student_id = session.get('user_id')
        
        # Get student profile
        student_profile = DatacoreManager.get_student_by_id(student_id)
        if not student_profile:
            logger.warning(f"Student profile not found: {student_id}")
            return jsonify({
                'status': 'error',
                'message': 'Student profile not found',
                'data': None
            }), 404
        
        # Get student's courses
        enrolled_courses = student_profile.get('courses', [])
        
        # Find tutors for these courses
        tutors_by_course = {}
        for course in enrolled_courses:
            tutors = DatacoreManager.find_tutors_by_course(course)
            for tutor in tutors:
                tutor_id = tutor.get('id')
                if tutor_id not in tutors_by_course:
                    tutors_by_course[tutor_id] = tutor
        
        # Format response
        tutors_data = []
        for tutor in tutors_by_course.values():
            tutors_data.append({
                'tutor_id': tutor.get('id'),
                'tutor_name': tutor.get('name'),
                'specialization': tutor.get('bio', 'N/A'),
                'teaching_courses': tutor.get('subjects', []),
                'rating': tutor.get('rating', 0),
                'email': tutor.get('email')
            })
        
        logger.info(f"Retrieved {len(tutors_data)} tutors for student {student_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Tutors retrieved successfully',
            'data': {
                'student_id': student_id,
                'student_name': student_profile.get('name'),
                'enrolled_courses': enrolled_courses,
                'tutor_count': len(tutors_data),
                'tutors': tutors_data
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving tutors for student courses: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500
