/**
 * validationMiddleware.js
 * Validation & Restrictions Middleware for Gymkak
 * 
 * Features:
 * 1. validateUniqueEmail - ตรวจสอบ Email ไม่ซ้ำในระบบ
 * 2. validateUniquePhone - ตรวจสอบ Phone ไม่ซ้ำในระบบ
 * 3. validatePlanEnum - ตรวจสอบ Plan Valid (Daily, Monthly, 1 Year, 3 Years)
 * 4. checkActivePlan - ป้องกันซื้อแพลนซ้อน
 * 5. requirePremiumMembership - ตรวจสอบสิทธิ์ VIP (1 Year / 3 Years + Active)
 */

const Account = require('../models/Account');

/**
 * ✅ Middleware: ตรวจสอบ Email ไม่ซ้ำในระบบ
 */
async function validateUniqueEmail(req, res, next) {
    const { email } = req.body;

    if (!email) {
        return next(); // ไม่มี email ก็ skip
    }

    try {
        const existingEmail = await Account.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                code: 'EMAIL_DUPLICATE',
                message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ'
            });
        }
        next();
    } catch (error) {
        console.error('Email validation error:', error);
        return res.status(500).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'เกิดข้อผิดพลาดในการตรวจสอบ'
        });
    }
}

/**
 * ✅ Middleware: ตรวจสอบ Phone ไม่ซ้ำในระบบ
 */
async function validateUniquePhone(req, res, next) {
    const { phone } = req.body;

    if (!phone) {
        return next(); // ไม่มี phone ก็ skip
    }

    try {
        const existingPhone = await Account.findOne({ phone: phone.trim() });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                code: 'PHONE_DUPLICATE',
                message: 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้วในระบบ'
            });
        }
        next();
    } catch (error) {
        console.error('Phone validation error:', error);
        return res.status(500).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'เกิดข้อผิดพลาดในการตรวจสอบ'
        });
    }
}

/**
 * ✅ Middleware: ตรวจสอบ Plan Enum (Daily, Monthly, 1 Year, 3 Years)
 */
function validatePlanEnum(req, res, next) {
    const { plan } = req.body;
    const validPlans = ['Daily', 'Monthly', '1 Year', '3 Years'];

    if (!plan) {
        return res.status(400).json({
            success: false,
            code: 'PLAN_MISSING',
            message: 'กรุณาระบุแพ็กเกจ'
        });
    }

    if (!validPlans.includes(plan)) {
        return res.status(400).json({
            success: false,
            code: 'PLAN_INVALID',
            message: `แพ็กเกจ "${plan}" ไม่ถูกต้อง ยอมรับเฉพาะ: Daily, Monthly, 1 Year, 3 Years`
        });
    }

    next();
}

/**
 * ✅ Middleware: ตรวจสอบห้ามซื้อแพลนซ้อน
 * ถ้าผู้ใช้มี Active plan ที่ยังไม่หมดอายุ ห้ามสมัครแพลนใหม่
 */
async function checkActivePlan(req, res, next) {
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            code: 'UNAUTHORIZED',
            message: 'กรุณาเข้าสู่ระบบก่อน'
        });
    }

    try {
        const account = await Account.findById(userId);
        if (!account) {
            return res.status(404).json({
                success: false,
                code: 'USER_NOT_FOUND',
                message: 'ไม่พบข้อมูลผู้ใช้'
            });
        }

        const membership = account.membership || {};
        const { status, expireDate } = membership;
        const now = new Date();

        // ถ้า Active และยังไม่หมดอายุ ห้ามสมัครใหม่
        if (status === 'Active' && expireDate && new Date(expireDate) > now) {
            return res.status(400).json({
                success: false,
                code: 'ACTIVE_PLAN_EXISTS',
                message: 'คุณมีแพ็กเกจที่กำลังใช้งานอยู่ ไม่สามารถสมัครแพ็กเกจใหม่ได้ (กรุณายกเลิกแพ็กเกจเดิมก่อน)',
                currentPlan: membership.plan,
                expireDate: expireDate
            });
        }

        next();
    } catch (error) {
        console.error('Active plan check error:', error);
        return res.status(500).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'เกิดข้อผิดพลาดในการตรวจสอบ'
        });
    }
}

/**
 * ✅ Middleware: ตรวจสอบสิทธิ์ VIP (Premium Membership)
 * ต้องมี 1 Year หรือ 3 Years + Status Active + ไม่หมดอายุ
 */
async function requirePremiumMembership(req, res, next) {
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            code: 'UNAUTHORIZED',
            message: 'กรุณาเข้าสู่ระบบก่อน'
        });
    }

    try {
        const account = await Account.findById(userId);
        if (!account) {
            return res.status(404).json({
                success: false,
                code: 'USER_NOT_FOUND',
                message: 'ไม่พบข้อมูลผู้ใช้'
            });
        }

        const membership = account.membership || {};
        const { plan, status, expireDate } = membership;
        const now = new Date();
        const premiumPlans = ['1 Year', '3 Years'];

        // ตรวจสอบ 1: ต้องมี 1 Year หรือ 3 Years
        if (!premiumPlans.includes(plan)) {
            return res.status(403).json({
                success: false,
                code: 'VIP_REQUIRED',
                message: 'ฟีเจอร์นี้สงวนสิทธิ์เฉพาะสมาชิกแพ็กเกจ "1 Year" หรือ "3 Years" ขึ้นไป',
                requiredPlan: premiumPlans,
                userPlan: plan || 'None'
            });
        }

        // ตรวจสอบ 2: Status ต้องเป็น Active
        if (status !== 'Active') {
            return res.status(403).json({
                success: false,
                code: 'MEMBERSHIP_INACTIVE',
                message: 'สมาชิกของคุณไม่ยังใช้งาน กรุณาต่ออายุแพ็กเกจ',
                currentStatus: status
            });
        }

        // ตรวจสอบ 3: ไม่หมดอายุ
        if (expireDate && new Date(expireDate) <= now) {
            return res.status(403).json({
                success: false,
                code: 'MEMBERSHIP_EXPIRED',
                message: 'สมาชิกของคุณหมดอายุแล้ว กรุณาต่ออายุแพ็กเกจ',
                expireDate: expireDate
            });
        }

        // ✅ ผ่านการตรวจสอบ เก็บข้อมูล membership ไว้ใช้ต่อ
        req.userMembership = membership;
        next();
    } catch (error) {
        console.error('Premium membership check error:', error);
        return res.status(500).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'เกิดข้อผิดพลาดในการตรวจสอบ'
        });
    }
}

module.exports = {
    validateUniqueEmail,
    validateUniquePhone,
    validatePlanEnum,
    checkActivePlan,
    requirePremiumMembership
};
