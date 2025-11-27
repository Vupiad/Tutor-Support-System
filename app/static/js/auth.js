/**
 * Auth UI Interactions
 * Handles form validation, role switching, and feedback animations
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth JS loaded');

  // Form validation
  const loginForm = document.querySelector('form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      const username = document.querySelector('input[name="username"]')?.value;
      const password = document.querySelector('input[name="password"]')?.value;
      const role = document.querySelector('input[name="role"]:checked')?.value;

      if (!username || !password || !role) {
        e.preventDefault();
        alert('Please fill in all fields');
        return false;
      }
    });
  }

  // Real-time role selection indicator
  const roleRadios = document.querySelectorAll('input[name="role"]');
  roleRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      updateRoleIndicator(this.value);
    });
  });

  // Auto-focus first input
  const firstInput = document.querySelector('input[type="text"], input[type="password"]');
  if (firstInput) {
    firstInput.focus();
  }
});

function updateRoleIndicator(role) {
  const indicator = document.getElementById('role-indicator');
  if (indicator) {
    indicator.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    indicator.className = 'role-badge role-' + role;
  }
}

// Logout confirmation
function confirmLogout() {
  return confirm('Are you sure you want to log out?');
}

// Copy to clipboard helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy');
  });
}

// Show/hide password toggle
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
