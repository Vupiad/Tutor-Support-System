from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, make_response
from app.modules.auth.connectors import sso, role_map, datacore, session_store

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
    5. Create session in mock_sessions.json.
    6. Return session or JSON response based on Accept header.
    """
    
    # Support both form and JSON request bodies
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        selected_role = data.get('role')
    else:
        username = request.form.get('username')
        password = request.form.get('password')
        selected_role = request.form.get('role')

    # Validate inputs
    if not (username and password and selected_role):
        if request.is_json:
            return jsonify({'error': 'Missing username, password, or role'}), 400
        flash('Please provide username, password, and role', 'danger')
        return redirect(url_for('auth.login_get'))

    # Step 1: Authenticate with SSO
    sso_user = sso.authenticate(username, password)
    if not sso_user:
        if request.is_json:
            return jsonify({'error': 'Invalid credentials'}), 401
        flash('Invalid credentials', 'danger')
        return redirect(url_for('auth.login_get'))

    sso_id = sso_user.get('id')

    # Step 2: Get role from role map
    mapped_role = role_map.get_role(sso_id)
    if not mapped_role:
        if request.is_json:
            return jsonify({'error': 'User role not found in system'}), 403
        flash('User role not found in system', 'danger')
        return redirect(url_for('auth.login_get'))

    # Step 3: Verify selected role matches mapped role
    if selected_role != mapped_role:
        if request.is_json:
            return jsonify({'error': f'Selected role "{selected_role}" does not match user role "{mapped_role}"'}), 403
        flash(f'Selected role does not match your assigned role', 'danger')
        return redirect(url_for('auth.login_get'))

    # Step 4: Fetch user profile from Datacore
    profile = datacore.get_user_profile(sso_id)
    if not profile:
        if request.is_json:
            return jsonify({'error': 'User profile not found in datacore'}), 404
        flash('User profile not found', 'danger')
        return redirect(url_for('auth.login_get'))

    # Step 5: Create session
    session_id = session_store.create_session(
        sso_id=sso_id,
        username=username,
        role=mapped_role,
        email=sso_user.get('email'),
        display_name=profile.get('name')
    )

    # Update SSO last login
    sso.update_last_login(sso_id)

    # Prepare user info for response
    user_info = {
        'sso_id': sso_id,
        'username': username,
        'email': sso_user.get('email'),
        'display_name': profile.get('name'),
        'role': mapped_role,
        'session_id': session_id,
        'faculty': profile.get('faculty'),
        'department': profile.get('department'),
        'profile': profile  # Full profile data
    }

    # Step 6: Return response (set session_id as HttpOnly cookie)
    
    
    if request.is_json:
    # API response
        resp = make_response(jsonify({
            'success': True,
            'user': user_info,
            'session': {
                'type': 'cookie_managed'
            }
        }), 200)
    else:
    # Form response → redirect sau login
        if mapped_role == "tutor":
            resp = make_response(redirect("/tutor"))
        else:
            resp = make_response(redirect("/student"))

    
    # Set session_id as HttpOnly cookie (client cannot access via JS, sent with every request)
    resp.set_cookie(
        'session_id',
        session_id,
        httponly=True,
        secure=False,  # Set to True in production (HTTPS only)
        samesite='Lax',
        max_age=3600  # 1 hour
    )
    
    return resp


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout: invalidate session."""
    session_id = session.get('session_id')
    if session_id:
        session_store.invalidate_session(session_id)
    
    session.clear()
    
    if request.is_json:
        return jsonify({'success': True, 'message': 'Logged out'}), 200
    
    flash('Logged out', 'info')
    return redirect(url_for('auth.login_get'))


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Get current user info from session_id cookie.
    Protected endpoint: requires valid session_id cookie.
    """
    session_id = request.cookies.get('session_id')
    if not session_id:
        return jsonify({'error': 'Not authenticated - missing session_id cookie'}), 401
    
    session_record = session_store.get_session(session_id)
    if not session_record:
        return jsonify({'error': 'Invalid or expired session'}), 401
    
    # Return user info from session record
    user_info = {
        'sso_id': session_record.get('sso_id'),
        'username': session_record.get('username'),
        'email': session_record.get('email'),
        'display_name': session_record.get('display_name'),
        'role': session_record.get('role')
    }
    
    return jsonify(user_info), 200


def require_session(f):
    """Decorator to protect routes that require a valid session_id cookie."""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_id = request.cookies.get('session_id')
        if not session_id:
            if request.is_json:
                return jsonify({'error': 'Not authenticated - missing session_id cookie'}), 401
            return redirect(url_for('auth.login_get'))
        
        session_record = session_store.get_session(session_id)
        if not session_record:
            if request.is_json:
                return jsonify({'error': 'Invalid or expired session'}), 401
            flash('Session expired', 'warning')
            return redirect(url_for('auth.login_get'))
        
        # Make session info available to the route handler
        request.user = session_record
        return f(*args, **kwargs)
    
    return decorated_function