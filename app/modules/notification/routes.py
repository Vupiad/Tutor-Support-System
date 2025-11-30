from flask import Blueprint, request, jsonify, session
from .services import NotificationService
import logging

logger = logging.getLogger(__name__)
notification_bp = Blueprint('notification', __name__, url_prefix='notification')
notif_service = NotificationService()

def verify_session():
    """Authentication by Flask session"""
    if 'user_id' not in session:
        return None, jsonify({'error': 'Not authenticated'}), 401

    session_record = {
        'sso_id': session.get('user_id'),
        'username': session.get('username'),
        'email': session.get('email'),
        'display_name': session.get('display_name'),
        'role': session.get('role')
    }

    return session_record, None, None



# ===== Send Notification active (like message between 2 user) =====
@notification_bp.route('/send-manual', methods=['POST'])
def send_manual_notification():
    """
    Send Notification manual
    POST {{base_url}}/notification/send-manual
    """
    try:
        session_record, error, status_code = verify_session()
        if error:
            return error, status_code
        
        logger.info(f"User {session_record['sso_id']} sending notification")
        
        
        data = request.get_json()
        
        if not all(k in data for k in ['recipient_id', 'recipient_type', 'title', 'message', 'sender_id']):
            return jsonify({"error": "Missing required fields"}), 400
        
        result = notif_service.send_manual_notification(
            recipient_id=data['recipient_id'],
            recipient_type=data['recipient_type'],
            title=data['title'],
            message=data['message'],
            sender_id=data['sender_id']
        )
        
        logger.info(f" Notification created: {result['id']}")

        return jsonify({"success": True, "data": result}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== View Notification =====
@notification_bp.route('/user/<user_id>', methods=['GET'])
def get_user_notifications(user_id):
    """
    Get list of notifications of 1 user
    GET {{base_url}}/notification/user/{{student_id}}?limit=20&skip=0 
       
    skip = 0 (default)
    limit = 20 (default) 
    """
    try:
        session_record, error, status_code = verify_session()
        if error:
            return error, status_code
        
        if session_record['sso_id'] != user_id:
            logger.warning(f" User {session_record['sso_id']} trying to access {user_id} notifications")
            return jsonify({"error": "You can only view your own notifications"}), 403
        
        logger.info(f"Getting notifications for user: {user_id}")
        
        limit = request.args.get('limit', 20, type=int)
        skip = request.args.get('skip', 0, type=int)
        
        notifications = notif_service.get_user_notifications(user_id, limit, skip)
        unread_count = notif_service.get_unread_notifications_count(user_id)
        
        logger.info(f" Found {len(notifications)} notifications, {unread_count} unread")

        return jsonify({
            "success": True,
            "data": notifications,
            "unread_count": unread_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ====== Get number of Notification that has not read =========
@notification_bp.route('/unread-count/<user_id>', methods=['GET'])
def get_unread_count(user_id):
    """
    Get number of notifications that has not read
    GET {{base_url}}/notification/unread-count/{{student_id}}
    """
    try:
        session_record, error, status_code = verify_session()
        if error:
            return error, status_code
        
        if session_record['sso_id'] != user_id:
            return jsonify({"error": "You can only view your own notifications"}), 403
        
        logger.info(f"🔔 Getting unread count for user: {user_id}")
        count = notif_service.get_unread_notifications_count(user_id)
        logger.info(f" Unread count: {count}")
        return jsonify({"success": True, "unread_count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== Mark Notification as Read =====
@notification_bp.route('/<notification_id>/read', methods=['PUT'])
def mark_as_read(notification_id):
    """
    Mark Notification as Read
    PUT {{base_url}}/notification/{{notification_id}}/read
    """
    try:
        # Cookie Authentication 
        session_record, error, status_code = verify_session()
        if error:
            return error, status_code
        
        logger.info(f" Marking notification as read: {notification_id}")
        result = notif_service.mark_notification_as_read(notification_id)
        if result:
            if result['recipient_id'] != session_record['sso_id']:
                return jsonify({"error": "You can only modify your own notifications"}), 403
            
            logger.info(f" Notification {notification_id} marked as read")
            return jsonify({"success": True, "data": result}), 200
        logger.warning(f" Notification not found: {notification_id}")
        return jsonify({"error": "Notification not found"}), 404
    except Exception as e:
        logger.error(f" Error: {str(e)}")
        return jsonify({"error": str(e)}), 500



@notification_bp.route('/user/<user_id>/read-all', methods=['PUT'])
def mark_all_as_read(user_id):
    """
    Mark all notifications as read
    PUT {{base_url}}/notification/user/{{student_id}}/read-all
    """
    try:
        session_record, error, status_code = verify_session()
        if error:
            return error, status_code
        
        if session_record['sso_id'] != user_id:
            return jsonify({"error": "You can only modify your own notifications"}), 403
        
        logger.info(f" Marking all notifications as read for user: {user_id}")
        notif_service.mark_all_as_read(user_id)
        logger.info(f" All notifications marked as read for {user_id}")
        return jsonify({"success": True, "message": "All notifications marked as read"}), 200
    except Exception as e:
        logger.error(f" Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ===== Deleted Notifcation =====
@notification_bp.route('/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    """
    Deleted Notifcation
    DELETE  {{base_url}}/notification/{{notification_id}}
    """
    try:
        # Cookie Authentication
        session_record, error, status_code = verify_session()
        if error:
            return error, status_code
        
        logger.info(f" Deleting notification: {notification_id}")
        
        notif = notif_service._load_notifications()
        target_notif = next((n for n in notif if n['id'] == notification_id), None)
        
        if not target_notif:
            return jsonify({"error": "Notification not found"}), 404
        
        if target_notif['recipient_id'] != session_record['sso_id']:
            return jsonify({"error": "You can only delete your own notifications"}), 403
        
        notif_service.delete_notification(notification_id)
        logger.info(f" Notification {notification_id} deleted")
        return jsonify({"success": True, "message": "Notification deleted"}), 200
    except Exception as e:
        logger.error(f" Error: {str(e)}")
        return jsonify({"error": str(e)}), 500