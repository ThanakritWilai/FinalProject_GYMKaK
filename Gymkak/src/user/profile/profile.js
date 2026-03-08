// Profile Page JavaScript
console.log('✅ Profile page loaded');

const API_BASE_URL = window.GYMKAK_API_BASE_URL || 'http://localhost:5000/api';
const LOGIN_PAGE = '/Gymkak/src/user/login/login.html';
const DASHBOARD_REDIRECT_URL = 'http://127.0.0.1:5500/Gymkak/src/dashboard/dashboard.html';

let currentProfile = null;

function setupLoginLogoutToggle() {
    const authLinks = document.querySelectorAll('a[href*="/user/login/login.html"]');
    if (!authLinks.length) {
        return;
    }

    const token = getStoredToken();
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

document.addEventListener('DOMContentLoaded', function() {
    setupLoginLogoutToggle();
    enforceAuth();
    loadProfileData();
    setupButtonListeners();
});

function enforceAuth() {
    const token = getStoredToken();
    if (!token) {
        redirectToLogin();
    }
}

function redirectToLogin() {
    window.location.href = LOGIN_PAGE;
}

function clearAuthAndRedirect() {
    localStorage.removeItem('gymkak_token');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    sessionStorage.removeItem('gymkak_user');
    redirectToLogin();
}

function getStoredToken() {
    return localStorage.getItem('gymkak_token') || localStorage.getItem('token');
}

function getAuthHeaders() {
    const token = getStoredToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Load and display user profile data
 */
async function loadProfileData() {
    const token = getStoredToken();
    if (!token) {
        redirectToLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            clearAuthAndRedirect();
            return;
        }

        const payload = await response.json();
        if (!response.ok || !payload.success) {
            throw new Error(payload.message || 'Failed to load profile');
        }

        currentProfile = payload.data;
        const userData = payload.data.user;

        const nameElement = document.querySelector('.profile-name');
        const usernameElement = document.querySelector('.profile-username');
        const emailElement = document.querySelector('.profile-email');

        if (nameElement) {
            nameElement.textContent = userData.fullName || 'ไม่ระบุชื่อ';
        }
        if (usernameElement) {
            usernameElement.textContent = '@' + (userData.username || 'unknown');
        }
        if (emailElement) {
            emailElement.textContent = userData.email || 'ไม่ระบุอีเมล';
        }

        // Update info section with IDs
        const infoUsernameEl = document.getElementById('infoUsername');
        const infoEmailEl = document.getElementById('infoEmail');
        const infoPhoneEl = document.getElementById('infoPhone');
        
        if (infoUsernameEl) infoUsernameEl.textContent = userData.username || '-';
        if (infoEmailEl) infoEmailEl.textContent = userData.email || '-';
        if (infoPhoneEl) infoPhoneEl.textContent = userData.phone || 'ไม่ได้ระบุ';
        
        console.log('✅ User data displayed:', userData);

        loadMembershipData(payload.data.membership);
    } catch (error) {
        console.error('❌ Load profile error:', error);
        alert('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    }
}

/**
 * Load and display membership information
 */
function loadMembershipData(membershipData) {
    const membershipContainer = document.getElementById('membershipContainer');

    if (!membershipContainer) {
        return;
    }

    if (!membershipData) {
        membershipContainer.innerHTML = '<div class="no-membership">ไม่พบข้อมูลสมาชิกภาพ</div>';
        return;
    }

    if (membershipData.hasMembership) {
        const benefitRows = Array.isArray(membershipData.benefits)
            ? membershipData.benefits.map(benefit => `
                <div class="benefit-row">
                    <i class="ri-check-line"></i>
                    <span>${benefit}</span>
                </div>
            `).join('')
            : '';

        const membershipHTML = `
            <div class="membership-layout">
                <div class="membership-main-card">
                    <div class="membership-badge">${membershipData.type}</div>
                    <div class="membership-status">
                        <i class="ri-check-circle-fill"></i> ${membershipData.status}
                    </div>

                    <div class="benefits-list">
                        <h4>สิทธิประโยชน์</h4>
                        ${benefitRows}
                    </div>
                </div>

                <div class="membership-side-panel">
                    <div class="dates">
                        <div class="date-item">
                            <span class="date-label">วันที่เริ่มต้น</span>
                            <span class="date-value">${membershipData.purchaseDate}</span>
                        </div>
                        <div class="date-item">
                            <span class="date-label">วันหมดอายุ</span>
                            <span class="date-value">${membershipData.expiryDate}</span>
                        </div>
                    </div>

                    <div class="membership-actions">
                        <button class="btn btn-danger btn-cancel" onclick="cancelMembership()">
                            <i class="ri-close-line"></i> ยกเลิก
                        </button>
                        <button class="btn btn-success btn-renew" onclick="renewMembership()">
                            <i class="ri-refresh-line"></i> ต่ออายุ
                        </button>
                    </div>
                </div>
            </div>
        `;
        membershipContainer.innerHTML = membershipHTML;
    } else {
        // Display no membership message
        const noMembershipHTML = `
            <div class="no-membership">
                <div class="no-membership-icon">
                    <i class="ri-vip-crown-line"></i>
                </div>
                <div class="no-membership-text">ยังไม่มีสมาชิกภาพ</div>
                <div class="no-membership-subtext">เลือกแพ็คเกจของคุณและเริ่มต้นเทรนนิ่งวันนี้</div>
                <a href="/Gymkak/src/membership/regisgym/regisgym.html">
                    <i class="ri-arrow-right-line"></i> สมัครสมาชิกตอนนี้
                </a>
            </div>
        `;
        membershipContainer.innerHTML = noMembershipHTML;
    }

    console.log('✅ Membership data loaded');
}

async function openEditProfileDialog() {
    if (!currentProfile || !currentProfile.user) {
        alert('ไม่พบข้อมูลโปรไฟล์ปัจจุบัน');
        return;
    }

    // Parse full name into first and last name
    const fullName = currentProfile.user.fullName || '';
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const defaultFirstName = nameParts[0] || '';
    const defaultLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Populate modal fields
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const phoneInput = document.getElementById('phoneInput');
    const modal = document.getElementById('editProfileModal');

    if (firstNameInput) firstNameInput.value = defaultFirstName;
    if (lastNameInput) lastNameInput.value = defaultLastName;
    if (phoneInput) phoneInput.value = currentProfile.user.phone || '';

    // Show modal
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close edit profile modal
 */
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.remove('active');
    }
    clearFormErrors();
}

/**
 * Clear form error messages
 */
function clearFormErrors() {
    document.getElementById('firstNameError').textContent = '';
    document.getElementById('lastNameError').textContent = '';
    document.getElementById('phoneError').textContent = '';
}

/**
 * Validate form inputs
 */
function validateEditForm() {
    const firstName = document.getElementById('firstNameInput').value.trim();
    const lastName = document.getElementById('lastNameInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    let isValid = true;

    clearFormErrors();

    if (!firstName) {
        document.getElementById('firstNameError').textContent = 'กรุณากรอกชื่อ';
        isValid = false;
    }

    if (!lastName) {
        document.getElementById('lastNameError').textContent = 'กรุณากรอกนามสกุล';
        isValid = false;
    }

    if (phone) {
        // ลบอักขระพิเศษออก เหลือแค่ตัวเลข
        const cleanPhone = phone.replace(/\D/g, '');
        
        if (cleanPhone.length !== 10) {
            document.getElementById('phoneError').textContent = 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก';
            isValid = false;
        } else if (!/^0[0-9]{9}$/.test(cleanPhone)) {
            document.getElementById('phoneError').textContent = 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0';
            isValid = false;
        }
    }

    return { isValid, firstName, lastName, phone };
}

/**
 * Save updated profile data
 */
async function saveEditProfile() {
    const validation = validateEditForm();
    if (!validation.isValid) {
        return;
    }

    const saveBtn = document.getElementById('saveModalBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'กำลังบันทึก...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                firstName: validation.firstName,
                lastName: validation.lastName,
                phone: validation.phone
            })
        });

        if (response.status === 401) {
            clearAuthAndRedirect();
            return;
        }

        const payload = await response.json();
        if (!response.ok || !payload.success) {
            throw new Error(payload.message || 'Failed to update profile');
        }

        console.log('✅ Profile updated successfully');
        closeEditProfileModal();
        await loadProfileData();
        alert('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch (error) {
        console.error('❌ Update profile error:', error);
        document.getElementById('firstNameError').textContent = 'ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้';
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'บันทึก';
        }
    }
}

/**
 * Setup button event listeners
 */
function setupButtonListeners() {
    // Phone input - allow only numbers and limit to 10 digits
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = e.target.value.replace(/\D/g, '');
            // Limit to 10 digits
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            e.target.value = value;
        });

        // Prevent non-numeric input
        phoneInput.addEventListener('keypress', function(e) {
            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
    }

    // Edit Profile button
    const editBtn = document.querySelector('.btn-action.btn-edit');
    if (editBtn) {
        editBtn.addEventListener('click', async function() {
            await openEditProfileDialog();
        });
    }

    // Modal close button
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditProfileModal);
    }

    // Modal cancel button
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeEditProfileModal);
    }

    // Modal save button
    const saveModalBtn = document.getElementById('saveModalBtn');
    if (saveModalBtn) {
        saveModalBtn.addEventListener('click', async function() {
            await saveEditProfile();
        });
    }

    // Close modal when clicking outside
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeEditProfileModal();
            }
        });
    }

    // Allow Enter key to submit form
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEditProfile();
            }
        });
    }

    // Membership Management button
    const membershipBtn = document.querySelector('.btn-action.btn-membership');
    if (membershipBtn) {
        membershipBtn.addEventListener('click', function() {
            window.location.href = '/Gymkak/src/membership/regisgym/regisgym.html';
        });
    }

    // Menu dropdown functionality
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.getElementById('profileDropdownMenu');
    
    if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (dropdownMenu.style.opacity === '1') {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
                dropdownMenu.style.transform = 'translateY(-8px)';
            } else {
                dropdownMenu.style.opacity = '1';
                dropdownMenu.style.visibility = 'visible';
                dropdownMenu.style.transform = 'translateY(0)';
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
                dropdownMenu.style.transform = 'translateY(-8px)';
            }
        });
        
        // Add hover effect for dropdown items
        const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(255, 255, 255, 0.09)';
                this.style.color = 'var(--white)';
                if (this.querySelector('i')) {
                    this.querySelector('i').style.color = 'var(--white)';
                }
            });
            item.addEventListener('mouseleave', function() {
                this.style.background = 'none';
                this.style.color = 'var(--white)';
                if (this.querySelector('i')) {
                    this.querySelector('i').style.color = 'var(--text-light)';
                }
            });
        });
    }

    console.log('✅ Button listeners setup');
}

/**
 * Cancel membership
 */
async function cancelMembership() {
    if (!confirm('คุณแน่ใจว่าต้องการยกเลิกสมาชิกภาพหรือไม่?\n\nการยกเลิกจะทำให้คุณเสียสิทธิ์ทันที')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/membership/cancel`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            clearAuthAndRedirect();
            return;
        }

        const payload = await response.json();
        
        if (!response.ok || !payload.success) {
            throw new Error(payload.message || 'ไม่สามารถยกเลิกสมาชิกได้');
        }

        console.log('✅ Membership cancelled successfully');
        alert('ยกเลิกสมาชิกภาพเรียบร้อยแล้ว');
        await loadProfileData(); // Reload to show updated status
    } catch (error) {
        console.error('❌ Cancel membership error:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}

/**
 * Renew or upgrade membership
 */
function renewMembership() {
    const membership = currentProfile?.membership;

    if (!membership || !membership.hasMembership) {
        alert('ไม่พบแพ็กเกจสำหรับต่ออายุ');
        return;
    }

    const planName = (membership.type || '').replace(/\s*Plan$/i, '').trim();
    const planPrice = Number(String(membership.price || '').replace(/[^\d.]/g, ''));

    if (!planName || Number.isNaN(planPrice)) {
        alert('ไม่สามารถอ่านข้อมูลแพ็กเกจปัจจุบันได้');
        return;
    }

    const durationByPlan = {
        'Daily': '1 Day',
        'Monthly': '1 Month',
        '1 Year': '1 Year',
        '3 Years': '3 Years'
    };

    const selectedPlan = {
        name: planName,
        price: planPrice,
        duration: durationByPlan[planName] || '1 Month'
    };

    localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
    localStorage.setItem('membershipRenewMode', '1');

    window.location.href = '/Gymkak/src/registerprogram/signup.html?renew=1';
}
