const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const accountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false // Don't return password by default
    },
    firstName: {
      type: String,
      trim: true,
      default: ""
    },
    lastName: {
      type: String,
      trim: true,
      default: ""
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    membership: {
      plan: {
        type: String,
        enum: ["None", "Daily", "Monthly", "1 Year", "3 Years"],
        default: "None"
      },
      startDate: {
        type: Date,
        default: null
      },
      expireDate: {
        type: Date,
        default: null
      },
      status: {
        type: String,
        enum: ["Active", "Expired", "Inactive"],
        default: "Inactive"
      },
      paymentMethod: {
        type: String,
        enum: ["Credit Card", "Bank Transfer", "PayPal", ""],
        default: ""
      },
      price: {
        type: Number,
        default: 0
      },
      membershipId: {
        type: String,
        default: ""
      }
    }
  },
  { timestamps: true }
);

// Hash password before saving
accountSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
accountSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate unique membership ID
accountSchema.methods.generateMembershipId = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `GM${timestamp}${randomStr}`;
};

module.exports = mongoose.model("Account", accountSchema);
