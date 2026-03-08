const express = require("express");
const router = express.Router();
const { joinMembership, getMembershipStatus, renewMembership, cancelMembership } = require("../controllers/membershipController");
const { protect } = require("../middleware/authMiddleware");
const { validatePlanEnum, checkActivePlan } = require("../middleware/validationMiddleware");

// POST /api/membership/join - สมัครสมาชิก (ต้อง login ก่อน)
// ✅ Middleware: validatePlanEnum, checkActivePlan
router.post("/join", protect, validatePlanEnum, checkActivePlan, joinMembership);

// GET /api/membership/status - ดูสถานะสมาชิก (ต้อง login ก่อน)
router.get("/status", protect, getMembershipStatus);

// POST /api/membership/renew - ต่ออายุสมาชิก (ต้อง login ก่อน)
router.post("/renew", protect, validatePlanEnum, renewMembership);

// POST /api/membership/cancel - ยกเลิกสมาชิก (ต้อง login ก่อน)
router.post("/cancel", protect, cancelMembership);

module.exports = router;
