"""
Mock SSO, Role Map, and Datacore connectors for simulating HCMUT authentication and data systems.
"""
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, List


class MockSchedules:
    """Simulates HCMUT_SSO: stores user credentials (username/password) and issues SSO IDs."""

    def __init__(self, schedule_file: str = "database/mock_schedule.json"):
        self.file_path = Path(schedule_file)
        self.data = self._load()

    def _load(self):
        """Load SSO data from JSON file."""
        if self.file_path.exists():
            try:
                with open(self.file_path, 'r') as f:
                    return json.load(f)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                print(f"Error schedule file not found: {e}")
                # If file is missing or corrupt, return an empty dictionary
                return {}

    def _save(self):
        """Writes the current dictionary of schedules back to the JSON file."""
        with open(self.file_path, 'w') as f:
            json.dump(self.data, f, indent=4)
        self.data = self._load()



schedulesData = MockSchedules()