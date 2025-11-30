# TutorSupport System

A comprehensive tutor-student matching and session management platform built with Flask, designed for HCMUT (Ho Chi Minh University of Technology).

## 📋 Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Mock Files](#database-mock-files)
- [Development Guide](#development-guide)

## ✨ Features

### 1. **User & Authentication Module**
- Multi-role authentication (Student, Tutor)
- Integration with HCMUT_SSO (mock system for development)
- Session management with HttpOnly cookies
- User profile management via HCMUT_DATACORE mock

### 2. **Session Management Module**
- Tutor discovery and search
- Session booking and scheduling
- Tutor acceptance/rejection workflow
- Session status tracking (requested, accepted, scheduled, completed, cancelled)

### 3. **Notification Module**
- In-app notifications
- Email notification delivery (future)
- Push notifications (future)
- Announcement broadcasting

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Flask Web Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  Auth Module     │  │  Session Module  │  │ Notif Mod  │ │
│  │                  │  │                  │  │            │ │
│  │ • Login/Logout   │  │ • Find Tutors    │  │ • Create   │ │
│  │ • Profile        │  │ • Book Session   │  │ • View     │ │
│  │ • Role Check     │  │ • Accept/Reject  │  │ • Deliver  │ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    Mock Data Layer (JSON)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  mock_sso.json   │  │ mock_datacore    │  │ mock_role_ │ │
│  │                  │  │ .json            │  │ map.json   │ │
│  │ • Credentials    │  │ • User profiles  │  │ • ID roles │ │
│  │ • User IDs       │  │ • Faculty/Dept   │  │ • Role map │ │
│  │ • Login tracking │  │ • Courses        │  │            │ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
TutorSupportSystem/
│
├── app/                              # Main Flask application
│   ├── static/                       # Static assets (CSS, JS, images)
│   │   ├── css/
│   │   │   └── style.css            # Main stylesheet
│   │   └── js/
│   │       └── auth.js              # Auth interactions
│   │
│   ├── templates/                    # HTML templates
│   │   ├── base.html                # Base layout (extends)
│   │   ├── auth_login.html          # Login page
│   │   └── login_success.html       # Success page
│   │
│   ├── modules/                      # Feature modules
│   │   ├── auth/                    # Authentication
│   │   │   ├── routes.py            # Login/logout endpoints
│   │   │   ├── connectors.py        # SSO, datacore, session stores
│   │   │   └── __init__.py
│   │   ├── session/                 # Session management (future)
│   │   └── notification/            # Notifications (future)
│   │
│   ├── __init__.py                  # Flask app factory
│   ├── Config.py                    # Configuration
│   └── extensions.py                # Flask extensions (db, etc)
│
├── database/                         # Mock data files
│   ├── mock_sso.json               # SSO credentials & user IDs
│   ├── mock_role_map.json          # ID to role mapping
│   ├── mock_datacore.json          # User profiles
│   ├── mock_sessions.json          # Active sessions
│   └── mock_db.json                # Legacy (deprecated)
│
├── run.py                           # Entry point
├── requirements.txt                 # Python dependencies
│
├── README.md                        # This file
├── STATIC_FILES_GUIDE.md           # Guide for CSS/JS usage
│
└── .git/                            # Git repository
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Flask 2.0+
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TutorSupportSystem
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   ```

3. **Activate virtual environment**
   
   **Windows (PowerShell):**
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
   
   **Linux/Mac:**
   ```bash
   source .venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application**
   ```bash
   python run.py
   ```

6. **Open in browser**
   ```
   http://127.0.0.1:5000/api/v1/auth/login
   ```

### Demo Credentials

**Student Account:**
- Username: `student1`
- Password: `studentpass`
- Role: Student

**Tutor Account:**
- Username: `tutor1`
- Password: `tutorpass`
- Role: Tutor

## 📡 API Documentation

### Authentication Endpoints

#### 1. **Login (Form-based)**
```
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=student1&password=studentpass&role=student
```

**Response (200 OK):**
```html
<!-- Renders login_success.html with user info -->
```

**Cookie Set:**
```
Set-Cookie: session_id=<uuid>; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
```

---

#### 2. **Login (JSON API)**
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "tutor1",
  "password": "tutorpass",
  "role": "tutor"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "sso_id": "LECTURER_001",
    "username": "tutor1",
    "email": "tutor1@hcmut.edu.vn",
    "display_name": "Phạm Thị Tú",
    "role": "tutor",
    "faculty": "Computer Science",
    "department": "Software Engineering",
    "profile": { /* Full profile data */ }
  },
  "session": {
    "type": "cookie_managed"
  }
}
```

**Cookie Set:**
```
Set-Cookie: session_id=<uuid>; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
```

---

#### 3. **Get Current User**
```
GET /api/v1/auth/me
Cookie: session_id=<uuid>
```

**Response (200 OK):**
```json
{
  "sso_id": "SE2025001",
  "username": "student1",
  "email": "student1@hcmut.edu.vn",
  "display_name": "Nguyễn Văn An",
  "role": "student"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Not authenticated - missing session_id cookie"
}
```

---

#### 4. **Logout**
```
POST /api/v1/auth/logout
Cookie: session_id=<uuid>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out"
}
```

---

## 🗄️ Database Mock Files

### mock_sso.json
Simulates HCMUT_SSO system. Stores user credentials and returns user IDs.

```json
{
  "users": [
    {
      "id": "SE2025001",
      "username": "student1",
      "password": "studentpass",
      "email": "student1@hcmut.edu.vn"
    },
    {
      "id": "LECTURER_001",
      "username": "tutor1",
      "password": "tutorpass",
      "email": "tutor1@hcmut.edu.vn"
    }
  ]
}
```

### mock_role_map.json
Maps SSO IDs to roles (student, tutor, admin, etc.).

```json
{
  "mappings": [
    {
      "sso_id": "SE2025001",
      "role": "student"
    },
    {
      "sso_id": "LECTURER_001",
      "role": "tutor"
    }
  ]
}
```

### mock_datacore.json
Simulates HCMUT_DATACORE. Stores detailed user profiles.

```json
{
  "users": [
    {
      "id": "SE2025001",
      "name": "Nguyễn Văn An",
      "faculty": "Computer Science",
      "department": "Software Engineering",
      "student_id": "SE2025001",
      "courses": ["CSC101", "CSC102"]
    },
    {
      "id": "LECTURER_001",
      "name": "Phạm Thị Tú",
      "faculty": "Computer Science",
      "lecturer_id": "LECTURER_001",
      "subjects": ["CSC101", "CSC102"],
      "bio": "Experienced software engineer",
      "rating": 4.8
    }
  ]
}
```

### mock_sessions.json
Stores active server-side sessions (auto-managed).

```json
{
  "sessions": [
    {
      "session_id": "uuid-1234",
      "sso_id": "SE2025001",
      "username": "student1",
      "role": "student",
      "email": "student1@hcmut.edu.vn",
      "created_at": "2025-11-27T10:00:00Z"
    }
  ]
}
```

## 🎨 Frontend & Styling

### CSS Structure

The project uses a **mobile-first responsive design** with a modern gradient UI.

**Main stylesheet:** `app/static/css/style.css`
- Global styles (typography, layout)
- Form elements and buttons
- Cards and containers
- Alerts and messages
- Responsive breakpoints (600px+)

**Included in templates via:**
```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
```

### JavaScript Features

**Auth interactions:** `app/static/js/auth.js`
- Form validation
- Role selection indicator
- Password visibility toggle
- Logout confirmation

**Included in templates via:**
```html
<script src="{{ url_for('static', filename='js/auth.js') }}"></script>
```

For detailed information on adding CSS/JS, see [STATIC_FILES_GUIDE.md](./STATIC_FILES_GUIDE.md).

## 🔐 Authentication Flow

```
User Input
    ↓
Login Form / API Request
    ↓
Validate Username & Password (mock_sso.json)
    ↓
Fetch SSO ID
    ↓
Check Role (mock_role_map.json)
    ↓
Verify Selected Role Matches
    ↓
Fetch Profile (mock_datacore.json)
    ↓
Create Session (mock_sessions.json)
    ↓
Set session_id Cookie (HttpOnly)
    ↓
Return User Info + Redirect/JSON
```

## 🔄 Session Management

- **Session Storage:** JSON file (`mock_sessions.json`)
- **Session ID Format:** UUID v4
- **Transport:** HttpOnly cookie (secure from XSS)
- **TTL:** 3600 seconds (1 hour)
- **Validation:** Required for protected endpoints (/me, future endpoints)

## 📝 Adding Images to README

### Markdown Syntax

**Inline image:**
```markdown
![Alt text](path/to/image.png)
```

**Image with link:**
```markdown
[![Alt text](path/to/image.png)](https://example.com)
```

**Relative paths (recommended):**
```markdown
![Login screenshot](./docs/images/login.png)
```

**Example in this README:**
```markdown
![TutorSupport Login](./docs/screenshots/login.png)
```

### Image Directory Structure

Create an `docs/` folder for documentation assets:

```
TutorSupportSystem/
├── README.md
├── STATIC_FILES_GUIDE.md
├── docs/
│   ├── images/
│   │   ├── logo.png
│   │   └── architecture.png
│   └── screenshots/
│       ├── login.png
│       └── dashboard.png
└── ...
```

### Supported Image Formats
- PNG (.png)
- JPG/JPEG (.jpg, .jpeg)
- GIF (.gif)
- SVG (.svg)
- WebP (.webp)

## �️ Login page image & customization

If you want the login page to display the HCMUT building image (right column):

- Place the image file in the static images folder:

```
app/static/images/hcmut_building.png
```

- The template `app/templates/auth_login.html` references this file using:

```html
<img src="{{ url_for('static', filename='images/hcmut_building.png') }}" alt="HCMUT Building">
```

- Recommended image formats: PNG or JPG, with an aspect ratio close to portrait (e.g. 3:4). A 1200×1600 (or scaled equivalent) image will look sharp; the CSS will crop to fit.

- To change the filename, update the `src` in `auth_login.html` to the new filename.

- Quick CSS tweaks (in `app/static/css/style.css`):
  - `.login-container { max-width: 950px; max-height: 550px; }` — controls overall card size.
  - `.login-form { max-width: 380px; }` — controls form width.
  - `.login-image-section { display: none; }` inside the `@media (max-width: 600px)` block hides the image on small screens.

This README section documents the default place and name we use for the building photo used on the login page.

## �🛠️ Development Guide

### Adding a New Module

1. Create module directory: `app/modules/your_module/`
2. Add files:
   ```
   app/modules/your_module/
   ├── __init__.py
   ├── models.py      # Data structures
   ├── services.py    # Business logic
   └── routes.py      # API endpoints
   ```
3. Register in `app/__init__.py`:
   ```python
   from app.modules.your_module.routes import your_bp
   app.register_blueprint(your_bp, url_prefix='/api/v1/your-module')
   ```

### Adding a New Template

1. Create HTML file in `app/templates/`
2. Extend base template:
   ```html
   {% extends "base.html" %}
   {% block title %}Page Title{% endblock %}
   {% block content %}
     <!-- Content here -->
   {% endblock %}
   ```
3. Link CSS/JS if needed:
   ```html
   {% block extra_css %}
     <link rel="stylesheet" href="{{ url_for('static', filename='css/page.css') }}">
   {% endblock %}
   ```

### Environment Configuration

Create a `.env` file (not tracked in git):
```
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
```

Load in `Config.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEBUG = os.getenv('FLASK_DEBUG', True)
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
```

## 🧪 Testing

Run tests (setup in future):
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app
```

## 📚 Documentation

- [Static Files & CSS/JS Guide](./STATIC_FILES_GUIDE.md) — How to structure and link CSS/JS in templates
- [System Design](./DESIGN.md) — Complete architecture and data model (future)
- [API Contracts](./API_CONTRACTS.md) — Detailed endpoint specifications (future)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## 📄 License

This project is part of HCMUT Software Engineering course.

## 👥 Team

- Project: TutorSupport System
- Course: HCMUT Software Engineering (HK251)
- Date: November 2025

## 📞 Support

For questions or issues:
1. Check the [documentation](./STATIC_FILES_GUIDE.md)
2. Review the [API documentation](#api-documentation)
3. Check mock data files in `database/`

---

**Last Updated:** November 30, 2025

