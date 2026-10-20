document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const overlayContainer = document.querySelector('.overlay-container');

    // 1. Dynamically create the overlay content
    if (overlayContainer) {
        overlayContainer.innerHTML = `
            <div class="overlay">
                <div class="overlay-panel overlay-left">
                    <h1>Welcome Back!</h1>
                    <p>Already have an account? Sign in with your username or email</p>
                    <button class="ghost" id="signIn">Sign In</button>
                </div>
                <div class="overlay-panel overlay-right">
                    <h1>Hello, Friend!</h1>
                    <p>Enter your details and start your journey with BBQ Bites</p>
                    <button class="ghost" id="signUp">Sign Up</button>
                </div>
            </div>
        `;
    }

    // 2. Wire up panel switching buttons
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');

    if (signUpButton && signInButton && container) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("right-panel-active");
            clearAlerts();
        });

        signInButton.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
            clearAlerts();
        });
    }

    // Helper to clear alerts
    const clearAlerts = () => {
        const errorBanner = document.getElementById('login-error-banner');
        const successBanner = document.getElementById('login-success-banner');
        const signupAlert = document.getElementById('signup-alert');
        if (errorBanner) errorBanner.style.display = 'none';
        if (successBanner) successBanner.style.display = 'none';
        if (signupAlert) signupAlert.style.display = 'none';
    };

    // 3. Handle Sign In Submission
    const signInForm = document.getElementById('sign-in-form');
    const errorBanner = document.getElementById('login-error-banner');
    const errorText = document.getElementById('login-error-text');
    const successBanner = document.getElementById('login-success-banner');
    const successText = document.getElementById('login-success-text');
    const signinSpinner = document.getElementById('signin-spinner');
    const signinSubmitBtn = document.getElementById('signin-submit-btn');

    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('signin-username');
            const passwordInput = document.getElementById('signin-password');
            const usernameVal = usernameInput ? usernameInput.value.trim() : '';
            const passwordVal = passwordInput ? passwordInput.value : '';

            clearAlerts();
            if (signinSpinner) signinSpinner.style.display = 'inline-block';
            if (signinSubmitBtn) signinSubmitBtn.disabled = true;

            try {
                // First: attempt server-side admin login
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: usernameVal,
                        password: passwordVal
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Admin login successful!
                    if (successText) successText.textContent = 'Login successful! Redirecting to Admin Dashboard...';
                    if (successBanner) successBanner.style.display = 'flex';

                    setTimeout(() => {
                        window.location.href = data.redirect || '/admin/admin.html';
                    }, 600);
                    return;
                }

                // Second: check if it's a registered customer account
                const localUsers = JSON.parse(localStorage.getItem('bbq_users') || '[]');
                const foundUser = localUsers.find(u => 
                    (u.email.toLowerCase() === usernameVal.toLowerCase() || u.name.toLowerCase() === usernameVal.toLowerCase()) 
                    && u.password === passwordVal
                );

                if (foundUser) {
                    localStorage.setItem('bbq_current_user', JSON.stringify({ name: foundUser.name, email: foundUser.email }));
                    if (successText) successText.textContent = `Welcome back, ${foundUser.name}! Redirecting...`;
                    if (successBanner) successBanner.style.display = 'flex';

                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 700);
                    return;
                }

                // If both fail, display error
                throw new Error(data.error || 'Invalid username or password.');

            } catch (err) {
                console.error('Sign-in error:', err);
                if (errorText) errorText.textContent = err.message || 'Login failed. Please verify your credentials.';
                if (errorBanner) errorBanner.style.display = 'flex';
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } finally {
                if (signinSpinner) signinSpinner.style.display = 'none';
                if (signinSubmitBtn) signinSubmitBtn.disabled = false;
            }
        });
    }

    // 4. Handle Sign Up Submission
    const signUpForm = document.getElementById('sign-up-form');
    const signupAlert = document.getElementById('signup-alert');

    if (signUpForm) {
        signUpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('signup-name');
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            clearAlerts();

            const localUsers = JSON.parse(localStorage.getItem('bbq_users') || '[]');
            if (localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                if (signupAlert) {
                    signupAlert.textContent = 'An account with this email already exists. Please Sign In.';
                    signupAlert.className = 'login-alert error';
                    signupAlert.style.display = 'flex';
                }
                return;
            }

            localUsers.push({ name, email, password });
            localStorage.setItem('bbq_users', JSON.stringify(localUsers));
            localStorage.setItem('bbq_current_user', JSON.stringify({ name, email }));

            if (signupAlert) {
                signupAlert.textContent = 'Account created successfully! Redirecting...';
                signupAlert.className = 'login-alert success';
                signupAlert.style.display = 'flex';
            }

            setTimeout(() => {
                window.location.href = '../index.html';
            }, 800);
        });
    }

    // 5. Forgot Password Handler
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('To sign in as Admin, use your admin username (admin) and password.\nFor customer account recovery, please contact contact@bbqbites.com.');
        });
    }
});