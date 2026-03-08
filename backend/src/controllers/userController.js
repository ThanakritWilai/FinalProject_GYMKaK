const Account = require("../models/Account");

const formatThaiDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  return new Date(dateValue).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

const getMembershipViewModel = (membership = {}) => {
  const plan = membership.plan || "None";
  const hasMembership = plan !== "None";

  if (!hasMembership) {
    return {
      hasMembership: false,
      type: "",
      status: "Inactive",
      expiryDate: "",
      purchaseDate: "",
      price: "",
      duration: "",
      benefits: []
    };
  }

  const now = new Date();
  const expireDateObj = membership.expireDate ? new Date(membership.expireDate) : null;
  const purchaseDateObj = membership.startDate ? new Date(membership.startDate) : null;

  const durationByPlan = {
    Daily: "1 day",
    Monthly: "30 days",
    "1 Year": "365 days",
    "3 Years": "1095 days"
  };

  const benefitsByPlan = {
    Daily: ["Gym access (1 day)", "All equipment"],
    Monthly: ["Unlimited gym access", "All equipment"],
    "1 Year": [
      "Unlimited gym access",
      "All equipment",
      "4 PT sessions/month",
      "Priority booking"
    ],
    "3 Years": [
      "Unlimited gym access",
      "All equipment",
      "8 PT sessions/month",
      "Priority booking",
      "Nutrition consultation"
    ]
  };

  const computedStatus = expireDateObj && expireDateObj < now ? "Expired" : (membership.status || "Active");

  return {
    hasMembership: true,
    type: `${plan} Plan`,
    status: computedStatus,
    expiryDate: formatThaiDate(expireDateObj),
    purchaseDate: formatThaiDate(purchaseDateObj),
    price: membership.price ? `$${membership.price}` : "",
    duration: durationByPlan[plan] || "",
    benefits: benefitsByPlan[plan] || ["Unlimited gym access", "All equipment"]
  };
};

const getUserViewModel = (account) => {
  const fullName = `${account.firstName || ""} ${account.lastName || ""}`.trim();

  return {
    fullName: fullName || account.username,
    username: account.username,
    email: account.email || `${account.username}@gymkak.com`,
    phone: account.phone || "",
    memberSince: formatThaiDate(account.createdAt)
  };
};

const getProfile = async (req, res) => {
  try {
    const account = await Account.findById(req.user._id).select("-password");

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: getUserViewModel(account),
        membership: getMembershipViewModel(account.membership)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const account = await Account.findById(req.user._id).select("-password");
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    account.firstName = typeof firstName === "string" ? firstName.trim() : account.firstName;
    account.lastName = typeof lastName === "string" ? lastName.trim() : account.lastName;
    account.phone = typeof phone === "string" ? phone.trim() : account.phone;

    await account.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: getUserViewModel(account),
        membership: getMembershipViewModel(account.membership)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
