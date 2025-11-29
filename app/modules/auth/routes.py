from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, make_response
from app.modules.auth.connectors import sso, role_map, datacore

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET'])
def login_get():
    """Render a simple login page where user picks role (student/tutor) and provides credentials."""
    return render_template('auth_login.html')


@auth_bp.route('/login', methods=['POST'])
def login_post():
    """
    Unified login endpoint that supports both form-based and JSON requests.
    
    Flow:
    1. Authenticate with HCMUT_SSO (mock_sso.json) using username/password.
    2. Get SSO ID and check role in mock_role_map.json.
    3. Verify selected role matches mapped role.
    4. Fetch user profile from mock_datacore.json.
    5. Create session using Flask session.
    6. Return session or JSON response.
    """
    
    # Support both form and JSON request bodies
    data = None
    if request.is_json or request.content_type and 'application/json' in request.content_type:
        data = request.get_json(force=True, silent=True)
    elif request.form:
        data = request.form.to_dict()
    else:
        data = request.get_json(force=True, silent=True) or {}
    
    username = data.get('username')
    password = data.get('password')
    selected_role = data.get('role')

    # Validate inputs
    if not (username and password and selected_role):
        return jsonify({
            'status': 'error',
            'message': 'Missing username, password, or role',
            'data': None
        }), 400

    # Step 1: Authenticate with SSO
    sso_user = sso.authenticate(username, password)
    if not sso_user:
        return jsonify({
            'status': 'error',
            'message': 'Invalid credentials',
            'data': None
        }), 401

    sso_id = sso_user.get('id')

    # Step 2: Get role from role map
    mapped_role = role_map.get_role(sso_id)
    if not mapped_role:
        return jsonify({
            'status': 'error',
            'message': 'User role not found in system',
            'data': None
        }), 403

    # Step 3: Verify selected role matches mapped role
    if selected_role != mapped_role:
        return jsonify({
            'status': 'error',
            'message': f'Selected role "{selected_role}" does not match user role "{mapped_role}"',
            'data': None
        }), 403

    # Step 4: Fetch user profile from Datacore
    profile = datacore.get_user_profile(sso_id)
    if not profile:
        return jsonify({
            'status': 'error',
            'message': 'User profile not found in datacore',
            'data': None
        }), 404

    # Step 5: Store in Flask session (simpler, no need for session_manager)
    session['user_id'] = sso_id
    session['username'] = username
    session['role'] = mapped_role
    session['email'] = sso_user.get('email')
    session['display_name'] = profile.get('name')

    # Update SSO last login
    sso.update_last_login(sso_id)

    # Prepare user info for response
    user_info = {
        'user_id': sso_id,
        'username': username,
        'email': sso_user.get('email'),
        'display_name': profile.get('name'),
        'role': mapped_role,
        'faculty': profile.get('faculty'),
        'department': profile.get('department')
    }

    return jsonify({
        'status': 'success',
        'message': 'Login successful',
        'data': user_info
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout: invalidate session."""
    session.clear()
    return jsonify({
        'status': 'success',
        'message': 'Logged out',
        'data': None
    }), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Get current user info from Flask session.
    Protected endpoint: requires valid session.
    """
    if 'user_id' not in session:
        return jsonify({
            'status': 'error',
            'message': 'Not authenticated',
            'data': None
        }), 401

    user_info = {
        'user_id': session.get('user_id'),
        'username': session.get('username'),
        'email': session.get('email'),
        'display_name': session.get('display_name'),
        'role': session.get('role')
    }

    return jsonify({
        'status': 'success',
        'message': 'User info retrieved',
        'data': user_info
    }), 200


def auth_required(f):
    """Decorator to protect routes that require authentication."""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({
                'status': 'error',
                'message': 'Not authenticated',
                'data': None
            }), 401
        return f(*args, **kwargs)
    
    return decorated_function


def role_required(required_role):
    """Decorator to protect routes by role."""
    def decorator(f):
        from functools import wraps
        
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({
                    'status': 'error',
                    'message': 'Not authenticated',
                    'data': None
                }), 401
            
            user_role = session.get('role')
            if user_role != required_role:
                return jsonify({
                    'status': 'error',
                    'message': f'Forbidden: required role is {required_role}, but you have {user_role}',
                    'data': None
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator