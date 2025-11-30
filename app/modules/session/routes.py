#something should be here
# routes.py — main Flask entrypoint

from flask import Flask, render_template
from flask_cors import CORS

# Nếu backend dùng session:
from flask import session

# Import các file backend khác (nếu có các route trong scheduleRoutes.py, connectors.py)
# Nếu chúng đăng ký blueprint thì import và register
try:
    from scheduleRoutes import schedule_bp
    HAS_SCHEDULE = True
except:
    HAS_SCHEDULE = False

try:
    from connectors import connectors_bp
    HAS_CONNECTORS = True
except:
    HAS_CONNECTORS = False

# Nếu file khác có chứa route (không dùng blueprint) thì import để load function vào app
try:
    import scheduleRoutes
except:
    pass

try:
    import connectors
except:
    pass

# ================================
# Khởi tạo Flask App
# ================================
app = Flask(__name__)
app.secret_key = "supersecretkey"   # cần cho session

# Cho phép browser gửi cookie & session
CORS(app, supports_credentials=True)

# ================================
# Đăng ký Blueprint (optional)
# ================================
if HAS_SCHEDULE:
    app.register_blueprint(schedule_bp)

if HAS_CONNECTORS:
    app.register_blueprint(connectors_bp)

# ================================
# ROUTE TRANG TUTOR DASHBOARD
# ================================
@app.route("/tutor")
@require_session 
def tutor_dashboard():
    return render_template("tutor_dashboard.html")   # file ở /templates/


# ================================
# ROUTE GỐC (HOME)
# ================================
@app.route("/")
def home():
    return "<h1>Server is running!</h1><p>Go to <a href='/tutor'>/tutor</a></p>"


# ================================
# CHẠY SERVER
# ================================
if __name__ == "__main__":
    app.run(debug=True)
