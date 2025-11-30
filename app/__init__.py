from flask import Flask, render_template
from .Config import Config
from .extensions import db, ma


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

     # ----------------------------
    # Session / cookie configuration
    # ----------------------------
    # Secret key required for Flask sessions
    app.secret_key = app.config.get("SECRET_KEY", "dev-secret-key-please-change")

    # Cookie settings
    app.config['SESSION_COOKIE_NAME'] = 'session_id'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = False   # True nếu chạy HTTPS
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Nếu Safari vẫn chặn → đổi thành 'None'

    # 1. Initialize Extensions
    db.init_app(app)
    ma.init_app(app)

    # 2. Register Blueprints
    from app.modules.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    from app.modules.schedule.scheduleRoutes import schedule_bp
    app.register_blueprint(schedule_bp, url_prefix='/schedule')

    from app.modules.notification.routes import notification_bp
    app.register_blueprint(notification_bp, url_prefix='/notification')

    from app.modules.tutor.routes import tutor_bp
    app.register_blueprint(tutor_bp)

    from app.modules.student.routes import student_bp
    app.register_blueprint(student_bp)

    @app.route("/tutor")
    def tutor_dashboard_page():
        return render_template("tutor_dashboard.html")

    return app
