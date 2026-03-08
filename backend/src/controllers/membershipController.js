const Account = require("../models/Account");

/**
 * สมัครสมาชิก membership
 */
const joinMembership = async (req, res) => {
  try {
    const { plan, firstName, lastName, phone, paymentMethod } = req.body;

    // Validation
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plan is required"
      });
    }

    // กำหนดราคาตามแพลน
    const planPrices = {
      "Daily": { price: 15, duration: 1, unit: "day" },
      "Monthly": { price: 45, duration: 1, unit: "month" },
      "1 Year": { price: 399, duration: 1, unit: "year" },
      "3 Years": { price: 999, duration: 3, unit: "year" }
    };

    if (!planPrices[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    const planInfo = planPrices[plan];

    // คำนวณวันหมดอายุ
    const startDate = new Date();
    const expireDate = new Date(startDate);

    if (planInfo.unit === "day") {
      expireDate.setDate(expireDate.getDate() + planInfo.duration);
    } else if (planInfo.unit === "month") {
      expireDate.setMonth(expireDate.getMonth() + planInfo.duration);
    } else if (planInfo.unit === "year") {
      expireDate.setFullYear(expireDate.getFullYear() + planInfo.duration);
    }

    // สร้าง membership ID
    const membershipId = `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // อัพเดท account ด้วยข้อมูล membership
    const account = await Account.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          firstName: firstName || req.user.firstName,
          lastName: lastName || req.user.lastName,
          phone: phone || req.user.phone,
          membership: {
            plan: plan,
            startDate: startDate,
            expireDate: expireDate,
            status: "Active",
            paymentMethod: paymentMethod || "Credit Card",
            price: planInfo.price,
            membershipId: membershipId
          }
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Membership registration successful",
      data: {
        membership: account.membership
      }
    });

  } catch (error) {
    console.error("Join membership error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * ดูสถานะสมาชิก membership
 */
const getMembershipStatus = async (req, res) => {
  try {
    const account = await Account.findById(req.user._id);

    if (!account.membership || !account.membership.plan) {
      return res.status(200).json({
        success: true,
        data: {
          membership: null,
          message: "No active membership"
        }
      });
    }

    // ตรวจสอบว่า membership หมดอายุหรือไม่
    const expireDate = new Date(account.membership.expireDate);
    if (new Date() > expireDate) {
      account.membership.status = "Expired";
      await account.save();
    }

    res.status(200).json({
      success: true,
      data: {
        membership: account.membership
      }
    });

  } catch (error) {
    console.error("Get membership status error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const planPrices = {
  Daily: { price: 15, duration: 1, unit: "day" },
  Monthly: { price: 45, duration: 1, unit: "month" },
  "1 Year": { price: 399, duration: 1, unit: "year" },
  "3 Years": { price: 999, duration: 3, unit: "year" }
};

const addPlanDuration = (baseDate, plan) => {
  const planInfo = planPrices[plan];
  const expireDate = new Date(baseDate);

  if (planInfo.unit === "day") {
    expireDate.setDate(expireDate.getDate() + planInfo.duration);
  } else if (planInfo.unit === "month") {
    expireDate.setMonth(expireDate.getMonth() + planInfo.duration);
  } else if (planInfo.unit === "year") {
    expireDate.setFullYear(expireDate.getFullYear() + planInfo.duration);
  }

  return expireDate;
};

const renewMembership = async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;
    const account = await Account.findById(req.user._id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    const currentPlan = account.membership?.plan;
    const currentPrice = account.membership?.price || 0;

    if (!currentPlan || currentPlan === "None") {
      return res.status(400).json({
        success: false,
        code: "NO_MEMBERSHIP",
        message: "ยังไม่มีแพ็กเกจสำหรับต่ออายุ"
      });
    }

    if (!planPrices[currentPlan]) {
      return res.status(400).json({
        success: false,
        code: "PLAN_INVALID",
        message: "แพ็กเกจปัจจุบันไม่รองรับการต่ออายุ"
      });
    }

    if (plan !== currentPlan) {
      return res.status(400).json({
        success: false,
        code: "RENEW_SAME_PLAN_ONLY",
        message: "การต่ออายุสามารถต่อได้เฉพาะแพ็กเกจเดิมเท่านั้น"
      });
    }

    const expectedPrice = planPrices[currentPlan].price;
    if (currentPrice !== expectedPrice) {
      return res.status(400).json({
        success: false,
        code: "RENEW_SAME_PRICE_ONLY",
        message: "การต่ออายุสามารถต่อได้เฉพาะราคาเดิมเท่านั้น"
      });
    }

    const now = new Date();
    const currentExpireDate = account.membership?.expireDate ? new Date(account.membership.expireDate) : null;
    const baseDate = currentExpireDate && currentExpireDate > now ? currentExpireDate : now;
    const newExpireDate = addPlanDuration(baseDate, currentPlan);

    account.membership.status = "Active";
    account.membership.plan = currentPlan;
    account.membership.price = expectedPrice;
    account.membership.paymentMethod = paymentMethod || account.membership.paymentMethod || "Credit Card";
    account.membership.expireDate = newExpireDate;
    account.membership.startDate = account.membership.startDate || now;

    await account.save();

    return res.status(200).json({
      success: true,
      message: "ต่ออายุสมาชิกเรียบร้อยแล้ว",
      data: {
        membership: account.membership
      }
    });
  } catch (error) {
    console.error("Renew membership error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel membership
const cancelMembership = async (req, res) => {
  try {
    const account = await Account.findById(req.user._id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // ตรวจสอบว่ามี membership อยู่หรือไม่
    if (!account.membership || !account.membership.plan || account.membership.plan === "None") {
      return res.status(400).json({
        success: false,
        message: "No membership to cancel"
      });
    }

    // ยกเลิกสมาชิก - ล้างข้อมูล membership ทั้งหมด
    account.membership.status = "Inactive";
    account.membership.plan = "None";
    account.membership.expireDate = null;
    account.membership.startDate = null;
    account.membership.price = 0;
    account.membership.paymentMethod = "";
    account.membership.membershipId = "";
    
    await account.save();

    console.log(`✅ Membership cancelled for user: ${account.username}`);

    res.status(200).json({
      success: true,
      message: "Membership cancelled successfully",
      data: {
        membership: account.membership
      }
    });

  } catch (error) {
    console.error("Cancel membership error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  joinMembership,
  getMembershipStatus,
  renewMembership,
  cancelMembership
};
