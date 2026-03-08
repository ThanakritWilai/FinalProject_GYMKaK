// regisgym-new.js - Handle membership plan selection

document.addEventListener('DOMContentLoaded', function() {
    initializePlanButtons();
});

function initializePlanButtons() {
    // Define all membership plans
    const plans = [
        {
            name: 'Daily',
            price: 15,
            duration: '1 Day',
            features: ['Gym access', 'Basic equipment']
        },
        {
            name: 'Monthly',
            price: 45,
            duration: '1 Month',
            features: ['Unlimited gym access', 'All equipment', 'Group classes', 'Free parking']
        },
        {
            name: '1 Year',
            price: 399,
            duration: '1 Year',
            features: ['Unlimited gym access', 'All equipment & classes', 'Personal training (2 sessions)', 'Nutrition consultation', 'Priority booking']
        },
        {
            name: '3 Years',
            price: 999,
            duration: '3 Years',
            features: ['All 1 Year benefits', 'VIP member status', 'Unlimited personal training', 'Premium facilities access', 'Guest passes (10/month)', 'Wellness programs']
        }
    ];

    // Get all Join Now buttons
    const joinButtons = document.querySelectorAll('.price__btn');
    
    joinButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (index >= plans.length) {
                console.error('Invalid plan index:', index);
                return;
            }

            const selectedPlan = plans[index];
            
            console.log('🎯 Selected Plan:', selectedPlan);
            
            // Check if user is logged in
            const token = localStorage.getItem('gymkak_token');
            if (!token) {
                alert('กรุณาเข้าสู่ระบบก่อนสมัครสมาชิก');
                window.location.href = '../../user/login/login.html';
                return;
            }
            
            // Store selected plan to localStorage
            localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
            console.log('💾 Saved to localStorage:', selectedPlan);
            
            // Redirect to signup page
            window.location.href = '../../registerprogram/signup.html';
        });
    });
}
