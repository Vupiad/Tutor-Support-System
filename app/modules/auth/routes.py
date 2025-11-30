# app/modules/auth/routes.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from app.modules.auth.connectors import sso, role_map, datacore  # your mock connectors

auth_bp = Blueprint('auth', __name__)

# ---------- GET login page (form) ----------
@auth_bp.route('/login', methods=['GET'])
def login_get():
    # render the HTML form page (for browser)
    return render_template('auth_login.html')


# ---------- POST login (form or JSON) ----------
@auth_bp.route('/login', methods=['POST'])
def login_post():
    """
    Unified login for form submission (HTML) and JSON API.
    Stores user info in Flask session (server-side or cookie-signed).
    """
    # Support both JSON and form requests
    if request.is_json or (request.content_type and 'application/json' in str(request.content_type)):
        data = request.get_json(silent=True) or {}
    else:
        data = request.form.to_dict()

    username = data.get('username')
    password = data.get('password')
    selected_role = data.get('role')

    if not (username and password and selected_role):
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'Missing username/password/role', 'data': None}), 400
        flash('Please provide username, password and role', 'danger')
        return redirect(url_for('auth.login_get'))

    # Step 1: authenticate SSO (mock)
    sso_user = sso.authenticate(username, password)
    if not sso_user:
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'Invalid credentials', 'data': None}), 401
        flash('Invalid credentials', 'danger')
        return redirect(url_for('auth.login_get'))

    sso_id = sso_user.get('id')

    # Step 2: role map
    mapped_role = role_map.get_role(sso_id)
    if not mapped_role:
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'User role not found', 'data': None}), 403
        flash('User role not found in system', 'danger')
        return redirect(url_for('auth.login_get'))

    # verify selected role matches mapped role
    if selected_role != mapped_role:
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'Selected role mismatch', 'data': None}), 403
        flash('Selected role does not match your assigned role', 'danger')
        return redirect(url_for('auth.login_get'))

    # Step 3: fetch full profile from datacore
    profile = datacore.get_user_profile(sso_id)
    if not profile:
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'Profile not found', 'data': None}), 404
        flash('User profile not found', 'danger')
        return redirect(url_for('auth.login_get'))

    # Step 4: set Flask session (Flask will sign session cookie)
    session.clear()
    session['user_id'] = sso_id
    session['username'] = username
    session['role'] = mapped_role
    session['email'] = sso_user.get('email')
    session['display_name'] = profile.get('name')

    # Mark session permanent (optional)
    # session.permanent = True

    # Update last login in mock SSO
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

    # Return response
    if request.is_json:
        return jsonify({'status': 'success', 'message': 'Logged in', 'data': user_info}), 200

    # If form login, redirect to dashboard page (browser)
    return redirect('/tutor')


# ---------- POST logout ----------
@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Clear Flask session and return JSON or redirect."""
    session.clear()
    if request.is_json:
        return jsonify({'status': 'success', 'message': 'Logged out', 'data': None}), 200
    # if form, redirect to login page
    return redirect(url_for('auth.login_get'))


# ---------- GET current user ----------
@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Return current user from Flask session.
    JSON format:
    { status: 'success'|'error', message: ..., data: {...} }
    """
    if 'user_id' not in session:
        return jsonify({'status': 'error', 'message': 'Not authenticated', 'data': None}), 401

    user_info = {
        'user_id': session.get('user_id'),
        'username': session.get('username'),
        'email': session.get('email'),
        'display_name': session.get('display_name'),
        'role': session.get('role')
    }

    return jsonify({'status': 'success', 'message': 'User info retrieved', 'data': user_info}), 200


# ---------- Decorators ----------
def auth_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'status': 'error', 'message': 'Not authenticated', 'data': None}), 401
            return redirect(url_for('auth.login_get'))
        return f(*args, **kwargs)
    return decorated


def role_required(required_role):
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Not authenticated', 'data': None}), 401
                return redirect(url_for('auth.login_get'))
            if session.get('role') != required_role:
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Forbidden', 'data': None}), 403
                return "Forbidden", 403
            return f(*args, **kwargs)
        return decorated
    return decorator
