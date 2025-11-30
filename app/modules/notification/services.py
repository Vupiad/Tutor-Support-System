import json
import os
from datetime import datetime
from .models import Notification, NotificationType, EventType, RecipientType

class NotificationService:
    def __init__(self, db_path="database/mock_notification_dtb.json"):
        self.db_path = db_path
    
    def _load_notifications(self):
        try:
            with open(self.db_path, 'r') as f:
                data = json.load(f)
                return data.get('notifications', [])
        except FileNotFoundError:
            return []
    
    def _save_notifications(self, notifications):
        with open(self.db_path, 'r') as f:
            data = json.load(f)
        data['notifications'] = notifications
        with open(self.db_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def send_manual_notification(self, recipient_id, recipient_type, title, 
                                message, sender_id):
        notification = Notification(
            recipient_id=recipient_id,
            recipient_type=recipient_type,
            title=title,
            message=message,
            notification_type=NotificationType.MANUAL.value,
            sender_id=sender_id
        )
        
        notifications = self._load_notifications()
        notifications.append(notification.to_dict())
        self._save_notifications(notifications)
        
        return notification.to_dict()
    
    def send_event_notification(self, recipient_id, recipient_type, event_type, 
                               title, message, sender_id, related_data=None):
        notification = Notification(
            recipient_id=recipient_id,
            recipient_type=recipient_type,
            title=title,
            message=message,
            notification_type=NotificationType.EVENT.value,
            sender_id=sender_id,
            event_type=event_type,
            related_data=related_data
        )
        
        notifications = self._load_notifications()
        notifications.append(notification.to_dict())
        self._save_notifications(notifications)
        
        return notification.to_dict()
    
    def notify_course_registration(self, student_id, tutor_id, course_id, course_name):
        message = f"Student have register course '{course_name}' of you."
        return self.send_event_notification(
            recipient_id=tutor_id,
            recipient_type=RecipientType.TUTOR.value,
            event_type=EventType.COURSE_REQUEST.value,
            title="Request to register course",
            message=message,
            sender_id=student_id,
            related_data={
                "student_id": student_id,
                "course_id": course_id,
                "course_name": course_name
            }
        )
    
    def notify_schedule_created(self, tutor_id, student_ids, schedule_id, schedule_info):
        notifications = []
        for student_id in student_ids:
            notif = self.send_event_notification(
                recipient_id=student_id,
                recipient_type=RecipientType.STUDENT.value,
                event_type=EventType.SCHEDULE_CREATE.value,
                title="Schedule created",
                message=f"Teacher has just create schedule: {schedule_info.get('time', '')}",
                sender_id=tutor_id,
                related_data={
                    "tutor_id": tutor_id,
                    "schedule_id": schedule_id,
                    "schedule_info": schedule_info
                }
            )
            notifications.append(notif)
        return notifications
    
    def notify_schedule_updated(self, tutor_id, student_ids, schedule_id, old_info, new_info):
        notifications = []
        for student_id in student_ids:
            notif = self.send_event_notification(
                recipient_id=student_id,
                recipient_type=RecipientType.STUDENT.value,
                event_type=EventType.SCHEDULE_UPDATE.value,
                title="Schedule updated",
                message=f"Teacher has just update schedule: {new_info.get('time', '')}",
                sender_id=tutor_id,
                related_data={
                    "tutor_id": tutor_id,
                    "schedule_id": schedule_id,
                    "old_info": old_info,
                    "new_info": new_info
                }
            )
            notifications.append(notif)
        return notifications
    
    def notify_schedule_deleted(self, tutor_id, student_ids, schedule_id, schedule_info):
        notifications = []
        for student_id in student_ids:
            notif = self.send_event_notification(
                recipient_id=student_id,
                recipient_type=RecipientType.STUDENT.value,
                event_type=EventType.SCHEDULE_DELETE.value,
                title="Schedule deleted",
                message=f"Teacher has just delete schedule: {schedule_info.get('time', '')}",
                sender_id=tutor_id,
                related_data={
                    "tutor_id": tutor_id,
                    "schedule_id": schedule_id,
                    "schedule_info": schedule_info
                }
            )
            notifications.append(notif)
        return notifications
    
    def notify_booking_created(self, student_id, tutor_id, booking_info):
        """Notify tutor when student books a session"""
        return self.send_event_notification(
            recipient_id=tutor_id,
            recipient_type=RecipientType.TUTOR.value,
            event_type=EventType.COURSE_REQUEST.value,
            title="Buổi học mới được đặt",
            message=f"Sinh viên {booking_info.get('student_name', 'Unknown')} đã đặt buổi học {booking_info.get('course_name', '')} vào {booking_info.get('date_time', '')}",
            sender_id=student_id,
            related_data={
                "student_id": student_id,
                "course_name": booking_info.get('course_name'),
                "date_time": booking_info.get('date_time'),
                "slot_end": booking_info.get('slot_end')
            }
        )
    
    def notify_schedule_deletion_to_student(self, student_id, tutor_name, schedule_info):
        """Notify student when tutor cancels a free slot (might have bookings on it)"""
        return self.send_event_notification(
            recipient_id=student_id,
            recipient_type=RecipientType.STUDENT.value,
            event_type=EventType.SCHEDULE_DELETE.value,
            title="Lịch rảnh bị hủy",
            message=f"Gia sư {tutor_name} đã hủy lịch rảnh: {schedule_info.get('time', '')}",
            sender_id="SYSTEM",
            related_data={
                "tutor_name": tutor_name,
                "schedule_info": schedule_info
            }
        )
    
    def get_user_notifications(self, user_id, limit=20, skip=0):
        notifications = self._load_notifications()
        user_notifs = [n for n in notifications if n['recipient_id'] == user_id]
        user_notifs.sort(key=lambda x: x['created_at'], reverse=True)
        return user_notifs[skip:skip+limit]
    
    def get_unread_notifications_count(self, user_id):
        notifications = self._load_notifications()
        unread = [n for n in notifications if n['recipient_id'] == user_id and not n['is_read']]
        return len(unread)
    
    def mark_notification_as_read(self, notification_id):
        notifications = self._load_notifications()
        for notif in notifications:
            if notif['id'] == notification_id:
                notif['is_read'] = True
                notif['updated_at'] = datetime.utcnow().isoformat()
                self._save_notifications(notifications)
                return notif
        return None
    
    def mark_all_as_read(self, user_id):
        notifications = self._load_notifications()
        for notif in notifications:
            if notif['recipient_id'] == user_id:
                notif['is_read'] = True
                notif['updated_at'] = datetime.utcnow().isoformat()
        self._save_notifications(notifications)
        return True
    
    def delete_notification(self, notification_id):
        notifications = self._load_notifications()
        notifications = [n for n in notifications if n['id'] != notification_id]
        self._save_notifications(notifications)
        return True