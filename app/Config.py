import os


class Config:
    # Security key for sessions/cookies (use a real random string in production)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-very-secret'

    # Path setup to locate data/mock_db.json relative to this file
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    JSON_DB_PATH = os.path.join(BASE_DIR, '../database/mock_db.json')