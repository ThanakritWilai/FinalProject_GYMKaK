/**
 * bodyanalysis-protection.js
 * ✅ Body Analysis Access Control
 * 
 * Features:
 * 1. Check if user has any active membership
 * 2. Check if membership status is Active and not expired
 * 3. Block access for non-members
 * 4. Redirect to membership page with message
 */

const API_BASE_URL = window.GYMKAK_API_BASE_URL || 'http://localhost:5000/api';

async function checkVIPAccess() {
    try {
        // Get authentication token
        const token = localStorage.getItem('gymkak_token');
        if (!token) {
            console.warn('❌ No token found - redirecting to login');
            alert('⚠️ กรุณาเข้าสู่ระบบก่อน');
            window.location.href = '/Gymkak/src/user/login/login.html';
            return false;
        }

        // Fetch membership status from API
        const response = await fetch(`${API_BASE_URL}/membership/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('❌ Failed to fetch membership status');
            alert('⚠️ ไม่สามารถดึงข้อมูลสมาชิก');
            window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
            return false;
        }

        const membershipData = await response.json();
        console.log('📋 Membership Data:', membershipData);

        // Check if membership exists
        if (!membershipData.data || !membershipData.data.membership) {
            console.warn('❌ No active membership found');
                alert('กรุณาสมัครสมาชิก');
            window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
            return false;
        }

        const membership = membershipData.data.membership;
        const planName = membership.plan || '';
        
        console.log('✅ Membership plan:', planName);

        // Validate membership status
        const status = membership.status || 'Inactive';
        if (status !== 'Active') {
            console.warn(`❌ Membership status is: ${status}`);
                alert('กรุณาสมัครสมาชิก');
            window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
            return false;
        }

        // Check expiration date
        const expireDate = membership.expireDate;
        if (expireDate) {
            const today = new Date();
            const expire = new Date(expireDate);
            
            if (today > expire) {
                console.warn(`❌ Membership expired on: ${expireDate}`);
                alert(`⚠️ สมาชิกของคุณหมดอายุแล้ว\n\nวันหมดอายุ: ${expire.toLocaleDateString('th-TH')}\n\nกรุณาต่ออายุสมาชิก`);
                window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
                return false;
            }
        }

        // ✅ Access granted
        console.log('✅ Body Analysis Access Granted');
        console.log('✅ Plan:', planName);
        console.log('✅ Status:', status);
        console.log('✅ Expires:', expireDate);
        return true;

    } catch (error) {
        console.error('❌ Error checking VIP access:', error);
        alert('⚠️ เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
        window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
        return false;
    }
}

// Run check when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Checking Body Analysis Access...');
    const hasAccess = await checkVIPAccess();
    
    if (!hasAccess) {
        // Hide content if not authorized
        document.body.style.display = 'none';
    }
});

console.log('✅ bodyanalysis-protection.js loaded');
