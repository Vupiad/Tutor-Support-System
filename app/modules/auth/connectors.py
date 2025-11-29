"""
Mock SSO, Role Map, and Datacore connectors for simulating HCMUT authentication and data systems.
"""
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, List


class MockSSO:
    """Simulates HCMUT_SSO: stores user credentials (username/password) and issues SSO IDs."""

    def __init__(self, sso_file: str = "database/mock_sso.json"):
        self.file_path = Path(sso_file)
        self.data = self._load()

    def _load(self):
        """Load SSO data from JSON file."""
        if self.file_path.exists():
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"users": []}

    def _save(self):
        """Persist SSO data back to JSON file."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def authenticate(self, username: str, password: str) -> Optional[Dict]:
        """
        Verify credentials and return SSO user record (with sso_id).
        Returns None if credentials invalid.
        """
        for user in self.data.get('users', []):
            if user.get('username') == username and user.get('password') == password:
                return user
        return None

    def get_user_by_id(self, sso_id: str) -> Optional[Dict]:
        """Fetch user by SSO ID."""
        for user in self.data.get('users', []):
            if user.get('id') == sso_id:
                return user
        return None

    def update_last_login(self, sso_id: str):
        """Update last_login timestamp for a user."""
        user = self.get_user_by_id(sso_id)
        if user:
            user['last_login'] = datetime.now(timezone.utc).isoformat()
            self._save()


class MockRoleMap:
    """Maps SSO IDs to roles (student, tutor, admin, etc.)."""

    def __init__(self, role_map_file: str = "database/mock_role_map.json"):
        self.file_path = Path(role_map_file)
        self.data = self._load()

    def _load(self):
        """Load role map data from JSON file."""
        if self.file_path.exists():
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"mappings": []}

    def get_role(self, sso_id: str) -> Optional[str]:
        """Get role for a given SSO ID."""
        for mapping in self.data.get('mappings', []):
            if mapping.get('sso_id') == sso_id:
                return mapping.get('role')
        return None


class MockDatacore:
    """Simulates HCMUT_DATACORE: stores user profile data (name, faculty, courses, etc.)."""

    def __init__(self, datacore_file: str = "database/mock_datacore.json"):
        self.file_path = Path(datacore_file)
        self.data = self._load()

    def _load(self):
        """Load Datacore data from JSON file."""
        if self.file_path.exists():
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"users": []}

    def get_user_profile(self, sso_id: str) -> Optional[Dict]:
        """Fetch user profile by SSO ID."""
        for user in self.data.get('users', []):
            if user.get('id') == sso_id:
                return user
        return None


class MockSessionStore:
    """Stores active sessions (server-side session management)."""

    def __init__(self, sessions_file: str = "database/mock_sessions.json"):
        self.file_path = Path(sessions_file)
        self.data = self._load()

    def _load(self):
        """Load session data from JSON file."""
        if self.file_path.exists():
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"sessions": []}

    def _save(self):
        """Persist session data back to JSON file."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def create_session(self, sso_id: str, username: str, role: str, email: str, display_name: str) -> str:
        """
        Create a new session and return session_id (token).
        Session data includes user info for later validation.
        """
        import uuid
        session_id = str(uuid.uuid4())
        session_record = {
            'session_id': session_id,
            'sso_id': sso_id,
            'username': username,
            'role': role,
            'email': email,
            'display_name': display_name,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'last_activity': datetime.now(timezone.utc).isoformat(),
            'expires_at': None  # Optional: set TTL
        }
        self.data['sessions'].append(session_record)
        self._save()
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve a session by session_id."""
        for session in self.data.get('sessions', []):
            if session.get('session_id') == session_id:
                return session
        return None

    def invalidate_session(self, session_id: str):
        """Remove a session (logout)."""
        self.data['sessions'] = [s for s in self.data['sessions'] if s.get('session_id') != session_id]
        self._save()


# Global instances (singleton pattern for easier access)
sso = MockSSO()
role_map = MockRoleMap()
datacore = MockDatacore()
session_store = MockSessionStore()