// Cardio program specific JavaScript
console.log('💪 Cardio program loaded');

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

document.addEventListener('DOMContentLoaded', function () {
    setupLoginLogoutToggle();
});
