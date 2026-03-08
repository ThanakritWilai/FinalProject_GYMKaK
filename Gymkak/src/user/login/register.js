// Two-Step Registration Functionality
const API_URL = 'http://localhost:5000/api/auth';

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step1Indicator = document.getElementById('step1Indicator');
    const step2Indicator = document.getElementById('step2Indicator');
    const progressFill = document.getElementById('progressFill');
    const registerFormStep1 = document.getElementById('registerFormStep1');
    const registerFormStep2 = document.getElementById('registerFormStep2');
    const backToStep1 = document.getElementById('backToStep1');
    const delayLinks = document.querySelectorAll('.delay-link');
    
    // Form data storage
    let registrationData = {};
    
    // Step 1 form submission
    registerFormStep1.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!validateStep1(username, password, confirmPassword)) {
            return;
        }
        
        // Store step 1 data
        registrationData.username = username;
        registrationData.password = password;
        
        // Move to step 2
        goToStep2();
    });
    
    // Step 2 form submission
    registerFormStep2.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        
        // Validation
        if (!validateStep2(name)) {
            return;
        }
        
        // Store step 2 data
        registrationData.name = name;
        
        // Complete registration
        completeRegistration();
    });
    
    // Back to step 1
    backToStep1.addEventListener('click', function() {
        goToStep1();
    });

    delayLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = link.getAttribute('href');
            setTimeout(() => {
                window.location.href = target;
            }, 300);
        });
    });
    
    // Validation functions
    function validateStep1(username, password, confirmPassword) {
        clearValidationMessages();
        let isValid = true;
        
        // Username validation
        if (!username) {
            showValidationMessage('usernameValidation', 'กรุณากรอกชื่อผู้ใช้', 'error');
            isValid = false;
        } else if (username.length < 3) {
            showValidationMessage('usernameValidation', 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร', 'error');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showValidationMessage('usernameValidation', 'ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _', 'error');
            isValid = false;
        }
        
        // Password validation
        if (!password) {
            showValidationMessage('passwordValidation', 'กรุณากรอกรหัสผ่าน', 'error');
            isValid = false;
        } else if (password.length < 6) {
            showValidationMessage('passwordValidation', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
            isValid = false;
        }
        
        // Confirm password validation
        if (password !== confirmPassword) {
            showValidationMessage('passwordValidation', 'รหัสผ่านไม่ตรงกัน', 'error');
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateStep2(name) {
        clearValidationMessages();
        let isValid = true;
        
        // Name validation
        if (!name) {
            showValidationMessage('nameValidation', 'กรุณากรอกชื่อ-นามสกุล', 'error');
            isValid = false;
        } else if (name.length < 2) {
            showValidationMessage('nameValidation', 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร', 'error');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Helper functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showValidationMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `validation-message ${type}`;
    }
    
    function clearValidationMessages() {
        const messages = document.querySelectorAll('.validation-message');
        messages.forEach(msg => {
            msg.textContent = '';
            msg.className = 'validation-message';
        });
    }
    
    // Step navigation functions
    function goToStep2() {
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        
        step1Indicator.classList.remove('active');
        step1Indicator.classList.add('completed');
        step2Indicator.classList.add('active');
        
        progressFill.style.width = '100%';
        
        // Focus on name input
        document.getElementById('name').focus();
    }
    
    function goToStep1() {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        
        step2Indicator.classList.remove('active');
        step1Indicator.classList.remove('completed');
        step1Indicator.classList.add('active');
        
        progressFill.style.width = '0%';
        
        clearValidationMessages();
    }
    
    // Complete registration
    async function completeRegistration() {
        const completeBtn = document.querySelector('.complete-btn');
        completeBtn.textContent = 'Creating Account...';
        completeBtn.classList.add('loading');
        completeBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: registrationData.username,
                    password: registrationData.password,
                    name: registrationData.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'การสมัครสมาชิกไม่สำเร็จ');
            }

            showMessage('สร้างบัญชีสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...', 'success');

            // Redirect to login after registration
            setTimeout(() => {
                window.location.href = '/Gymkak/src/user/login/login.html';
            }, 1500);

        } catch (error) {
            completeBtn.textContent = 'สร้างบัญชี';
            completeBtn.classList.remove('loading');
            completeBtn.disabled = false;
            showMessage(error.message, 'error');
        }
    }
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        
        // Remove all strength classes
        strengthFill.classList.remove('weak', 'medium', 'strong');
        
        if (password.length === 0) {
            strengthFill.style.width = '0%';
            strengthText.textContent = 'Password strength';
            return;
        }
        
        switch (strength.level) {
            case 'weak':
                strengthFill.classList.add('weak');
                strengthText.textContent = 'Weak password';
                break;
            case 'medium':
                strengthFill.classList.add('medium');
                strengthText.textContent = 'Medium password';
                break;
            case 'strong':
                strengthFill.classList.add('strong');
                strengthText.textContent = 'Strong password';
                break;
        }
    });
    
    function checkPasswordStrength(password) {
        let score = 0;
        let level = 'weak';
        
        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // Character type checks
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        if (score <= 2) level = 'weak';
        else if (score <= 4) level = 'medium';
        else level = 'strong';
        
        return { score, level };
    }
    
    // Show message function
    function showMessage(message, type) {
        // Remove any existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#000000' : '#dc2626'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
});
