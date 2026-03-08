## 📚 INTEGRATION GUIDE
## Validation & Restrictions System for Gymkak

---

## 🎯 QUICK SUMMARY

ระบบที่สร้างขึ้นมี 5 ส่วนหลัก:

### Backend (Node.js/Express)
1. **validationMiddleware.js** - 5 middleware functions
2. **Updated routes** - authRoutes, membershipRoutes, exerciseRoutes

### Frontend (Vanilla JS)
1. **plananalysis-protection.js** - ป้องกันเข้าหน้า Plan Analysis
2. **signup-error-handler.js** - จัดการ error registration & checkout

---

## 🔧 BACKEND IMPLEMENTATION

### 1️⃣ Middleware: validationMiddleware.js

**Location:** `backend/src/middleware/validationMiddleware.js`

**5 Functions:**

#### ✅ validateUniqueEmail
```javascript
// ตรวจสอบ Email ไม่ซ้ำ
// ใช้ที่ Registration
// ถ้าซ้ำ Return 400 + "อีเมลนี้ถูกใช้งานแล้ว"
```

#### ✅ validateUniquePhone  
```javascript
// ตรวจสอบ Phone ไม่ซ้ำ
// ใช้ที่ Registration
// ถ้าซ้ำ Return 400 + "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว"
```

#### ✅ validatePlanEnum
```javascript
// ตรวจสอบ Plan Valid (Daily, Monthly, 1 Year, 3 Years)
// ใช้ที่ Checkout
// ถ้าผิด Return 400 + "แพ็กเกจไม่ถูกต้อง"
```

#### ✅ checkActivePlan
```javascript
// ป้องกันซื้อแพลนซ้อน
// ใช้ที่ Checkout
// ถ้ามี Active plan Return 400 + "คุณมีแพ็กเกจที่ใช้งานอยู่"
```

#### ✅ requirePremiumMembership
```javascript
// ตรวจสอบ VIP (1 Year / 3 Years + Active)
// ใช้ที่ Plan Analysis API
// ถ้าไม่มี Return 403 + "ฟีเจอร์นี้สงวนสิทธิ์ฯ"
```

---

### 2️⃣ Updated Routes

#### authRoutes.js
```javascript
const { validateUniqueEmail, validateUniquePhone } = require('../middleware/validationMiddleware');

// ✅ Registration with validation
router.post('/register', 
  validateUniqueEmail,    // Check email not duplicate
  validateUniquePhone,    // Check phone not duplicate
  authController.register
);
```

#### membershipRoutes.js
```javascript
const { validatePlanEnum, checkActivePlan } = require('../middleware/validationMiddleware');

// ✅ Checkout with validation
router.post('/join',
  protect,                 // Check logged in
  validatePlanEnum,        // Check plan valid
  checkActivePlan,         // Check no active plan
  joinMembership
);
```

#### exerciseRoutes.js
```javascript
const { requirePremiumMembership } = require('../middleware/validationMiddleware');

// ✅ VIP Only Endpoint
router.get('/analysis/premium-data',
  protect,                     // Check logged in
  requirePremiumMembership,    // Check VIP membership
  (req, res) => {
    // Only users with 1 Year / 3 Years + Active can access
  }
);
```

---

## 💻 FRONTEND IMPLEMENTATION

### 1️⃣ Plan Analysis Protection

**File:** `Gymkak/src/bodyanalysis/plan/plananalysis-protection.js`

**Add to plananalysis.html `<head>`:**
```html
<script src="plananalysis-protection.js"></script>
```

**How it works:**
```
Page Load
  ↓
checkPlanAnalysisAccess() runs
  ↓
GET /api/membership/status
  ↓
Check: Has 1 Year / 3 Years?
Check: Status Active?
Check: Not expired?
  ↓
❌ NO: alert() + redirect to /membership/regisgym.html
✅ YES: Page loads normally
```

---

### 2️⃣ Signup Error Handler

**File:** `Gymkak/src/registerprogram/signup-error-handler.js`

**Add to signup.html `<head>`:**
```html
<script src="signup-error-handler.js"></script>
```

**Usage in signup.js:**

#### Step 1: Register
```javascript
// When user clicks "Next" button on Step 1
async function handleStep1Next() {
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    const result = await handleStep1Submit(formData);
    
    if (result.success) {
        // ✅ Move to Step 2
        moveToStep(2);
    }
    // ❌ Error shown by errorHandler automatically
}
```

#### Step 3: Checkout
```javascript
// When user clicks "Confirm Registration" button on Step 3
async function handleStep3Confirm() {
    const checkoutData = {
        plan: document.getElementById('selectedPlan').value || localStorage.getItem('selectedPlan')?.plan,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    const result = await handleStep3Submit(checkoutData);
    
    if (result.success) {
        // ✅ Success! Wait 2 seconds then redirect
        setTimeout(() => {
            window.location.href = '/Gymkak/src/user/profile/profile.html';
        }, 2000);
    }
    // ❌ Error shown by errorHandler automatically
}
```

---

## 📊 ERROR CODES REFERENCE

| Code | HTTP | Meaning | Solution |
|------|------|---------|----------|
| EMAIL_DUPLICATE | 400 | Email ซ้ำ | ใช้ email อื่น |
| PHONE_DUPLICATE | 400 | Phone ซ้ำ | ใช้ phone อื่น |
| PLAN_INVALID | 400 | Plan ไม่ valid | เลือก Plan ที่ถูกต้อง |
| PLAN_MISSING | 400 | ไม่ได้ระบุ Plan | ระบุ Plan ก่อน |
| ACTIVE_PLAN_EXISTS | 400 | มี Active plan | ยกเลิก plan เดิม |
| VIP_REQUIRED | 403 | ไม่มี VIP | อัปเกรด 1/3 Year |
| MEMBERSHIP_INACTIVE | 403 | ไม่ active | ต่ออายุแพ็กเกจ |
| MEMBERSHIP_EXPIRED | 403 | หมดอายุ | ต่ออายุแพ็กเกจ |
| UNAUTHORIZED | 401 | ไม่ได้เข้าระบบ | เข้าระบบก่อน |

---

## 🧪 TESTING

### Backend Testing (Postman/curl)

#### Test 1: Duplicate Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"john2",
    "password":"password123",
    "email":"existing@example.com"
  }'

# Expected: 400 EMAIL_DUPLICATE
```

#### Test 2: Active Plan Exists
```bash
curl -X POST http://localhost:5000/api/membership/join \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"Monthly"}'

# Expected: 400 ACTIVE_PLAN_EXISTS (if user has active plan)
```

#### Test 3: VIP Access Denied
```bash
curl -X GET http://localhost:5000/api/exercises/analysis/premium-data \
  -H "Authorization: Bearer YOUR_TOKEN"

# ✅ 200 OK (if VIP membership)
# ❌ 403 VIP_REQUIRED (if not VIP)
```

### Frontend Testing (Browser)

✅ **Registration (Step 1):**
- [ ] ใส่ email ที่มี → ต้องแสดง error
- [ ] ใส่ phone ที่มี → ต้องแสดง error
- [ ] ไม่มี error → ต้อง move to Step 2

✅ **Checkout (Step 3):**
- [ ] User มี active plan → ต้องแสดง error
- [ ] User ไม่มี active plan → ต้อง success & redirect

✅ **Plan Analysis:**
- [ ] User Daily plan → ต้อง redirect
- [ ] User Monthly plan → ต้อง redirect
- [ ] User 1 Year plan (Active) → ต้องเข้าหน้า
- [ ] User 3 Years plan (Active) → ต้องเข้าหน้า

---

## 📁 FILE LOCATIONS

### Backend
```
backend/
├── src/
│   ├── middleware/
│   │   └── validationMiddleware.js ✅ (NEW)
│   └── routes/
│       ├── authRoutes.js ✅ (UPDATED)
│       ├── membershipRoutes.js ✅ (UPDATED)
│       └── exerciseRoutes.js ✅ (UPDATED)
```

### Frontend
```
Gymkak/src/
├── bodyanalysis/
│   └── plan/
│       └── plananalysis-protection.js ✅ (NEW)
└── registerprogram/
    └── signup-error-handler.js ✅ (NEW)
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Backend files created/updated
- [ ] Frontend files created
- [ ] Add scripts to HTML files
- [ ] Update signup.js with error handler calls
- [ ] Test registration with duplicate email
- [ ] Test checkout with active plan
- [ ] Test plan analysis access
- [ ] Run backend syntax check
- [ ] Run frontend syntax check
- [ ] Deploy to production

---

## 💡 USAGE EXAMPLES

### Example 1: User Registers Twice with Same Email
```
1. User clicks "Next" on Step 1
2. Frontend calls: handleStep1Submit({..., email: "john@example.com"})
3. Backend: validateUniqueEmail middleware
4. Email found in DB
5. Response: 400 EMAIL_DUPLICATE
6. Frontend: errorHandler.showError("อีเมลนี้ถูกใช้งานแล้ว")
7. User stays on Step 1
```

### Example 2: User with Active Plan Tries to Buy Again
```
1. User clicks "Confirm" on Step 3
2. Frontend calls: handleStep3Submit({plan: "Monthly", ...})
3. Backend: checkActivePlan middleware
4. User has active "1 Year" plan until 2026-04-01
5. Response: 400 ACTIVE_PLAN_EXISTS
6. Frontend: errorHandler.showError("คุณมีแพ็กเกจที่ใช้งานอยู่...")
7. User stays on Step 3
```

### Example 3: Non-VIP User Tries to Access Plan Analysis
```
1. User navigates to plananalysis.html
2. plananalysis-protection.js loads
3. checkPlanAnalysisAccess() runs
4. Fetches: GET /api/membership/status
5. Returns: plan="Monthly" (not VIP)
6. Alert: "ฟีเจอร์นี้สงวนสิทธิ์เฉพาะแพ็กเกจ 1 Year / 3 Years"
7. Redirect to: /membership/regisgym.html
```

---

## ✅ STATUS

**All files created & syntax checked:**
- ✅ validationMiddleware.js
- ✅ authRoutes.js
- ✅ membershipRoutes.js
- ✅ exerciseRoutes.js
- ✅ plananalysis-protection.js
- ✅ signup-error-handler.js

**Ready for Integration & Testing!**

---

**Version:** 1.0  
**Date:** March 2, 2026  
**Status:** ✅ Ready for Implementation
