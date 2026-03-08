// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const DASHBOARD_REDIRECT_URL = 'http://127.0.0.1:5500/Gymkak/src/dashboard/dashboard.html';
const LOGIN_PAGE = '/Gymkak/src/user/login/login.html';

function setupLoginLogoutToggle() {
    const authLinks = document.querySelectorAll('a[href*="/user/login/login.html"]');
    if (!authLinks.length) {
        return;
    }

    const token = localStorage.getItem('gymkak_token') || localStorage.getItem('token');
    const isLoggedIn = !!token;

    authLinks.forEach(link => {
        const iconElement = link.querySelector('i');
        
        if (isLoggedIn) {
            // User is logged in - show Logout
            if (iconElement) {
                iconElement.className = 'ri-logout-box-line';
            }
            link.textContent = '';
            if (iconElement) {
                link.appendChild(iconElement);
            }
            link.appendChild(document.createTextNode(' Logout'));

            link.addEventListener('click', function (event) {
                event.preventDefault();
                clearAuthStorage();
                window.location.href = DASHBOARD_REDIRECT_URL;
            });
        } else {
            // User not logged in - show Login
            if (iconElement) {
                iconElement.className = 'ri-login-box-line';
            }
            link.textContent = '';
            if (iconElement) {
                link.appendChild(iconElement);
            }
            link.appendChild(document.createTextNode(' Login'));
            link.href = LOGIN_PAGE;
        }
    });
}

function clearAuthStorage() {
    localStorage.removeItem('gymkak_token');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('selectedPrice');
    localStorage.removeItem('membershipRenewMode');
    sessionStorage.removeItem('gymkak_user');
}

// Membership Registration System with JWT Authentication
class MembershipRegistration {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3; // Updated to 3 steps
        this.selectedPlan = null;
        this.selectedPrice = null;
        this.formData = {};
        this.token = null;
        this.userId = null;
        this.isRenewal = false;

        this.init();
    }

    init() {
        // Check authentication first
        this.checkAuthentication();
        this.detectRenewalMode();
        
        this.loadSelectedPlan();
        this.setupEventListeners();
        this.updateStepIndicator();
        this.showStep(this.currentStep);

        this.prefillUserInfo();

        if (this.isRenewal) {
            this.currentStep = 2;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
            this.showRenewalNotice();
        }

        // Auto-update sidebar if plan is already selected
        if (this.selectedPlan) {
            this.updateSidebar();
        }
    }

    detectRenewalMode() {
        const params = new URLSearchParams(window.location.search);
        const renewQuery = params.get('renew');
        const renewStorage = localStorage.getItem('membershipRenewMode');
        this.isRenewal = renewQuery === '1' || renewStorage === '1';
    }

    async prefillUserInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                return;
            }

            const payload = await response.json();
            const user = payload?.data?.user;
            if (!user) {
                return;
            }

            const fullName = (user.fullName || '').trim();
            const nameParts = fullName.split(/\s+/).filter(Boolean);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const firstNameInput = document.querySelector('input[name="first-name"]');
            const lastNameInput = document.querySelector('input[name="last-name"]');
            const emailInput = document.querySelector('input[name="email"]');
            const phoneInput = document.querySelector('input[name="phone"]');

            if (firstNameInput) firstNameInput.value = firstName;
            if (lastNameInput) lastNameInput.value = lastName;
            if (emailInput) emailInput.value = user.email || '';
            if (phoneInput) phoneInput.value = user.phone || '';
        } catch (error) {
            console.warn('Could not prefill profile fields:', error.message);
        }
    }

    showRenewalNotice() {
        const step2 = document.querySelector('#step-2');
        if (!step2) {
            return;
        }

        const existingNotice = document.querySelector('#renewal-notice');
        if (existingNotice) {
            existingNotice.remove();
        }

        const notice = document.createElement('div');
        notice.id = 'renewal-notice';
        notice.className = 'alert';
        notice.style.marginBottom = '14px';
        notice.style.background = 'rgba(16, 185, 129, 0.12)';
        notice.style.border = '1px solid rgba(16, 185, 129, 0.5)';
        notice.style.color = '#d1fae5';
        notice.textContent = 'โหมดต่ออายุ: ระบบจะต่อได้เฉพาะแพ็กเกจเดิมและราคาเดิมเท่านั้น';

        step2.insertBefore(notice, step2.firstChild);
    }

    /**
    /**
     * If not logged in, redirect to login page
     */
    checkAuthentication() {
        this.token = localStorage.getItem('gymkak_token') || localStorage.getItem('token');
        const userData = sessionStorage.getItem('gymkak_user');

        if (!this.token) {
            this.showError('You must be logged in to register a membership. Redirecting to login...');
            setTimeout(() => {
                window.location.href = '../../user/login/login.html';
            }, 2000);
            return false;
        }

        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.userId = user.id || user._id || null;
                console.log('✅ User authenticated:', this.userId);
            } catch (error) {
                console.warn('Could not parse session user data, continue with token only');
                this.userId = null;
            }
        }

        return true;
    }

    /**
     * Load selected plan from URL parameters or localStorage
     */
    loadSelectedPlan() {
        const planFromStorage = localStorage.getItem('selectedPlan');

        if (!planFromStorage) {
            this.selectedPlan = null;
            this.selectedPrice = '0';
            return;
        }

        try {
            // Parse the plan object from localStorage
            this.selectedPlan = JSON.parse(planFromStorage);
            this.selectedPrice = this.selectedPlan.price;
            console.log('📦 Loaded plan from localStorage:', this.selectedPlan);
        } catch (e) {
            const legacyPlan = this.getPlanObjectByName(planFromStorage);
            if (legacyPlan) {
                this.selectedPlan = legacyPlan;
                this.selectedPrice = legacyPlan.price;
                console.log('📦 Loaded legacy plan from localStorage:', this.selectedPlan);
            } else {
                console.error('Error parsing plan from localStorage:', e);
                this.selectedPlan = null;
                this.selectedPrice = '0';
            }
        }

        if (this.selectedPlan) {
            this.updatePlanSelection();
        }
    }

    /**
     * Update plan selection - removed since plan is pre-selected
     */
    updatePlanSelection() {
        // Plan is already selected from membership page
        // Just update sidebar
        this.updateSidebar();
    }

    updateSidebar() {
        if (!this.selectedPlan) return;

        // Handle plan as object (new format) or string (old format)
        const plan = typeof this.selectedPlan === 'object' ? this.selectedPlan : this.getPlanData(this.selectedPlan);

        // Update plan name
        const planNameElement = document.querySelector('#selected-plan-name');
        if (planNameElement) {
            planNameElement.textContent = plan.name || 'Unknown Plan';
        }

        // Update price
        const priceElement = document.querySelector('#selected-price');
        if (priceElement) {
            const price = typeof plan.price === 'number' ? plan.price : parseInt(plan.price) || 0;
            priceElement.textContent = price;
        }

        // Update period
        const periodElement = document.querySelector('#selected-period');
        if (periodElement) {
            periodElement.textContent = '/' + (plan.duration ? plan.duration.toLowerCase() : 'month');
            } else if (this.selectedPlan === 'monthly') {
                periodElement.textContent = '/month';
            } else if (this.selectedPlan === 'yearly') {
                periodElement.textContent = '/year';
        }

        // Update features
        const featuresElement = document.querySelector('#selected-features');
        if (featuresElement) {
            const features = plan.features || this.getPlanFeatures(this.selectedPlan);
            featuresElement.innerHTML = features.map(feature =>
                `<li><i class="ri-checkbox-circle-fill"></i> ${feature}</li>`
            ).join('');
        }
    }

    getPlanFeatures(planType) {
        const features = {
            'daily': [
                'Gym access',
                'Basic equipment'
            ],
            'monthly': [
                'Unlimited gym access',
                'All equipment',
                'Group classes',
                'Free parking'
            ],
            'yearly': [
                'Unlimited gym access',
                'All equipment & classes',
                'Personal training (2 sessions)',
                'Nutrition consultation',
                'Priority booking'
            ],
            'threeyears': [
                'All 1 Year benefits',
                'VIP member status',
                'Unlimited personal training',
                'Premium facilities access',
                'Guest passes (10/month)',
                'Wellness programs'
            ]
        };

        return features[planType] || features['monthly'];
    }

    setupEventListeners() {
        // Step navigation buttons
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });

        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });

        // Form validation on input
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
        });

        // Payment method selection
        document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.showPaymentDetails(e.target.value);
            });
        });

        // Final submission
        document.querySelector('.btn-submit')?.addEventListener('click', () => {
            this.submitRegistration();
        });
    }

    // Plan selection removed since it's handled on membership page
    // Just maintain the selected plan state

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.showStep(this.currentStep);
                this.updateStepIndicator();

                if (this.currentStep === this.totalSteps) {
                    this.updateSummary();
                }
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateStepIndicator();
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        const currentStepElement = document.querySelector(`#step-${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Update progress bar
        const progressPercentages = {
            1: 33,
            2: 66,
            3: 100
        };
        const progress = progressPercentages[stepNumber] || 0;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
    }

    updateStepIndicator() {
        // Update progress steps (top navigation)
        document.querySelectorAll('.progress-step').forEach((indicator, index) => {
            if (index + 1 <= this.currentStep) {
                indicator.classList.add('completed');
                indicator.classList.remove('active');
            } else {
                indicator.classList.remove('completed', 'active');
            }

            if (index + 1 === this.currentStep) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            }
        });

        // Update sidebar step indicator
        document.querySelectorAll('.step-indicator span').forEach((indicator, index) => {
            if (index + 1 <= this.currentStep) {
                indicator.classList.add('completed');
            } else {
                indicator.classList.remove('completed');
            }

            if (index + 1 === this.currentStep) {
                indicator.classList.add('current');
            } else {
                indicator.classList.remove('current');
            }
        });
    }

    validateCurrentStep() {
        const currentStepElement = document.querySelector(`#step-${this.currentStep}`);
        const requiredFields = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // No need to validate plan selection since it's pre-selected
        // Plan validation is handled on membership page

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove previous error styling
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            errorMessage = 'This field is required';
            isValid = false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(value.replace(/[^0-9]/g, ''))) {
                errorMessage = 'Please enter a valid 10-digit phone number';
                isValid = false;
            }
        }

        if (!isValid) {
            field.classList.add('error');
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    showError(message) {
        // Show error as modal popup with minimal, clean design
        const modal = document.getElementById('alertModal');
        const messageEl = document.getElementById('alertModalMessage');
        
        if (messageEl) {
            messageEl.innerHTML = message;
        }
        
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal, { 
                backdrop: 'static', 
                keyboard: false 
            });
            bootstrapModal.show();
        }
    }

    showPaymentDetails(paymentMethod) {
        // Hide all payment details
        document.querySelectorAll('.payment-details').forEach(detail => {
            detail.style.display = 'none';
        });

        // Show selected payment method details
        const selectedDetails = document.querySelector(`#${paymentMethod}-details`);
        if (selectedDetails) {
            selectedDetails.style.display = 'block';
        }
    }

    updateSummary() {
        if (!this.selectedPlan) return;

        const planData = typeof this.selectedPlan === 'object'
            ? this.selectedPlan
            : this.getPlanData(this.selectedPlan);

        const normalizedPrice = String(planData.price ?? '0').startsWith('$')
            ? String(planData.price)
            : `$${planData.price ?? '0'}`;

        // Update plan summary
        document.querySelector('#summary-plan').textContent = planData.name || 'N/A';
        document.querySelector('#summary-price').textContent = normalizedPrice;
        document.querySelector('#summary-duration').textContent = planData.duration || 'N/A';

        // Update personal info summary
        const firstName = document.querySelector('input[name="first-name"]').value;
        const lastName = document.querySelector('input[name="last-name"]').value;
        const email = document.querySelector('input[name="email"]').value;
        const phone = document.querySelector('input[name="phone"]').value;

        document.querySelector('#summary-name').textContent = `${firstName} ${lastName}`;
        document.querySelector('#summary-email').textContent = email;
        document.querySelector('#summary-phone').textContent = phone;

        // Update payment method summary
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        if (paymentMethod) {
            const paymentText = paymentMethod === 'credit-card' ? 'Credit/Debit Card' :
                paymentMethod === 'bank-transfer' ? 'Bank Transfer' : 'PayPal';
            document.querySelector('#summary-payment').textContent = paymentText;
        }
    }

    getPlanData(planType) {
        if (planType && typeof planType === 'object') {
            const plan = planType;
            const normalizedPrice = String(plan.price ?? '0').startsWith('$')
                ? String(plan.price)
                : `$${plan.price ?? '0'}`;

            return {
                name: plan.name || 'Monthly Plan',
                price: normalizedPrice,
                duration: plan.duration || '1 Month'
            };
        }

        const plans = {
            'daily': {
                name: 'Daily Plan',
                price: '$15',
                duration: '1 Day'
            },
            'Daily': {
                name: 'Daily',
                price: '$15',
                duration: '1 Day'
            },
            'monthly': {
                name: 'Monthly Plan',
                price: '$45',
                duration: '1 Month'
            },
            'Monthly': {
                name: 'Monthly',
                price: '$45',
                duration: '1 Month'
            },
            'yearly': {
                name: '1 Year Plan',
                price: '$399',
                duration: '1 Year'
            },
            '1 Year': {
                name: '1 Year',
                price: '$399',
                duration: '1 Year'
            },
            'threeyears': {
                name: '3 Years Plan',
                price: '$999',
                duration: '3 Years'
            },
            '3 Years': {
                name: '3 Years',
                price: '$999',
                duration: '3 Years'
            }
        };

        return plans[planType] || plans['monthly'];
    }

    getPlanObjectByName(planName) {
        const mapping = {
            'Daily': { name: 'Daily', price: 15, duration: '1 Day', features: ['Gym access', 'Basic equipment'] },
            'Monthly': { name: 'Monthly', price: 45, duration: '1 Month', features: ['Unlimited gym access', 'All equipment', 'Group classes', 'Free parking'] },
            '1 Year': { name: '1 Year', price: 399, duration: '1 Year', features: ['Unlimited gym access', 'All equipment & classes', 'Personal training (2 sessions)', 'Nutrition consultation', 'Priority booking'] },
            '3 Years': { name: '3 Years', price: 999, duration: '3 Years', features: ['All 1 Year benefits', 'VIP member status', 'Unlimited personal training', 'Premium facilities access', 'Guest passes (10/month)', 'Wellness programs'] }
        };

        return mapping[planName] || null;
    }

    normalizePlanName(rawPlanName) {
        const name = String(rawPlanName || '').trim();
        if (name === 'Daily' || name === 'Monthly' || name === '1 Year' || name === '3 Years') {
            return name;
        }

        const lower = name.toLowerCase();
        if (lower.includes('daily')) return 'Daily';
        if (lower.includes('monthly')) return 'Monthly';
        if (lower.includes('1 year') || lower.includes('yearly')) return '1 Year';
        if (lower.includes('3 year') || lower.includes('threeyears')) return '3 Years';
        return name;
    }

    submitRegistration() {
        if (!this.checkAuthentication()) {
            return;
        }

        if (this.validateCurrentStep()) {
            // Collect all form data
            this.collectFormData();

            // Show loading state
            const submitBtn = document.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            // Call API to process membership registration
            this.registerMembership();
        }
    }

    /**
     * Call Backend API to register membership
     */
    async registerMembership() {
        const submitBtn = document.querySelector('.btn-submit');
        const requestStartedAt = Date.now();

        try {
            const confirmButton = document.querySelector('.btn-confirm-membership');
            
            // Set button to processing state
            if (confirmButton) {
                confirmButton.disabled = true;
                confirmButton.innerHTML = '<i class="ri-loader-4-line"></i> กำลังประมวลผล...';
            }

            this.showLoadingPopup('Confirming your registration...');

            const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || '';
            const paymentMethodText = paymentMethod === 'credit-card' ? 'Credit Card' :
                                      paymentMethod === 'bank-transfer' ? 'Bank Transfer' : 'PayPal';

            // Extract plan name from selectedPlan (which is now an object)
            let planName = this.selectedPlan;
            if (typeof this.selectedPlan === 'object' && this.selectedPlan.name) {
                // Plan is already an object
                planName = this.selectedPlan.name;
                console.log('✅ Plan name extracted from object:', planName);
            } else if (typeof this.selectedPlan === 'string' && this.selectedPlan.startsWith('{')) {
                // Plan is a JSON string, need to parse
                try {
                    const planObj = JSON.parse(this.selectedPlan);
                    planName = planObj.name;
                    console.log('✅ Plan name extracted from JSON string:', planName);
                } catch (e) {
                    console.warn('Could not parse plan, using as-is:', this.selectedPlan);
                }
            }
            planName = this.normalizePlanName(planName);

            const requestBody = {
                plan: planName,
                firstName: this.formData.personalInfo.firstName,
                lastName: this.formData.personalInfo.lastName,
                phone: this.formData.personalInfo.phone,
                paymentMethod: paymentMethodText
            };

            const endpoint = this.isRenewal ? 'renew' : 'join';
            console.log(`📤 Sending membership ${endpoint} request:`, requestBody);

            const response = await fetch(`${API_BASE_URL}/membership/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('📥 API Response:', data);

            if (!response.ok) {
                if (data?.code === 'ACTIVE_PLAN_EXISTS') {
                    throw new Error('คุณมีแพ็กเกจที่ยังใช้งานอยู่ กรุณากลับไปหน้าสมาชิกเพื่อยกเลิกแพ็กเกจเดิมก่อนสมัครแพ็กใหม่');
                }

                throw new Error(data.message || 'Membership registration failed');
            }

            const elapsedTime = Date.now() - requestStartedAt;
            const remainingDelay = Math.max(0, 2000 - elapsedTime);
            if (remainingDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingDelay));
            }

            this.hideLoadingPopup();
            this.showSuccessPage(data.data);

        } catch (error) {
            console.error('❌ Registration error:', error);
            this.hideLoadingPopup();
            this.showError(error.message || 'Failed to register membership. Please try again.');
            
            // Reset submit button
            if (submitBtn) {
                submitBtn.textContent = 'Confirm Registration';
                submitBtn.disabled = false;
            }
        } finally {
            if (submitBtn) {
                submitBtn.textContent = 'Confirm Registration';
                submitBtn.disabled = false;
            }
        }
    }

    showLoadingPopup(message = 'Processing...') {
        const existingLoadingModal = document.getElementById('loading-modal');
        if (existingLoadingModal) {
            existingLoadingModal.remove();
        }

        const loadingHTML = `
            <div id="loading-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.55);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div style="
                    background: #1f2125;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 14px;
                    width: 88%;
                    max-width: 300px;
                    padding: 1.2rem 1rem;
                    text-align: center;
                    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);
                ">
                    <div style="
                        width: 30px;
                        height: 30px;
                        margin: 0 auto 0.8rem;
                        border: 3px solid rgba(255, 255, 255, 0.2);
                        border-top-color: #ff6b5b;
                        border-radius: 50%;
                        animation: loadingSpin 0.8s linear infinite;
                    "></div>
                    <p style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 0.9rem;
                        font-weight: 600;
                    ">${message}</p>
                </div>
            </div>
            <style id="loading-modal-style">
                @keyframes loadingSpin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        const loadingElement = document.createElement('div');
        loadingElement.innerHTML = loadingHTML;
        document.body.appendChild(loadingElement);
    }

    hideLoadingPopup() {
        const loadingModal = document.getElementById('loading-modal');
        if (loadingModal) {
            loadingModal.remove();
        }

        const loadingStyle = document.getElementById('loading-modal-style');
        if (loadingStyle) {
            loadingStyle.remove();
        }
    }

    collectFormData() {
        // Personal Information
        this.formData.personalInfo = {
            firstName: document.querySelector('input[name="first-name"]').value,
            lastName: document.querySelector('input[name="last-name"]').value,
            email: document.querySelector('input[name="email"]').value,
            phone: document.querySelector('input[name="phone"]').value
        };

        // Plan Information
        this.formData.planInfo = {
            type: this.selectedPlan,
            ...this.getPlanData(this.selectedPlan)
        };

        // Payment Information
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        this.formData.paymentInfo = {
            method: paymentMethod
        };

        if (paymentMethod === 'credit-card') {
            this.formData.paymentInfo.cardNumber = document.querySelector('input[name="card-number"]').value;
            this.formData.paymentInfo.expiryDate = document.querySelector('input[name="expiry-date"]').value;
            this.formData.paymentInfo.cvv = document.querySelector('input[name="cvv"]').value;
            this.formData.paymentInfo.cardName = document.querySelector('input[name="card-name"]').value;
        }

        console.log('✏️ Form Data Collected:', this.formData);
    }

    processRegistration() {
        // This method is now replaced by registerMembership()
        // Kept for backward compatibility
        this.registerMembership();
    }

    showSuccess(membershipId) {
        // Update confirmation step with membership ID
        document.querySelector('#membership-id').textContent = membershipId;

        // Hide submit button and show success actions
        document.querySelector('.step-actions').style.display = 'none';
        document.querySelector('.success-actions').style.display = 'block';

        // Add event listeners for success actions
        document.querySelector('#download-card')?.addEventListener('click', () => {
            this.downloadMembershipCard(membershipId);
        });

        document.querySelector('#go-to-dashboard')?.addEventListener('click', () => {
            window.location.href = '../dashboard/dashboard.html';
        });

        document.querySelector('#back-to-home')?.addEventListener('click', () => {
            window.location.href = '../../index.html';
        });
    }

    showSuccessPage(data) {
        // ดึงข้อมูล membership
        const membership = data?.membership || data || {};
        
        // ตรวจสอบว่ามี modal ปัจจุบันอยู่หรือไม่
        let existingModal = document.getElementById('success-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // สีของเว็บ
        const primaryColor = '#0b0d0f';
        const primaryColorLight = '#1f2125';
        const accentColor = '#ff6b5b';
        const successColor = '#10b981';
        const textLight = '#d1d5db';
        const white = '#ffffff';

        // สร้าง Modal HTML แบบ Minimal ขนาดเล็ก
        const modalHTML = `
            <div id="success-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            ">
                <div class="success-modal-content" style="
                    background: ${primaryColorLight};
                    border-radius: 16px;
                    padding: 1.5rem;
                    max-width: 360px;
                    width: 92%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                    animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                ">
                    <!-- Title -->
                    <h2 style="
                        color: ${white};
                        margin-bottom: 0.35rem;
                        font-size: 1.35rem;
                        font-weight: 700;
                        letter-spacing: -0.3px;
                    ">Membership Activated!</h2>
                    
                    <!-- Subtitle -->
                    <p style="
                        font-size: 0.82rem;
                        color: ${textLight};
                        margin-bottom: 1.1rem;
                        line-height: 1.4;
                    ">Thank you for choosing Gymkak.</p>
                    
                    <!-- Membership Info Card -->
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        padding: 1rem;
                        border-radius: 12px;
                        margin-bottom: 1.1rem;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    ">
                        <!-- ID Row -->
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.8rem;
                            text-align: left;
                            margin-bottom: 1rem;
                        ">
                            <div>
                                <div style="
                                    font-size: 0.7rem;
                                    color: ${textLight};
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    margin-bottom: 0.4rem;
                                    opacity: 0.7;
                                ">ID</div>
                                <div style="
                                    font-size: 0.9rem;
                                    font-weight: 600;
                                    color: ${successColor};
                                    word-break: break-all;
                                ">${membership.membershipId || '-'}</div>
                            </div>
                            <div>
                                <div style="
                                    font-size: 0.7rem;
                                    color: ${textLight};
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    margin-bottom: 0.4rem;
                                    opacity: 0.7;
                                ">Status</div>
                                <div style="
                                    display: inline-block;
                                    background: rgba(16, 185, 129, 0.15);
                                    color: ${successColor};
                                    padding: 0.3rem 0.7rem;
                                    border-radius: 6px;
                                    font-size: 0.75rem;
                                    font-weight: 600;
                                    border: 1px solid rgba(16, 185, 129, 0.3);
                                ">Active</div>
                            </div>
                        </div>
                        
                        <!-- Divider -->
                        <div style="
                            height: 1px;
                            background: rgba(255, 255, 255, 0.1);
                            margin: 0.8rem 0;
                        "></div>
                        
                        <!-- Package Info -->
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.8rem;
                            text-align: left;
                            margin-bottom: 1rem;
                        ">
                            <div>
                                <div style="
                                    font-size: 0.7rem;
                                    color: ${textLight};
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    margin-bottom: 0.4rem;
                                    opacity: 0.7;
                                ">Plan</div>
                                <div style="
                                    font-size: 0.9rem;
                                    font-weight: 600;
                                    color: ${white};
                                ">${membership.plan || '-'}</div>
                            </div>
                            <div>
                                <div style="
                                    font-size: 0.7rem;
                                    color: ${textLight};
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    margin-bottom: 0.4rem;
                                    opacity: 0.7;
                                ">Price</div>
                                <div style="
                                    font-size: 0.9rem;
                                    font-weight: 600;
                                    color: ${accentColor};
                                ">$${membership.price || '0'}</div>
                            </div>
                        </div>
                        
                        <!-- Divider -->
                        <div style="
                            height: 1px;
                            background: rgba(255, 255, 255, 0.1);
                            margin: 0.8rem 0;
                        "></div>
                        
                        <!-- Duration Info -->
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.8rem;
                            text-align: left;
                        ">
                            <div>
                                <div style="
                                    font-size: 0.7rem;
                                    color: ${textLight};
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    margin-bottom: 0.4rem;
                                    opacity: 0.7;
                                ">Start</div>
                                <div style="
                                    font-size: 0.85rem;
                                    color: ${white};
                                ">${membership.startDate ? new Date(membership.startDate).toLocaleDateString('en-GB') : '-'}</div>
                            </div>
                            <div>
                                <div style="
                                    font-size: 0.7rem;
                                    color: ${textLight};
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    margin-bottom: 0.4rem;
                                    opacity: 0.7;
                                ">Expire</div>
                                <div style="
                                    font-size: 0.85rem;
                                    color: ${white};
                                ">${membership.expireDate ? new Date(membership.expireDate).toLocaleDateString('en-GB') : '-'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="
                        display: flex;
                        gap: 0.5rem;
                        justify-content: center;
                    ">
                        <button onclick="window.location.href='../dashboard/dashboard.html'" style="
                            flex: 1;
                            padding: 0.65rem 0.9rem;
                            background: ${accentColor};
                            color: ${white};
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.86rem;
                            font-weight: 600;
                            transition: all 0.2s ease;
                            box-shadow: 0 2px 8px rgba(255, 107, 91, 0.2);
                        " onmouseover="this.style.background='#ff5541'; this.style.boxShadow='0 4px 12px rgba(255, 107, 91, 0.3)'" onmouseout="this.style.background='${accentColor}'; this.style.boxShadow='0 2px 8px rgba(255, 107, 91, 0.2)'">
                            Go to Dashboard
                        </button>
                        <button onclick="window.location.href='../user/profile/profile.html'" style="
                            flex: 1;
                            padding: 0.65rem 0.9rem;
                            background: rgba(255, 255, 255, 0.1);
                            color: ${white};
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.86rem;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'; this.style.borderColor='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.borderColor='rgba(255, 255, 255, 0.2)'">
                            View Profile
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;
        
        // สร้าง modal element
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement);
        
        // ลบข้อมูล selectedPlan ออกจาก localStorage
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('membershipRenewMode');
    }

    downloadMembershipCard(membershipId) {
        // In a real application, you would generate a PDF or image
        alert(`การดาउน์โหลดบัตรสมาชิก ID: ${membershipId} (ฟีเจอร์นี้จะพัฒนาในอนาคต)`);
    }
}

// Initialize the registration system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupLoginLogoutToggle();
    new MembershipRegistration();
});

// Helper function to format phone number
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 6) {
        value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6, 10);
    } else if (value.length >= 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
    }
    input.value = value;
}

// Helper function to format credit card number
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.substring(0, 16); // Limit to 16 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
}

// Helper function to format expiry date
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}
