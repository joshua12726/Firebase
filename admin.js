// Admin Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in as admin
    if (isAdminLoggedIn()) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    setupAdminLoginForm();
});

// Check if admin is already logged in
function isAdminLoggedIn() {
    const adminUser = localStorage.getItem('adminUser');
    return adminUser !== null;
}

// Setup admin login form
function setupAdminLoginForm() {
    const loginForm = document.getElementById('admin-login-form');
    const loginBtn = document.getElementById('admin-login-btn');
    const btnText = document.getElementById('btn-text');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAdminLogin();
        });
    }
}

// Handle admin login
function handleAdminLogin() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    const loginBtn = document.getElementById('admin-login-btn');
    const btnText = document.getElementById('btn-text');

    // Basic validation
    if (!username || !password) {
        showAdminMessage('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    btnText.innerHTML = '<span class="loading-spinner"></span>Logging in...';

    // Simulate admin authentication (in a real app, this would be server-side)
    setTimeout(() => {
        if (validateAdminCredentials(username, password)) {
            // Store admin session
            const adminUser = {
                username: username,
                loginTime: new Date().toISOString(),
                role: 'admin'
            };
            localStorage.setItem('adminUser', JSON.stringify(adminUser));

            showAdminMessage('Login successful! Redirecting...', 'success');

            // Redirect to admin dashboard
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            loginBtn.disabled = false;
            btnText.textContent = 'Login to Dashboard';
            showAdminMessage('Invalid admin credentials. Please try again.', 'error');
        }
    }, 1500); // Simulate network delay
}

// Validate admin credentials
function validateAdminCredentials(username, password) {
    // In a real application, this would be handled by a secure backend
    const validAdmins = [
        { username: 'admin', password: 'admin123' }
    ];

    return validAdmins.some(admin =>
        admin.username === username && admin.password === password
    );
}

// Show admin message
function showAdminMessage(message, type) {
    const messageDiv = document.getElementById('admin-message');
    if (messageDiv) {
        messageDiv.innerHTML = `<div class="admin-message ${type}">${message}</div>`;

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 3000);
        }
    }
}