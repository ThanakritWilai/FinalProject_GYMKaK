const API_URL = 'http://localhost:5000/api/auth';

document.addEventListener('DOMContentLoaded', function () {
	const loginForm = document.querySelector('.auth-form');
	const loader = document.getElementById('loginLoader');
	const delayLinks = document.querySelectorAll('.delay-link');
	const emailInput = document.getElementById('loginEmail');
	const passwordInput = document.getElementById('loginPassword');

	if (!loginForm) {
		return;
	}

	delayLinks.forEach((link) => {
		link.addEventListener('click', (event) => {
			event.preventDefault();
			const target = link.getAttribute('href');
			setTimeout(() => {
				window.location.href = target;
			}, 300);
		});
	});

	loginForm.addEventListener('submit', async function (event) {
		event.preventDefault();

		const username = emailInput.value.trim();
		const password = passwordInput.value;

		if (!username || !password) {
			showError('กรุณากรอกข้อมูลให้ครบถ้วน');
			return;
		}

		if (loader) {
			loader.classList.add('is-visible');
			loader.setAttribute('aria-hidden', 'false');
		}

		try {
			const response = await fetch(`${API_URL}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
			}

			// Store user data
			sessionStorage.setItem('gymkak_user', JSON.stringify(data.user));
			localStorage.setItem('gymkak_token', data.token);

			// Redirect to dashboard
			setTimeout(() => {
				window.location.href = '../../dashboard/dashboard.html';
			}, 1000);

		} catch (error) {
			if (loader) {
				loader.classList.remove('is-visible');
				loader.setAttribute('aria-hidden', 'true');
			}
			showError(error.message);
		}
	});

	function showError(message) {
		// Create error message element if it doesn't exist
		let errorDiv = document.querySelector('.error-message');
		if (!errorDiv) {
			errorDiv = document.createElement('div');
			errorDiv.className = 'error-message';
			errorDiv.style.cssText = 'color: #ff4444; background: rgba(255, 68, 68, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center;';
			loginForm.insertBefore(errorDiv, loginForm.firstChild);
		}
		errorDiv.textContent = message;
		
		// Remove error after 5 seconds
		setTimeout(() => {
			errorDiv.remove();
		}, 5000);
	}
});
