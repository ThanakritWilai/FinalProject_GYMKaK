/**
 * plananalysis-protection.js
 * ✅ Protect Plan Analysis Page
 * 
 * ต้องมี membership ใดๆ + Active + ไม่หมดอายุ
 * Redirect ถ้าไม่มีสิทธิ์
 */

const API_BASE_URL = window.GYMKAK_API_BASE_URL || 'http://localhost:5000/api';

/**
 * ✅ ตรวจสอบสิทธิ์เมื่อโหลดหน้า Plan Analysis
 */
async function checkPlanAnalysisAccess() {
    console.log('🔐 Checking Plan Analysis Access...');

    const token = localStorage.getItem('gymkak_token') || localStorage.getItem('token');

    if (!token) {
        console.warn('⚠️ No token found');
        alert('กรุณาเข้าสู่ระบบก่อน');
        window.location.href = '/Gymkak/src/user/login/login.html';
        return false;
    }

    try {
        // ✅ ดึงข้อมูล membership status
        const response = await fetch(`${API_BASE_URL}/membership/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        const membership = result.membership || {};
        const { plan, status, expireDate } = membership;

        console.log('📊 Membership:', { plan, status, expireDate });

        // === ตรวจสอบ 1: ต้องมี membership ===
        if (!plan) {
            console.warn('❌ No membership plan found');
            
                alert('กรุณาสมัครสมาชิก');
            
            window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
            return false;
        }

        console.log('✅ Membership plan:', plan);

        // === ตรวจสอบ 2: Status ต้องเป็น Active ===
        if (status !== 'Active') {
            console.warn('❌ Membership not active:', status);
            
                alert('กรุณาสมัครสมาชิก');
            
            window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
            return false;
        }

        // === ตรวจสอบ 3: ไม่หมดอายุ ===
        if (expireDate) {
            const expireTime = new Date(expireDate).getTime();
            const nowTime = new Date().getTime();
            
            if (expireTime <= nowTime) {
                console.warn('❌ Membership expired:', expireDate);
                
                alert(
                    `⚠️ สมาชิกของคุณหมดอายุแล้ว\n\n` +
                    `วันหมดอายุ: ${new Date(expireDate).toLocaleDateString('th-TH')}\n\n` +
                    `โปรดสมัครสมาชิกแล้วเด้งไปหน้าสมัครแพ็คเกจ`
                );
                
                window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
                return false;
            }
        }

        // ✅ ผ่านการตรวจสอบ
        console.log('✅ Plan Analysis Access Granted!');
        return true;

    } catch (error) {
        console.error('❌ Error checking access:', error);
        
        alert(
            `⚠️ เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์\n\n` +
            `โปรดลองใหม่อีกครั้ง`
        );
        
        window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
        return false;
    }
}

/**
 * ✅ เรียกใช้เมื่อหน้า Load
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 Plan Analysis page loaded');
    
    const hasAccess = await checkPlanAnalysisAccess();
    
    if (!hasAccess) {
        // ซ่อน content ถ้าไม่มีสิทธิ์
        document.body.style.display = 'none';
    }
});

// Export สำหรับใช้งาน
window.checkPlanAnalysisAccess = checkPlanAnalysisAccess;
console.log('✅ plananalysis-protection.js loaded');
