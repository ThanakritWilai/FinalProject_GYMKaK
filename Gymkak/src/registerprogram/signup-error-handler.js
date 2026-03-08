/**
 * signup-error-handler.js
 * ✅ Handle Registration & Checkout Errors
 * 
 * Features:
 * 1. Catch API error responses
 * 2. Display user-friendly Thai messages
 * 3. Prevent form submission on error
 * 4. Support Step 1 (Register) & Step 3 (Checkout)
 */

const API_BASE_URL = window.GYMKAK_API_BASE_URL || 'http://localhost:5000/api';

/**
 * ✅ Error Handler: Display error message on page
 */
class SignupErrorHandler {
    constructor() {
        this.createErrorContainer();
    }

    createErrorContainer() {
        if (!document.getElementById('signup-error-display')) {
            const container = document.createElement('div');
            container.id = 'signup-error-display';
            container.style.cssText = `
                display: none;
                margin-top: 12px;
                padding: 12px 16px;
                background: #ff4444;
                color: white;
                border-radius: 6px;
                font-size: 0.9rem;
                text-align: center;
                animation: slideDown 0.3s ease;
            `;
            
            // Add style for animation
            if (!document.getElementById('signup-error-styles')) {
                const style = document.createElement('style');
                style.id = 'signup-error-styles';
                style.textContent = `
                    @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(container);
        }
    }

    showError(message) {
        console.error('❌ Error:', message);
        const container = document.getElementById('signup-error-display');
        
        if (container) {
            container.textContent = '⚠️ ' + message;
            container.style.display = 'block';
            container.style.background = '#ff4444';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                container.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        console.log('✅ Success:', message);
        const container = document.getElementById('signup-error-display');
        
        if (container) {
            container.textContent = '✅ ' + message;
            container.style.display = 'block';
            container.style.background = '#4CAF50';
        }
    }

    hide() {
        const container = document.getElementById('signup-error-display');
        if (container) {
            container.style.display = 'none';
        }
    }
}

const errorHandler = new SignupErrorHandler();

/**
 * ✅ Step 1: Register Validation
 * 
 * Usage:
 * const formData = { firstName, lastName, email, phone, username, password };
 * const result = await handleStep1Submit(formData);
 * if (result.success) { moveToStep(2); }
 */
async function handleStep1Submit(formData) {
    console.log('📝 Step 1: Submitting registration...');
    errorHandler.hide();

    const { firstName, lastName, email, phone, username, password } = formData;

    // ✅ Basic validation
    if (!username || !password) {
        errorHandler.showError('กรุณากรอก username และ password');
        return { success: false };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                name: `${firstName} ${lastName}`.trim(),
                email: email?.trim(),
                phone: phone?.trim()
            })
        });

        const result = await response.json();

        if (!response.ok) {
            // ❌ Handle API Error
            let errorMessage = result.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';

            // Map error codes to Thai messages
            if (result.code === 'EMAIL_DUPLICATE') {
                errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
            } else if (result.code === 'PHONE_DUPLICATE') {
                errorMessage = 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาใช้เบอร์อื่น';
            } else if (result.code === 'USERNAME_DUPLICATE') {
                errorMessage = 'Username นี้ถูกใช้งานแล้ว กรุณาใช้ username อื่น';
            }

            errorHandler.showError(errorMessage);
            return { success: false, error: result.code };
        }

        // ✅ Registration Success
        console.log('✅ Registration successful');
        errorHandler.showSuccess('ลงทะเบียนสำเร็จ! กำลังเดินหน้า...');
        return { success: true };

    } catch (error) {
        console.error('❌ Network error:', error);
        errorHandler.showError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        return { success: false };
    }
}

/**
 * ✅ Step 3: Checkout Validation
 * 
 * Usage:
 * const checkoutData = { plan, paymentMethod, firstName, lastName, email, phone };
 * const result = await handleStep3Submit(checkoutData);
 * if (result.success) { redirectToSuccess(); }
 */
async function handleStep3Submit(checkoutData) {
    console.log('💳 Step 3: Submitting checkout...');
    errorHandler.hide();

    const token = localStorage.getItem('gymkak_token') || localStorage.getItem('token');

    if (!token) {
        errorHandler.showError('กรุณาเข้าสู่ระบบก่อน');
        return { success: false };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/membership/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(checkoutData)
        });

        const result = await response.json();

        if (!response.ok) {
            // ❌ Handle API Error
            let errorMessage = result.message || 'เกิดข้อผิดพลาดในการสมัครแพ็กเกจ';

            // Map error codes to Thai messages
            if (result.code === 'ACTIVE_PLAN_EXISTS') {
                errorMessage = `⚠️ คุณมีแพ็กเกจ ${result.currentPlan} ที่ใช้งานอยู่\n\n` +
                               `วันหมดอายุ: ${new Date(result.expireDate).toLocaleDateString('th-TH')}\n\n` +
                               `กรุณายกเลิกแพ็กเกจเดิมก่อนสมัครใหม่`;
            } else if (result.code === 'PLAN_INVALID') {
                errorMessage = 'แพ็กเกจที่เลือกไม่ถูกต้อง';
            } else if (result.code === 'PLAN_MISSING') {
                errorMessage = 'กรุณาเลือกแพ็กเกจ';
            }

            errorHandler.showError(errorMessage);
            return { success: false, error: result.code };
        }

        // ✅ Checkout Success
        console.log('✅ Checkout successful', result);
        errorHandler.showSuccess('สมัครแพ็กเกจสำเร็จ! ยินดีต้อนรับ');
        return { success: true, data: result };

    } catch (error) {
        console.error('❌ Network error:', error);
        errorHandler.showError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        return { success: false };
    }
}

// ✅ Export functions
window.handleStep1Submit = handleStep1Submit;
window.handleStep3Submit = handleStep3Submit;
window.errorHandler = errorHandler;

console.log('✅ signup-error-handler.js loaded');
