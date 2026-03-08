/*
=========================================
MEMBERSHIP PAGE JAVASCRIPT
=========================================
Description: Interactive functionality for the membership page
Features:
- Smooth scrolling navigation
- Animated pricing cards
- Enhanced button interactions
- Parallax effects
- Scroll animations
=========================================
*/

// Membership Page JavaScript

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

// Smooth scroll to program selection section
function scrollToPrograms() {
    const programSection = document.getElementById('program-selection');
    if (programSection) {
        programSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}
function scrollToPricing() {
    const pricingSection = document.getElementById('membership');
    if (pricingSection) {
        pricingSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Profile Dropdown functionality
function toggleProfileDropdown() {
    const dropdown = document.querySelector('.profile-dropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const dropdown = document.querySelector('.profile-dropdown');
    if (!dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Setup login/logout toggle
    setupLoginLogoutToggle();
    
    // Add enhanced hover effects to pricing cards
    const priceCards = document.querySelectorAll('.price__card');

    priceCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // Add click handlers for pricing buttons with enhanced functionality
    const pricingButtons = document.querySelectorAll('.price__btn');

    pricingButtons.forEach(button => {
        button.addEventListener('click', function () {
            const planCard = this.closest('.price__card');
            const planName = planCard.querySelector('h4').textContent;
            const planPrice = planCard.querySelector('h3').textContent;

            // Determine plan type based on the plan name
            let planType = '';
            if (planName.includes('Daily')) {
                planType = 'daily';
            } else if (planName.includes('Monthly')) {
                planType = 'monthly';
            } else if (planName.includes('1 Year')) {
                planType = 'yearly';
            } else if (planName.includes('3 Years')) {
                planType = 'threeyears';
            }

            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Loading...';
            this.disabled = true;

            // Store selected plan and redirect to registration
            if (planType) {
                localStorage.setItem('selectedPlan', planType);

                setTimeout(() => {
                    // Redirect to registration page with plan parameter
                    window.location.href = `../registerprogram/signup.html?plan=${planType}`;
                }, 800);
            } else {
                // Fallback for unrecognized plans
                setTimeout(() => {
                    this.textContent = originalText;
                    this.disabled = false;
                    alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                }, 800);
            }
        });
    });

    // Add smooth scrolling for all anchor links
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add parallax effect to hero section
    const heroImage = document.querySelector('.hero-image img');
    if (heroImage) {
        window.addEventListener('scroll', function () {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroImage.style.transform = `translateY(${rate}px)`;
        });
    }

    // Add animation on scroll for pricing cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe pricing cards for animation
    priceCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Body Analysis & Progress Tracking System
    class FitnessTracker {
        constructor() {
            this.init();
        }

        init() {
            this.loadUserData();
            this.generateWeekCalendar();
            this.updateTodayWorkout();
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Body Analysis Form
            const form = document.getElementById('bodyAnalysisForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.processBodyAnalysis();
                });
            }
        }

        loadUserData() {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData.height) {
                document.getElementById('userHeight').textContent = userData.height + ' cm';
                document.getElementById('userWeight').textContent = userData.weight + ' kg';
                document.getElementById('userBMI').textContent = userData.bmi;
                document.getElementById('fitnessGoal').textContent = userData.goal || 'Not Set';

                if (userData.recommendation) {
                    document.getElementById('programRecommendation').textContent = userData.recommendation;
                }
            }
        }

        processBodyAnalysis() {
            const formData = new FormData(document.getElementById('bodyAnalysisForm'));
            const height = parseFloat(formData.get('height')) / 100; // Convert to meters
            const weight = parseFloat(formData.get('weight'));
            const age = parseInt(formData.get('age'));
            const gender = formData.get('gender');
            const goal = formData.get('goal');
            const activityLevel = formData.get('activityLevel');

            // Calculate BMI
            const bmi = (weight / (height * height)).toFixed(1);

            // Generate recommendation
            const recommendation = this.generateRecommendation(bmi, goal, activityLevel, age, gender);

            // Save user data
            const userData = {
                height: parseFloat(formData.get('height')),
                weight: weight,
                age: age,
                gender: gender,
                bmi: bmi,
                goal: this.getGoalText(goal),
                activityLevel: activityLevel,
                recommendation: recommendation
            };

            localStorage.setItem('userData', JSON.stringify(userData));

            // Update UI
            this.loadUserData();
            this.closeBodyAnalysis();

            // Show success message
            this.showNotification('Body analysis completed! Check your personalized recommendations.', 'success');
        }

        generateRecommendation(bmi, goal, activityLevel, age, gender) {
            let recommendation = '';

            if (goal === 'weight-loss') {
                if (parseFloat(bmi) > 25) {
                    recommendation = '5-Day Cardio + Strength Program - Focus on fat burning with combination of cardio and resistance training';
                } else {
                    recommendation = '4-Day Strength + Cardio Program - Maintain muscle while creating caloric deficit';
                }
            } else if (goal === 'muscle-gain') {
                recommendation = '5-Day Push/Pull/Legs Program - Heavy resistance training with progressive overload';
            } else {
                recommendation = '4-Day Balanced Program - Mix of strength training and cardio for overall fitness';
            }

            return recommendation;
        }

        getGoalText(goal) {
            const goals = {
                'weight-loss': 'Weight Loss',
                'muscle-gain': 'Muscle Gain',
                'maintenance': 'Fitness Maintenance'
            };
            return goals[goal] || 'Not Set';
        }

        generateWeekCalendar() {
            const calendar = document.getElementById('weekCalendar');
            if (!calendar) return;

            const today = new Date();
            const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const workoutDays = ['Rest', 'Push', 'Pull', 'Legs', 'Upper', 'Circuit', 'Rest'];

            let calendarHTML = '';

            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - currentDay + i);
                const isToday = i === currentDay;
                const dayProgress = this.getDayProgress(i);

                calendarHTML += `
                    <div class="calendar-day ${isToday ? 'today' : ''} ${dayProgress.completed ? 'completed' : ''}">
                        <span class="day-name">${weekDays[i]}</span>
                        <span class="day-date">${date.getDate()}</span>
                        <span class="day-workout">${workoutDays[i]}</span>
                        <div class="day-progress">
                            <div class="progress-dot ${dayProgress.completed ? 'completed' : ''}"></div>
                        </div>
                    </div>
                `;
            }

            calendar.innerHTML = calendarHTML;
        }

        getDayProgress(dayIndex) {
            const progress = JSON.parse(localStorage.getItem('weeklyProgress') || '{}');
            const today = new Date();
            const date = new Date(today);
            date.setDate(today.getDate() - today.getDay() + dayIndex);
            const dateKey = date.toISOString().split('T')[0];

            return {
                completed: progress[dateKey] || false,
                percentage: progress[dateKey] ? 100 : 0
            };
        }

        updateTodayWorkout() {
            const today = new Date();
            const dayIndex = today.getDay(); // 0 = Sunday
            const workoutTypes = ['Rest Day', 'Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Circuit Training', 'Rest Day'];
            const exerciseCounts = [0, 5, 5, 5, 5, 5, 0];

            const currentWorkout = workoutTypes[dayIndex];
            const totalExercises = exerciseCounts[dayIndex];

            const currentDayTypeElement = document.getElementById('currentDayType');
            if (currentDayTypeElement) {
                currentDayTypeElement.textContent = currentWorkout;
            }

            if (totalExercises > 0) {
                const progress = this.getTodayProgress();
                const completed = Math.floor(totalExercises * (progress / 100));

                const dailyProgressElement = document.getElementById('dailyProgress');
                const progressTextElement = document.getElementById('progressText');

                if (dailyProgressElement) {
                    dailyProgressElement.style.width = progress + '%';
                }
                if (progressTextElement) {
                    progressTextElement.textContent = `${completed}/${totalExercises} exercises completed`;
                }
            } else {
                const dailyProgressElement = document.getElementById('dailyProgress');
                const progressTextElement = document.getElementById('progressText');

                if (dailyProgressElement) {
                    dailyProgressElement.style.width = '100%';
                }
                if (progressTextElement) {
                    progressTextElement.textContent = 'Rest day - Recovery time';
                }
            }
        }

        getTodayProgress() {
            const today = new Date().toISOString().split('T')[0];
            const dailyProgress = JSON.parse(localStorage.getItem('dailyProgress') || '{}');
            return dailyProgress[today] || 0;
        }

        markWorkoutComplete() {
            const today = new Date().toISOString().split('T')[0];
            const dayIndex = new Date().getDay();

            if (dayIndex === 0 || dayIndex === 6) { // Weekend
                this.showNotification('Today is a rest day! Enjoy your recovery time.', 'info');
                return;
            }

            // Update daily progress
            const dailyProgress = JSON.parse(localStorage.getItem('dailyProgress') || '{}');
            dailyProgress[today] = 100;
            localStorage.setItem('dailyProgress', JSON.stringify(dailyProgress));

            // Update weekly progress
            const weeklyProgress = JSON.parse(localStorage.getItem('weeklyProgress') || '{}');
            weeklyProgress[today] = true;
            localStorage.setItem('weeklyProgress', JSON.stringify(weeklyProgress));

            // Update UI
            this.updateTodayWorkout();
            this.generateWeekCalendar();

            this.showNotification('Great job! Today\'s workout marked as complete!', 'success');
        }

        showNotification(message, type = 'info') {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="ri-${type === 'success' ? 'check' : 'information'}-line"></i>
                    <span>${message}</span>
                </div>
            `;

            // Add styles
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--primary-color-light);
                color: var(--white);
                padding: 1rem 1.5rem;
                border-radius: 8px;
                border-left: 4px solid ${type === 'success' ? '#22c55e' : '#3b82f6'};
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;

            document.body.appendChild(notification);

            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        closeBodyAnalysis() {
            const modal = document.getElementById('bodyAnalysisModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    }

    // Program Selection functionality
    function initializeProgramSelection() {
        const programButtons = document.querySelectorAll('.program-btn');

        programButtons.forEach(button => {
            button.addEventListener('click', function () {
                const programType = this.getAttribute('data-program');

                // Add loading state
                const originalText = this.textContent;
                this.textContent = 'กำลังเลือกโปรแกรม...';
                this.disabled = true;

                // Add visual feedback
                this.style.transform = 'translateY(-2px)';

                setTimeout(() => {
                    // Navigate to body analysis page
                    window.location.href = '../bodyanalysis/bodyanalysis.html?program=' + programType;
                }, 1000);
            });
        });
    }

    // Initialize program selection when DOM is loaded
    initializeProgramSelection();

    // Add notification animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    `;
    document.head.appendChild(style);

    // Dropdown functionality for nav menu (like membership)
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.querySelector('.dropdown-menu.redesigned-dropdown');
    if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', function (e) {
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
        document.addEventListener('click', function (e) {
            if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
                dropdownMenu.style.transform = 'translateY(-8px)';
            }
        });
    }
});
