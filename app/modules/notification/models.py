from datetime import datetime
from enum import Enum
from uuid import uuid4

class NotificationType(Enum):
    MANUAL = "manual"
    EVENT = "event"

class EventType(Enum):
    COURSE_REQUEST = "course_request"
    SCHEDULE_CHANGE = "schedule_change"
    SCHEDULE_CREATE = "schedule_create"
    SCHEDULE_UPDATE = "schedule_update"
    SCHEDULE_DELETE = "schedule_delete"

class RecipientType(Enum):
    TUTOR = "tutor"
    STUDENT = "student"

class Notification:
    def __init__(self, recipient_id, recipient_type, title, message, 
                 notification_type, sender_id=None, event_type=None, related_data=None):
        self.id = f"notif_{uuid4().hex[:8]}"
        self.recipient_id = recipient_id
        self.recipient_type = recipient_type
        self.sender_id = sender_id
        self.title = title
        self.message = message
        self.type = notification_type
        self.event_type = event_type
        self.related_data = related_data or {}
        self.is_read = False
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def mark_as_read(self):
        self.is_read = True
        self.updated_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            "id": self.id,
            "recipient_id": self.recipient_id,
            "recipient_type": self.recipient_type,
            "sender_id": self.sender_id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "event_type": self.event_type,
            "related_data": self.related_data,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }