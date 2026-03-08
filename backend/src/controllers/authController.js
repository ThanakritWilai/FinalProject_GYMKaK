const jwt = require("jsonwebtoken");
const Account = require("../models/Account");

/**
 * Register new account
 */
const register = async (req, res) => {
  try {
    const { username, password, name } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters long"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    const userExists = await Account.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Username already registered"
      });
    }

    // Parse name into firstName and lastName
    let firstName = "";
    let lastName = "";
    if (name) {
      const nameParts = name.trim().split(/\s+/);
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    // Create new account
    const account = await Account.create({
      username,
      password,
      firstName,
      lastName
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: account._id, username: account.username },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: account._id,
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Login account
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    // Find user and explicitly select password field
    const account = await Account.findOne({ username }).select("+password");

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // Check password
    const isPasswordValid = await account.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: account._id, username: account.username },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "30d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: account._id,
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all accounts (for testing)
 */
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({}).select("-password");
    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Forgot password - verify username exists
 */
const forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;

    // Validation
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    // Check if user exists
    const account = await Account.findOne({ username });
    if (!account) {
      // For security, don't reveal if username exists
      return res.status(200).json({
        success: true,
        message: "If username exists, password reset instructions have been sent"
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: account._id, username: account.username },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Password reset token generated",
      resetToken,
      userId: account._id
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Reset password - update with new password
 */
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    // Validation
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET || "your_jwt_secret_key"
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Reset token expired or invalid"
      });
    }

    // Find account and update password
    const account = await Account.findById(decoded.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // Update password (will be hashed by pre-save middleware)
    account.password = newPassword;
    await account.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getAllAccounts,
  forgotPassword,
  resetPassword
};
