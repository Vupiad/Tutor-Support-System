from flask import Flask
from .Config import Config
from .extensions import db, ma


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 1. Initialize Extensions
    db.init_app(app)  # Loads the JSON mock database
    ma.init_app(app)  # Initializes Marshmallow for serialization

    # 2. Register Blueprints (Modules)
    from app.modules.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    from app.modules.schedule.scheduleRoutes import schedule_bp
    app.register_blueprint(schedule_bp, url_prefix='/schedule')
    
    from app.modules.notification.routes import notification_bp
    app.register_blueprint(notification_bp, url_prefix='/notification')
    
    from app.modules.tutor.routes import tutor_bp
    app.register_blueprint(tutor_bp)
    
    from app.modules.student.routes import student_bp
    app.register_blueprint(student_bp)

    return app