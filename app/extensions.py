import json
import os
from flask_marshmallow import Marshmallow

ma = Marshmallow()


class JsonDatabase:
    def __init__(self, app=None):
        self.file_path = None
        # Initialize memory storage structure
        self.data = {"users": [], "sessions": []}
        if app:
            self.init_app(app)

    def init_app(self, app):
        """Bind the database to the Flask app context"""
        self.file_path = app.config.get('JSON_DB_PATH', 'data/mock_db.json')
        self.load()

    def load(self):
        """Read data from the JSON file into memory"""
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r', encoding='utf-8') as f:
                try:
                    self.data = json.load(f)
                except json.JSONDecodeError:
                    self.data = {"users": [], "sessions": []}
        else:
            # Create a new file if it doesn't exist
            self.save()

    def save(self):
        """Write memory data back to the JSON file"""
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=4, ensure_ascii=False)

    # --- Helper Query Methods ---

    def find_user_by_email(self, email):
        for user in self.data['users']:
            if user['email'] == email:
                return user
        return None

    def add_user(self, user_dict):
        self.data['users'].append(user_dict)
        self.save()


# Create a global instance to be imported by other modules
db = JsonDatabase()