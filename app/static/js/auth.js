/**
 * Auth UI Interactions
 * Handles form validation, role dropdown, and feedback animations
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth JS loaded');

  // Form validation
  const loginForm = document.querySelector('form');
  const usernameInput = document.querySelector('input[name="username"]');
  const passwordInput = document.querySelector('input[name="password"]');
  const roleSelect = document.querySelector('select[name="role"]');

  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      const username = usernameInput?.value;
      const password = passwordInput?.value;
      const role = roleSelect?.value;

      if (!username || !password || !role) {
        e.preventDefault();
        alert('Please fill in all fields');
        return false;
      }
    });
  }

  // Handle role dropdown change
  if (roleSelect) {
    roleSelect.addEventListener('change', function() {
      updateRoleIndicator(this.value);
    });
    // Initialize role indicator
    updateRoleIndicator(roleSelect.value);
  }

  // Auto-focus first input
  const firstInput = document.querySelector('input[type="text"], input[type="password"]');
  if (firstInput) {
    firstInput.focus();
  }
});

/**
 * Update role indicator when role is selected
 */
function updateRoleIndicator(role) {
  const indicator = document.getElementById('role-indicator');
  if (indicator) {
    indicator.textContent = role;
    indicator.className = 'role-badge role-' + role;
  }
  console.log('Role selected:', role);
}

/**
 * Show confirmation dialog before logging out
 */
function confirmLogout() {
  return confirm('Are you sure you want to log out?');
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy');
  });
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
