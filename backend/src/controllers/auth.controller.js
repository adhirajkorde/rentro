import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "rentora-super-secret-owner-jwt-key-2026-prod";

const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

const userPayload = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
});

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists with this email" });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: req.body.role || "property-owner",
    });

    if (req.logAction) req.logAction("user-created", "user", user._id);

    res.status(201).json({
      success: true,
      message: "Owner registered successfully",
      data: { token: signToken(user._id), user: userPayload(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (req.logAction) req.logAction("user-login", "user", user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token: signToken(user._id), user: userPayload(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user && req.logAction) req.logAction("user-logout", "user", req.user._id);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      // Return 200 to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset link in production
    // await sendResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, passwordConfirm } = req.body;

    if (!token || !password || !passwordConfirm) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).select("+passwordResetToken +passwordResetExpires");

    if (!user || user.passwordResetToken !== token || user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    if (req.logAction) req.logAction("password-reset", "user", user._id);

    const newToken = signToken(user._id);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      data: { token: newToken, user: userPayload(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    if (req.logAction) req.logAction("password-change", "user", user._id);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: { token: signToken(user._id), user: userPayload(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: userPayload(user) });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, address, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, address, profileImage },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: "Profile updated successfully", data: userPayload(user) });
  } catch (error) {
    next(error);
  }
};

