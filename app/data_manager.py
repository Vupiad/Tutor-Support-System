"""
Data Manager Module: Handles reading/writing/searching mock data files.
Provides helper functions to interact with JSON mock data without exposing file operations.
"""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DB_PATH = Path(__file__).parent.parent / 'database'


class MockDataManager:
    """Central manager for mock data operations."""

    @staticmethod
    def load_json(filename: str) -> Dict[str, Any]:
        """
        Load data from a JSON file in the database directory.
        
        Args:
            filename: Name of the JSON file (e.g., 'mock_datacore.json')
            
        Returns:
            Dictionary containing the parsed JSON data, or empty dict if file doesn't exist.
        """
        file_path = BASE_DB_PATH / filename
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                logger.warning(f"File not found: {file_path}")
                return {}
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in {filename}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error loading {filename}: {e}")
            return {}

    @staticmethod
    def save_json(filename: str, data: Dict[str, Any]) -> bool:
        """
        Save data to a JSON file in the database directory.
        
        Args:
            filename: Name of the JSON file
            data: Dictionary to save
            
        Returns:
            True if successful, False otherwise.
        """
        file_path = BASE_DB_PATH / filename
        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Successfully saved {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving {filename}: {e}")
            return False


class DatacoreManager:
    """Manager for mock_datacore.json operations."""

    @staticmethod
    def get_user_profile(sso_id: str) -> Optional[Dict]:
        """Get user profile by SSO ID from mock_datacore.json."""
        data = MockDataManager.load_json('mock_datacore.json')
        for user in data.get('users', []):
            if user.get('id') == sso_id:
                return user
        return None

    @staticmethod
    def get_all_users() -> List[Dict]:
        """Get all users from mock_datacore.json."""
        data = MockDataManager.load_json('mock_datacore.json')
        return data.get('users', [])

    @staticmethod
    def get_all_tutors() -> List[Dict]:
        """Get all tutors (users with role_in_school='lecturer') from mock_datacore.json."""
        data = MockDataManager.load_json('mock_datacore.json')
        tutors = [user for user in data.get('users', []) 
                  if user.get('role_in_school') == 'lecturer']
        return tutors

    @staticmethod
    def get_all_students() -> List[Dict]:
        """Get all students (users with role_in_school='student') from mock_datacore.json."""
        data = MockDataManager.load_json('mock_datacore.json')
        students = [user for user in data.get('users', []) 
                    if user.get('role_in_school') == 'student']
        return students

    @staticmethod
    def find_tutors_by_course(course_name: str) -> List[Dict]:
        """
        Find all tutors teaching a specific course.
        
        Args:
            course_name: Name/code of the course (e.g., 'CSC101')
            
        Returns:
            List of tutor profiles matching the course.
        """
        tutors = DatacoreManager.get_all_tutors()
        matching_tutors = []
        
        for tutor in tutors:
            subjects = tutor.get('subjects', [])
            if course_name in subjects:
                matching_tutors.append(tutor)
        
        return matching_tutors

    @staticmethod
    def get_tutor_by_id(tutor_id: str) -> Optional[Dict]:
        """Get tutor profile by tutor ID."""
        return DatacoreManager.get_user_profile(tutor_id)

    @staticmethod
    def get_student_by_id(student_id: str) -> Optional[Dict]:
        """Get student profile by student ID."""
        return DatacoreManager.get_user_profile(student_id)


class TutorSessionManager:
    """Manager for mock_tutor_sessions.json operations."""

    @staticmethod
    def get_all_sessions() -> List[Dict]:
        """Get all tutor sessions."""
        data = MockDataManager.load_json('mock_tutor_sessions.json')
        return data.get('sessions', [])

    @staticmethod
    def get_sessions_by_tutor(tutor_id: str) -> List[Dict]:
        """
        Get all sessions for a specific tutor.
        
        Args:
            tutor_id: ID of the tutor
            
        Returns:
            List of sessions belonging to the tutor.
        """
        all_sessions = TutorSessionManager.get_all_sessions()
        return [s for s in all_sessions if s.get('tutor_id') == tutor_id]

    @staticmethod
    def get_session_by_id(session_id: str) -> Optional[Dict]:
        """Get a specific tutor session by session ID."""
        all_sessions = TutorSessionManager.get_all_sessions()
        for session in all_sessions:
            if session.get('session_id') == session_id:
                return session
        return None

    @staticmethod
    def create_session(tutor_id: str, course_name: str, date_time: str, 
                      status: str = 'scheduled', student_count: int = 0, 
                      duration_minutes: int = 60) -> bool:
        """
        Create a new tutor session.
        
        Args:
            tutor_id: ID of the tutor
            course_name: Course name/code
            date_time: ISO format datetime string
            status: Session status (scheduled, completed, cancelled)
            student_count: Number of students in session
            duration_minutes: Session duration in minutes
            
        Returns:
            True if successful, False otherwise.
        """
        data = MockDataManager.load_json('mock_tutor_sessions.json')
        
        # Generate new session ID
        existing_ids = [s.get('session_id', 'TS000') for s in data.get('sessions', [])]
        max_num = max([int(id.replace('TS', '')) for id in existing_ids if id.startswith('TS')], default=0)
        new_session_id = f"TS{max_num + 1:03d}"
        
        new_session = {
            'session_id': new_session_id,
            'tutor_id': tutor_id,
            'course_name': course_name,
            'date_time': date_time,
            'status': status,
            'student_count': student_count,
            'duration_minutes': duration_minutes
        }
        
        data.get('sessions', []).append(new_session)
        return MockDataManager.save_json('mock_tutor_sessions.json', data)


class AssignmentManager:
    """Manager for mock_assignments.json operations."""

    @staticmethod
    def get_all_assignments() -> List[Dict]:
        """Get all assignments."""
        data = MockDataManager.load_json('mock_assignments.json')
        return data.get('assignments', [])

    @staticmethod
    def get_assignments_by_tutor(tutor_id: str) -> List[Dict]:
        """
        Get all assignments for a specific tutor (students assigned to this tutor).
        
        Args:
            tutor_id: ID of the tutor
            
        Returns:
            List of assignments for the tutor.
        """
        all_assignments = AssignmentManager.get_all_assignments()
        return [a for a in all_assignments if a.get('tutor_id') == tutor_id]

    @staticmethod
    def get_assignments_by_student(student_id: str) -> List[Dict]:
        """
        Get all assignments for a specific student (tutors assigned to this student).
        
        Args:
            student_id: ID of the student
            
        Returns:
            List of assignments for the student.
        """
        all_assignments = AssignmentManager.get_all_assignments()
        return [a for a in all_assignments if a.get('student_id') == student_id]

    @staticmethod
    def get_assignment_by_id(assignment_id: str) -> Optional[Dict]:
        """Get a specific assignment by assignment ID."""
        all_assignments = AssignmentManager.get_all_assignments()
        for assignment in all_assignments:
            if assignment.get('assignment_id') == assignment_id:
                return assignment
        return None

    @staticmethod
    def create_assignment(tutor_id: str, student_id: str, student_name: str,
                         course_name: str, class_name: str, start_date: str,
                         rating: float = 0.0) -> bool:
        """
        Create a new assignment.
        
        Args:
            tutor_id: ID of the tutor
            student_id: ID of the student
            student_name: Name of the student
            course_name: Course name/code
            class_name: Class identifier
            start_date: Start date (YYYY-MM-DD format)
            rating: Initial rating (0.0 - 5.0)
            
        Returns:
            True if successful, False otherwise.
        """
        data = MockDataManager.load_json('mock_assignments.json')
        
        # Generate new assignment ID
        existing_ids = [a.get('assignment_id', 'ASN000') for a in data.get('assignments', [])]
        max_num = max([int(id.replace('ASN', '')) for id in existing_ids if id.startswith('ASN')], default=0)
        new_assignment_id = f"ASN{max_num + 1:03d}"
        
        new_assignment = {
            'assignment_id': new_assignment_id,
            'tutor_id': tutor_id,
            'student_id': student_id,
            'student_name': student_name,
            'course_name': course_name,
            'class_name': class_name,
            'start_date': start_date,
            'rating': rating
        }
        
        data.get('assignments', []).append(new_assignment)
        return MockDataManager.save_json('mock_assignments.json', data)


class ScheduleManager:
    """Manager for mock_schedule.json operations."""

    @staticmethod
    def get_schedule() -> Dict:
        """Get all schedule data."""
        return MockDataManager.load_json('mock_schedule.json')

    @staticmethod
    def get_tutor_slots(tutor_id: str) -> List[Dict]:
        """
        Get available time slots for a specific tutor.
        
        Args:
            tutor_id: ID of the tutor
            
        Returns:
            List of available time slots.
        """
        schedule = ScheduleManager.get_schedule()
        tutor_schedule = schedule.get(tutor_id, {})
        return tutor_schedule.get('slots', [])

    @staticmethod
    def get_available_tutors_for_time_slot(start_time: str, end_time: str) -> List[str]:
        """
        Get tutors available during a specific time slot.
        
        Args:
            start_time: Start time (ISO format)
            end_time: End time (ISO format)
            
        Returns:
            List of available tutor IDs.
        """
        schedule = ScheduleManager.get_schedule()
        available_tutors = []
        
        for tutor_id, tutor_data in schedule.items():
            slots = tutor_data.get('slots', [])
            for slot in slots:
                if slot.get('start') <= start_time and slot.get('end') >= end_time:
                    available_tutors.append(tutor_id)
                    break
        
        return available_tutors
