const API_URL = 'http://localhost:5000/api/auth';

let resetState = {
  username: null,
  resetToken: null
};

document.addEventListener('DOMContentLoaded', function () {
  const step1Form = document.getElementById('step1-form');
  const step2Form = document.getElementById('step2-form');
  const loader = document.getElementById('resetLoader');
  const delayLinks = document.querySelectorAll('.delay-link');

  // Handle delay links
  delayLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = link.getAttribute('href');
      if (target !== '#') {
        setTimeout(() => {
          window.location.href = target;
        }, 300);
      }
    });
  });

  // Step 1: Verify username
  if (step1Form) {
    step1Form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const username = document.getElementById('resetUsername').value.trim();

      if (!username) {
        showError('step1', 'กรุณากรอกชื่อผู้ใช้');
        return;
      }

      showLoader(true);

      try {
        const response = await fetch(`${API_URL}/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'เกิดข้อผิดพลาด');
        }

        // Store reset token and username
        resetState.username = username;
        resetState.resetToken = data.resetToken;

        // Move to step 2
        setTimeout(() => {
          moveToStep(2);
          showLoader(false);
        }, 500);

      } catch (error) {
        showLoader(false);
        showError('step1', error.message);
      }
    });
  }

  // Step 2: Set new password
  if (step2Form) {
    step2Form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Validation
      if (!newPassword || !confirmPassword) {
        showError('step2', 'กรุณากรอกรหัสผ่านให้ครบถ้วน');
        return;
      }

      if (newPassword !== confirmPassword) {
        showError('step2', 'รหัสผ่านไม่ตรงกัน');
        return;
      }

      if (newPassword.length < 6) {
        showError('step2', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }

      showLoader(true);

      try {
        const response = await fetch(`${API_URL}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resetToken: resetState.resetToken,
            newPassword,
            confirmPassword
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'เกิดข้อผิดพลาด');
        }

        // Move to success step
        setTimeout(() => {
          moveToStep(3);
          showLoader(false);
        }, 500);

      } catch (error) {
        showLoader(false);
        showError('step2', error.message);
      }
    });
  }
});

function moveToStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll('.reset-step').forEach(step => {
    step.classList.remove('active');
  });

  // Show target step
  document.getElementById(`step${stepNumber}`).classList.add('active');

  // Update progress indicators
  updateProgressIndicators(stepNumber);
}

function updateProgressIndicators(currentStep) {
  for (let i = 1; i <= 3; i++) {
    const circle = document.getElementById(`step${i}-indicator`);
    
    if (i < currentStep) {
      circle.classList.add('completed');
      circle.classList.remove('active');
      circle.innerHTML = '<i class="ri-check-line" style="font-size: 20px;"></i>';
    } else if (i === currentStep) {
      circle.classList.add('active');
      circle.classList.remove('completed');
      circle.innerHTML = i;
    } else {
      circle.classList.remove('active', 'completed');
      circle.innerHTML = i;
    }
  }

  // Update progress lines
  if (currentStep > 1) {
    document.getElementById('line1').classList.add('completed');
  }
  if (currentStep > 2) {
    document.getElementById('line2').classList.add('completed');
  }
}

function showError(step, message) {
  const form = document.querySelector(`#step${step}-form`);
  
  // Remove existing error message
  const existingError = form.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // Create new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = 'color: #ff4444; background: rgba(255, 68, 68, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center;';
  errorDiv.textContent = message;

  form.insertBefore(errorDiv, form.firstChild);

  // Remove error after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function showLoader(visible) {
  const loader = document.getElementById('resetLoader');
  if (visible) {
    loader.classList.add('is-visible');
    loader.setAttribute('aria-hidden', 'false');
  } else {
    loader.classList.remove('is-visible');
    loader.setAttribute('aria-hidden', 'true');
  }
}

function goBackToStep1() {
  resetState = { username: null, resetToken: null };
  document.getElementById('step1-form').reset();
  document.getElementById('step2-form').reset();
  moveToStep(1);
}
