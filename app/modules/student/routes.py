"""
Student Routes Module: API endpoints for student operations.
Requires authentication and 'student' role.
"""

import logging
import json
from datetime import datetime
from flask import Blueprint, jsonify, session, request
from app.modules.auth.routes import auth_required, role_required
from app.data_manager import (
    DatacoreManager, ScheduleManager, AssignmentManager, StudentBookingManager, TutorSessionManager
)
from . import tutorSearchService

logger = logging.getLogger(__name__)

student_bp = Blueprint('student', __name__, url_prefix='/api')


@student_bp.route('/student/tutors/search', methods=['GET'])
@auth_required
@role_required('student')
async def search_tutors_by_semantic():
    """
    GET /api/student/tutors/search?course_name=<course_name>
    
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
        tutors = await tutorSearchService.search_tutors_by_meaning(course_name, top_k=5)
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


@student_bp.route('/student/sessions/book', methods=['POST'])
@auth_required
@role_required('student')
def book_tutoring_session():
    """
    POST /api/student/sessions/book
    
    Book a tutoring session with a tutor.
    Requires: authentication, student role
    
    Request Body (JSON):
        {
            "tutor_id": "LECTURER_001",
            "course_name": "CSC101",
            "slot_start": "2025-12-01T09:00:00Z",
            "slot_end": "2025-12-01T10:00:00Z"
        }
    
    Response (201):
        {
            "status": "success",
            "message": "Session booked successfully",
            "data": {
                "booking_id": "BK003",
                "tutor_name": "Phạm Thị Tú",
                "course_name": "CSC101",
                "date_time": "2025-12-01T09:00:00Z",
                "status": "confirmed"
            }
        }
    """
    try:
        data = request.get_json(silent=True) or {}
        student_id = session.get('user_id')
        tutor_id = data.get('tutor_id')
        course_name = data.get('course_name')
        slot_start = data.get('slot_start')
        slot_end = data.get('slot_end')
        
        if not tutor_id or not course_name or not slot_start:
            logger.warning(f"Missing required parameters for booking")
            return jsonify({
                'status': 'error',
                'message': 'Missing required parameters: tutor_id, course_name, slot_start',
                'data': None
            }), 400
        
        # Get tutor profile
        tutor_profile = DatacoreManager.get_tutor_by_id(tutor_id)
        if not tutor_profile:
            return jsonify({
                'status': 'error',
                'message': 'Tutor not found',
                'data': None
            }), 404
        
        # Create booking using StudentBookingManager (status='pending' initially)
        booking_id = StudentBookingManager.create_booking(
            student_id=student_id,
            tutor_id=tutor_id,
            session_id=f"SL{int(datetime.now().timestamp())}",  # Generate unique ID
            course_name=course_name,
            tutor_name=tutor_profile.get('name'),
            date_time=slot_start,
            status='pending'  # Changed from 'confirmed' to 'pending' - tutor must approve
        )
        
        if not booking_id:
            return jsonify({
                'status': 'error',
                'message': 'You have already booked this slot or booking failed',
                'data': None
            }), 409
        
        logger.info(f"Student {student_id} booked slot with tutor {tutor_id}")
        
        # Send notification to tutor
        from app.modules.notification.services import NotificationService
        notif_service = NotificationService()
        try:
            notif_service.notify_booking_created(
                student_id=student_id,
                tutor_id=tutor_id,
                booking_info={
                    "booking_id": booking_id,
                    "student_name": DatacoreManager.get_user_profile(student_id).get('name'),
                    "course_name": course_name,
                    "date_time": slot_start,
                    "slot_end": slot_end
                }
            )
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'Session booked successfully',
            'data': {
                'booking_id': booking_id,
                'tutor_name': tutor_profile.get('name'),
                'course_name': course_name,
                'date_time': slot_start,
                'status': 'confirmed'
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Error booking session: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500


@student_bp.route('/student/sessions/cancel/<booking_id>', methods=['POST'])
@auth_required
@role_required('student')
def cancel_booking(booking_id):
    """
    POST /api/student/sessions/cancel/<booking_id>
    
    Cancel a student's booking.
    Requires: authentication, student role
    
    Response (200):
        {
            "status": "success",
            "message": "Booking cancelled successfully"
        }
    """
    try:
        student_id = session.get('user_id')
        
        # Get booking to verify it belongs to student
        booking = StudentBookingManager.get_booking_by_id(booking_id)
        if not booking:
            return jsonify({
                'status': 'error',
                'message': 'Booking not found',
                'data': None
            }), 404
        
        if booking.get('student_id') != student_id:
            return jsonify({
                'status': 'error',
                'message': 'This booking does not belong to you',
                'data': None
            }), 403
        
        # Cancel booking
        StudentBookingManager.cancel_booking(booking_id)
        
        logger.info(f"Student {student_id} cancelled booking {booking_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Booking cancelled successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error cancelling booking: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500


@student_bp.route('/tutor/bookings/<booking_id>/approve', methods=['POST'])
@auth_required
@role_required('tutor')
def approve_booking(booking_id):
    """
    POST /api/tutor/bookings/<booking_id>/approve
    
    Approve a student's booking request.
    Requires: authentication, tutor role
    
    Response (200):
        {
            "status": "success",
            "message": "Booking approved successfully"
        }
    """
    try:
        tutor_id = session.get('user_id')
        
        # Get booking to verify it belongs to this tutor
        booking = StudentBookingManager.get_booking_by_id(booking_id)
        if not booking:
            return jsonify({
                'status': 'error',
                'message': 'Booking not found',
                'data': None
            }), 404
        
        if booking.get('tutor_id') != tutor_id:
            return jsonify({
                'status': 'error',
                'message': 'This booking does not belong to you',
                'data': None
            }), 403
        
        # Approve booking
        StudentBookingManager.approve_booking(booking_id)
        
        logger.info(f"Tutor {tutor_id} approved booking {booking_id}")
        
        # Mark the original booking notification (for this tutor) as read
        try:
            from app.modules.notification.services import NotificationService
            notif_service = NotificationService()
            # find tutor notifications related to this booking and mark as read
            tutor_notifs = notif_service.get_user_notifications(tutor_id, limit=200)
            for n in tutor_notifs:
                rd = n.get('related_data') or {}
                if rd.get('booking_id') == booking_id:
                    notif_service.mark_notification_as_read(n.get('id'))
        except Exception:
            logger.exception('Failed to mark booking notification as read for tutor')

        # Create a scheduled session for the tutor so it appears in sessions list
        try:
            from app.data_manager import TutorSessionManager
            # Use booking info to create a session
            TutorSessionManager.create_session(
                tutor_id=tutor_id,
                course_name=booking.get('course_name', 'Unknown'),
                date_time=booking.get('date_time'),
                status='scheduled',
                student_count=1,
                duration_minutes=booking.get('duration_minutes', 60) or 60
            )
        except Exception:
            logger.exception('Failed to create tutor session after approval')

        # Send notification to student
        from app.modules.notification.services import NotificationService
        notif_service = NotificationService()
        try:
            tutor_profile = DatacoreManager.get_user_profile(tutor_id)
            tutor_name = tutor_profile.get('name', 'Unknown') if tutor_profile else 'Unknown'
            
            notif_service.notify_booking_approved(
                student_id=booking.get('student_id'),
                tutor_name=tutor_name,
                booking_info={
                    'booking_id': booking_id,
                    'course_name': booking.get('course_name'),
                    'date_time': booking.get('date_time')
                }
            )
        except Exception as e:
            logger.error(f"Failed to send approval notification: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'Booking approved successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error approving booking: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500


@student_bp.route('/tutor/bookings/<booking_id>/reject', methods=['POST'])
@auth_required
@role_required('tutor')
def reject_booking(booking_id):
    """
    POST /api/tutor/bookings/<booking_id>/reject
    
    Reject a student's booking request.
    Requires: authentication, tutor role
    
    Response (200):
        {
            "status": "success",
            "message": "Booking rejected successfully"
        }
    """
    try:
        tutor_id = session.get('user_id')
        
        # Get booking to verify it belongs to this tutor
        booking = StudentBookingManager.get_booking_by_id(booking_id)
        if not booking:
            return jsonify({
                'status': 'error',
                'message': 'Booking not found',
                'data': None
            }), 404
        
        if booking.get('tutor_id') != tutor_id:
            return jsonify({
                'status': 'error',
                'message': 'This booking does not belong to you',
                'data': None
            }), 403
        
        # Reject booking
        StudentBookingManager.reject_booking(booking_id)
        
        logger.info(f"Tutor {tutor_id} rejected booking {booking_id}")
        
        # Mark the original booking notification (for this tutor) as read
        try:
            from app.modules.notification.services import NotificationService
            notif_service = NotificationService()
            tutor_notifs = notif_service.get_user_notifications(tutor_id, limit=200)
            for n in tutor_notifs:
                rd = n.get('related_data') or {}
                if rd.get('booking_id') == booking_id:
                    notif_service.mark_notification_as_read(n.get('id'))
        except Exception:
            logger.exception('Failed to mark booking notification as read for tutor')

        # Send notification to student about rejection
        from app.modules.notification.services import NotificationService
        notif_service = NotificationService()
        try:
            tutor_profile = DatacoreManager.get_user_profile(tutor_id)
            tutor_name = tutor_profile.get('name', 'Unknown') if tutor_profile else 'Unknown'
            
            notif_service.notify_booking_rejected(
                student_id=booking.get('student_id'),
                tutor_name=tutor_name,
                booking_info={
                    'booking_id': booking_id,
                    'course_name': booking.get('course_name'),
                    'date_time': booking.get('date_time')
                }
            )
        except Exception as e:
            logger.error(f"Failed to send rejection notification: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'Booking rejected successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error rejecting booking: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500


@student_bp.route('/student/sessions/my-bookings', methods=['GET'])
@auth_required
@role_required('student')
def get_student_bookings():
    """
    GET /api/student/sessions/my-bookings
    
    Get list of sessions the student has booked.
    Requires: authentication, student role
    
    Response (200):
        {
            "status": "success",
            "message": "Bookings retrieved",
            "data": {
                "student_id": "SE2025001",
                "booking_count": 2,
                "bookings": [
                    {
                        "booking_id": "BK001",
                        "session_id": "TS001",
                        "tutor_name": "Phạm Thị Tú",
                        "course_name": "CSC101",
                        "date_time": "2025-12-01T09:00:00Z",
                        "status": "confirmed",
                        "booked_at": "2025-11-27T08:00:00Z"
                    },
                    ...
                ]
            }
        }
    """
    try:
        student_id = session.get('user_id')
        
        # Get bookings using StudentBookingManager
        student_bookings = StudentBookingManager.get_bookings_by_student(student_id)
        
        logger.info(f"Retrieved {len(student_bookings)} bookings for student {student_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Bookings retrieved successfully',
            'data': {
                'student_id': student_id,
                'booking_count': len(student_bookings),
                'bookings': student_bookings
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving student bookings: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error',
            'data': None
        }), 500

