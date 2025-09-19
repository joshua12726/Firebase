// Authentication state
let currentUser = null;

// DOM Elements
const signinForm = document.getElementById('signin-form');
const registerForm = document.getElementById('register-form');
const signinFormElement = document.getElementById('signin-form-element');
const registerFormElement = document.getElementById('register-form-element');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be initialized
    setTimeout(() => {
        initializeLogin();
        setupEventListeners();
        setupPasswordStrength();
        applyModeFromURL();

        // Forgot password setup
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', handleForgotPassword);
        }
    }, 1000);
});

// Initialize login
function initializeLogin() {
    // Check if Firebase Auth is available
    if (typeof window.firebaseAuth !== 'undefined') {
        // Listen for authentication state changes
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User is already signed in:', user.email);
                // Redirect to homepage if user is already logged in
                window.location.href = 'Homepage.html';
            }
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Sign in form submission
    signinFormElement.addEventListener('submit', handleSignIn);
    
    // Register form submission
    registerFormElement.addEventListener('submit', handleRegister);
    
    // Real-time validation
    setupRealTimeValidation();
}

// Handle sign in
async function handleSignIn(e) {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const submitBtn = document.getElementById('signin-btn');
    
    // Clear previous errors
    clearErrors('signin');
    
    // Validate inputs
    if (!validateSignInForm(email, password)) {
        return;
    }
    
    // Show loading state
    setLoadingState(submitBtn, true);
    
    try {
        // Check if Firebase Auth is available
        if (typeof window.firebaseAuth === 'undefined') {
            throw new Error('Firebase Authentication not initialized');
        }
        
        // Sign in with Firebase
        const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Persist user to localStorage for UI components across pages
        try {
            const storedUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User')
            };
            localStorage.setItem('firebaseUser', JSON.stringify(storedUser));
        } catch (e) {
            console.warn('Unable to persist firebaseUser:', e);
        }

        // Update Firestore last login if available
        if (typeof window.firebaseDB !== 'undefined') {
            try {
                await window.firebaseDB.collection('users').doc(user.uid).set({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (e) {
                console.warn('Failed to update lastLoginAt:', e);
            }
        }
        
        console.log('Sign in successful:', user.email);
        
        // Show success message
        showMessage('Sign in successful! Redirecting...', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'Homepage.html';
        }, 1500);
        
    } catch (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = 'An error occurred during sign in.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage = error.message || 'Sign in failed. Please try again.';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        setLoadingState(submitBtn, false);
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const firstname = document.getElementById('register-firstname').value;
    const lastname = document.getElementById('register-lastname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const agreeTerms = document.getElementById('agree-terms').checked;
    const submitBtn = document.getElementById('register-btn');
    
    // Clear previous errors
    clearErrors('register');
    
    // Validate inputs
    if (!validateRegisterForm(firstname, lastname, email, password, confirmPassword, agreeTerms)) {
        return;
    }
    
    // Show loading state
    setLoadingState(submitBtn, true);
    
    try {
        // Check if Firebase Auth is available
        if (typeof window.firebaseAuth === 'undefined') {
            throw new Error('Firebase Authentication not initialized');
        }
        
        // Create user with Firebase
        const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile with display name
        await user.updateProfile({
            displayName: `${firstname} ${lastname}`
        });
        
        // Save additional user data to Firestore
        if (typeof window.firebaseDB !== 'undefined') {
            await window.firebaseDB.collection('users').doc(user.uid).set({
                firstName: firstname,
                lastName: lastname,
                email: email,
                displayName: `${firstname} ${lastname}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // Persist user to localStorage for UI components across pages
        try {
            const storedUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || `${firstname} ${lastname}`.trim()
            };
            localStorage.setItem('firebaseUser', JSON.stringify(storedUser));
        } catch (e) {
            console.warn('Unable to persist firebaseUser:', e);
        }
        
        console.log('Registration successful:', user.email);
        
        // Show success message
        showMessage('Account created successfully! Welcome aboard!', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'Homepage.html';
        }, 1500);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        let errorMessage = 'An error occurred during registration.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please choose a stronger password.';
                break;
            default:
                errorMessage = error.message || 'Registration failed. Please try again.';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        setLoadingState(submitBtn, false);
    }
}

// Form validation functions
function validateSignInForm(email, password) {
    let isValid = true;
    
    if (!email || !isValidEmail(email)) {
        showFieldError('signin-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showFieldError('signin-password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

function validateRegisterForm(firstname, lastname, email, password, confirmPassword, agreeTerms) {
    let isValid = true;
    
    if (!firstname || firstname.length < 2) {
        showFieldError('register-firstname', 'First name must be at least 2 characters');
        isValid = false;
    }
    
    if (!lastname || lastname.length < 2) {
        showFieldError('register-lastname', 'Last name must be at least 2 characters');
        isValid = false;
    }
    
    if (!email || !isValidEmail(email)) {
        showFieldError('register-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showFieldError('register-password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showFieldError('register-confirm-password', 'Passwords do not match');
        isValid = false;
    }
    
    if (!agreeTerms) {
        showMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isStrongPassword(password) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return strongRegex.test(password) && password.length >= 8;
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + '-error');
    const fieldElement = document.getElementById(fieldId);
    const formGroup = fieldElement.closest('.form-group');
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    
    if (formGroup) {
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
    }
}

function clearFieldError(fieldId) {
    const errorElement = document.getElementById(fieldId + '-error');
    const fieldElement = document.getElementById(fieldId);
    const formGroup = fieldElement.closest('.form-group');
    
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    if (formGroup) {
        formGroup.classList.remove('error');
        if (fieldElement.value && fieldElement.checkValidity()) {
            formGroup.classList.add('success');
        }
    }
}

function clearErrors(formType) {
    const form = formType === 'signin' ? signinForm : registerForm;
    const errorElements = form.querySelectorAll('.form-error');
    const formGroups = form.querySelectorAll('.form-group');
    
    errorElements.forEach(error => error.textContent = '');
    formGroups.forEach(group => {
        group.classList.remove('error', 'success');
    });
    
    // Clear any existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
}

function setLoadingState(button, loading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        button.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        button.disabled = false;
    }
}

function showMessage(message, type) {
    const modal = document.getElementById('message-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalButtons = document.getElementById('modal-buttons');
    const modalBody = modal.querySelector('.modal-body');

    // Clear previous buttons
    modalButtons.innerHTML = '';

    // Set title and message
    modalTitle.textContent = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Warning';
    modalMessage.textContent = message;

    // Set body class for styling
    modalBody.className = 'modal-body ' + type + '-modal';

    // Show modal
    modal.style.display = 'flex';

    // Auto close after 5 seconds for success and error, not for warning
    if (type !== 'warning') {
        setTimeout(() => {
            closeModal();
        }, 5000);
    }
}

function closeModal() {
    const modal = document.getElementById('message-modal');
    modal.style.display = 'none';
    // Clear buttons
    document.getElementById('modal-buttons').innerHTML = '';
}

// Form switching functions
function switchToRegister() {
    signinForm.classList.add('form-slide-out');
    
    setTimeout(() => {
        signinForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerForm.classList.add('form-slide-in');
        clearErrors('signin');
    }, 300);
}

function switchToSignIn() {
    registerForm.classList.add('form-slide-out');
    
    setTimeout(() => {
        registerForm.style.display = 'none';
        signinForm.style.display = 'block';
        signinForm.classList.add('form-slide-in');
        clearErrors('register');
    }, 300);
}

// Password visibility toggle
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = field.nextElementSibling.querySelector('.eye-icon');
    
    if (field.type === 'password') {
        field.type = 'text';
        toggle.textContent = '🙈';
    } else {
        field.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Password strength indicator
function setupPasswordStrength() {
    const passwordField = document.getElementById('register-password');
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (passwordField && strengthBar && strengthText) {
        passwordField.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            
            strengthBar.style.width = strength.percentage + '%';
            strengthBar.style.backgroundColor = strength.color;
            strengthText.textContent = strength.text;
        });
    }
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 25;
    else feedback.push('8+ characters');
    
    if (/[a-z]/.test(password)) score += 25;
    else feedback.push('lowercase');
    
    if (/[A-Z]/.test(password)) score += 25;
    else feedback.push('uppercase');
    
    if (/\d/.test(password)) score += 25;
    else feedback.push('number');
    
    if (/[@$!%*?&]/.test(password)) score += 25;
    else feedback.push('special character');
    
    let strength = {
        percentage: Math.min(score, 100),
        color: '#ef4444',
        text: 'Weak'
    };
    
    if (score >= 75) {
        strength.color = '#10b981';
        strength.text = 'Strong';
    } else if (score >= 50) {
        strength.color = '#f59e0b';
        strength.text = 'Medium';
    } else if (score >= 25) {
        strength.color = '#f97316';
        strength.text = 'Fair';
    }
    
    if (feedback.length > 0 && password.length > 0) {
        strength.text += ` (needs: ${feedback.join(', ')})`;
    }
    
    return strength;
}

// Real-time validation
function setupRealTimeValidation() {
    // Email validation
    const emailFields = ['signin-email', 'register-email'];
    emailFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                if (this.value && !isValidEmail(this.value)) {
                    showFieldError(fieldId, 'Please enter a valid email address');
                } else if (this.value) {
                    clearFieldError(fieldId);
                }
            });
        }
    });
    
    // Password confirmation
    const confirmPasswordField = document.getElementById('register-confirm-password');
    const passwordField = document.getElementById('register-password');
    
    if (confirmPasswordField && passwordField) {
        confirmPasswordField.addEventListener('input', function() {
            if (this.value && this.value !== passwordField.value) {
                showFieldError('register-confirm-password', 'Passwords do not match');
            } else if (this.value) {
                clearFieldError('register-confirm-password');
            }
        });
    }
    
    // Name fields validation
    const nameFields = ['register-firstname', 'register-lastname'];
    nameFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                if (this.value && this.value.length < 2) {
                    showFieldError(fieldId, 'Must be at least 2 characters');
                } else if (this.value) {
                    clearFieldError(fieldId);
                }
            });
        }
    });
}

function applyModeFromURL() {
   try {
       const params = new URLSearchParams(window.location.search);
       const mode = params.get('mode');
       if (mode && mode.toLowerCase() === 'signup') {
           switchToRegister();
       }
   } catch (e) {
       console.warn('Unable to apply mode from URL:', e);
   }
}

// Make functions globally available
window.switchToRegister = switchToRegister;
window.switchToSignIn = switchToSignIn;
window.togglePassword = togglePassword;

// 👉 Forgot password handler
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;

    if (!email || !isValidEmail(email)) {
        showMessage('Please enter your registered email to reset your password.', 'error');
        return;
    }

    try {
        if (typeof window.firebaseAuth === 'undefined') {
            throw new Error('Firebase Authentication not initialized');
        }

        await window.firebaseAuth.sendPasswordResetEmail(email);
        showMessage('Password reset email sent! Please check your inbox.', 'success');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Unable to send reset email. Please try again.';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
        }
        showMessage(errorMessage, 'error');
    }
}
