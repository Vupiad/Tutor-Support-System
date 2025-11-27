# Flask Static Files & Templates Guide

## Directory Structure

Your Flask project should organize static assets and templates as follows:

```
app/
├── static/
│   ├── css/
│   │   ├── style.css          # Main stylesheet
│   │   ├── auth.css           # Auth-specific styles
│   │   └── dashboard.css      # Dashboard styles
│   ├── js/
│   │   ├── auth.js            # Auth interactions
│   │   ├── api-client.js      # API helper functions
│   │   └── utils.js           # Utility functions
│   └── images/
│       ├── logo.png
│       └── icons/
├── templates/
│   ├── base.html              # Base layout (all pages extend this)
│   ├── auth_login.html        # Login page
│   ├── login_success.html     # Success page
│   └── dashboard.html         # Dashboard
└── modules/
    ├── auth/
    │   └── routes.py
    └── ...
```

## How Flask Serves Static Files

Flask automatically serves files from the `app/static/` directory at `/static/` URL:

- `app/static/css/style.css` → accessible at `http://localhost:5000/static/css/style.css`
- `app/static/js/auth.js` → accessible at `http://localhost:5000/static/js/auth.js`

The `url_for('static', filename='path/to/file')` function generates these URLs automatically.

## Linking CSS in Templates

### Using url_for() (Recommended)

```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
```

Benefits:
- ✓ Automatic cache busting if enabled
- ✓ Works with CDN or S3 if configured
- ✓ Development and production compatible

### Direct Path (Simple)

```html
<link rel="stylesheet" href="/static/css/style.css">
```

## Linking JavaScript in Templates

### Before `</body>` (Recommended for performance)

```html
<script src="{{ url_for('static', filename='js/auth.js') }}"></script>
```

### In `<head>` (If needed immediately)

```html
<script src="{{ url_for('static', filename='js/auth.js') }}" defer></script>
```

Use `defer` attribute so scripts load in background without blocking DOM parsing.

## Template Inheritance (Base + Child Templates)

### Base Template (`app/templates/base.html`)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% block title %}TutorSupport{% endblock %}</title>
    
    <!-- Global CSS -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
    
    <!-- Per-page CSS (optional) -->
    {% block extra_css %}{% endblock %}
  </head>
  <body>
    <div class="container">
      {% block content %}{% endblock %}
    </div>

    <!-- Global JS -->
    <script src="{{ url_for('static', filename='js/auth.js') }}"></script>
    
    <!-- Per-page JS (optional) -->
    {% block extra_js %}{% endblock %}
  </body>
</html>
```

### Child Template (`app/templates/auth_login.html`)

```html
{% extends "base.html" %}

{% block title %}Login - TutorSupport{% endblock %}

{% block content %}
  <!-- Page-specific HTML here -->
{% endblock %}

{% block extra_css %}
  <link rel="stylesheet" href="{{ url_for('static', filename='css/auth.css') }}">
{% endblock %}

{% block extra_js %}
  <script src="{{ url_for('static', filename='js/form-validation.js') }}"></script>
{% endblock %}
```

## CSS Best Practices

### Organize by Section

```css
/* ===== Global Styles ===== */
* { ... }
body { ... }

/* ===== Layout ===== */
.container { ... }
.card { ... }

/* ===== Forms ===== */
input, select { ... }
button { ... }

/* ===== Components ===== */
.alert { ... }
.user-info { ... }

/* ===== Responsive ===== */
@media (max-width: 600px) { ... }
```

### Use CSS Variables for Theming

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #333;
  --bg-color: #f5f5f5;
}

button {
  background: var(--primary-color);
  color: white;
}
```

## JavaScript Best Practices

### Add Console Logging for Debugging

```javascript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded');
  
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(e) {
      console.log('Form submitted');
      // Handle submission
    });
  }
});
```

### Event Delegation for Dynamic Elements

```javascript
document.addEventListener('click', function(e) {
  if (e.target.matches('.delete-btn')) {
    console.log('Delete clicked:', e.target.dataset.id);
  }
});
```

### Async API Calls

```javascript
async function loginUser(username, password, role) {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
      window.location.href = '/dashboard';
    } else {
      console.error('Login failed:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Common Patterns

### Passing Data from Flask to JavaScript

In template:
```html
<script>
  const userData = {{ user_data | tojson }};
  console.log('User:', userData);
</script>
```

### Conditional CSS Classes

In template:
```html
<div class="card {% if user.role == 'tutor' %}card-tutor{% endif %}">
  ...
</div>
```

### CSRF Protection for Forms

```html
<form method="post">
  {{ csrf_token() }}  <!-- If using Flask-WTF -->
  <input type="text" name="username">
  <button type="submit">Submit</button>
</form>
```

## Debugging Tips

### Check Browser Console (F12)

- See JavaScript errors and logs
- Inspect network requests (Network tab)
- Debug styles (Inspector tab)

### Flask Debug Mode

In `app/Config.py`:
```python
class Config:
    DEBUG = True
    TESTING = False
```

This enables:
- Auto-reloading on file changes
- Interactive debugger on errors
- Detailed error pages

### Check Static File URLs

Verify files are being served correctly:
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check that CSS/JS files return HTTP 200

## Example Project Structure

Your current setup after these changes:

```
TutorSupportSystem/
├── app/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── auth.js
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth_login.html
│   │   └── login_success.html
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── routes.py
│   │   │   └── connectors.py
│   │   └── ...
│   ├── __init__.py
│   ├── Config.py
│   └── extensions.py
├── database/
│   ├── mock_sso.json
│   ├── mock_role_map.json
│   ├── mock_datacore.json
│   └── mock_sessions.json
├── run.py
└── requirements.txt
```

## Adding More CSS/JS Modules

When you need additional styling or functionality:

### 1. Create new CSS file

`app/static/css/dashboard.css`:
```css
/* Dashboard-specific styles */
.dashboard { ... }
.sidebar { ... }
```

### 2. Create new JS file

`app/static/js/dashboard.js`:
```javascript
// Dashboard interactivity
const dashboard = {
  init: function() { ... },
  handleClick: function() { ... }
};

dashboard.init();
```

### 3. Link in template

In `app/templates/dashboard.html`:
```html
{% extends "base.html" %}

{% block title %}Dashboard{% endblock %}

{% block extra_css %}
  <link rel="stylesheet" href="{{ url_for('static', filename='css/dashboard.css') }}">
{% endblock %}

{% block content %}
  <!-- Dashboard HTML -->
{% endblock %}

{% block extra_js %}
  <script src="{{ url_for('static', filename='js/dashboard.js') }}"></script>
{% endblock %}
```

## Next Steps

1. ✓ Created `app/static/css/style.css` — Main stylesheet with responsive design
2. ✓ Created `app/static/js/auth.js` — Auth page interactions
3. ✓ Created `app/templates/base.html` — Base layout template
4. ✓ Updated templates to use CSS/JS via `url_for()`

Now you can run the app and see the new styled login page!
