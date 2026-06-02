const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { signToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ success: true, token, user });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  // Only allow citizen registration publicly; admin/dept created by admin
  const allowedRole = role === 'citizen' ? 'citizen' : 'citizen';

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    name,
    email,
    password,
    role: allowedRole,
    emailVerifyToken: verifyToken,
    emailVerifyExpire: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  try {
    await emailService.sendVerificationEmail(email, verifyToken);
  } catch (e) {
    console.error('Email send failed:', e.message);
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email
    });
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' });
  }

  user.isVerified = true;
  user.emailVerifyToken = null;
  user.emailVerifyExpire = null;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully. You can now login.' });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No user with that email.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1h
  await user.save({ validateBeforeSave: false });

  await emailService.sendPasswordResetEmail(user.email, resetToken);
  res.json({ success: true, message: 'Password reset email sent.' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. Please login.' });
});

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name');
  res.json({ success: true, user });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, notificationPrefs, avatar } = req.body;

  // Only update fields that are actually provided to avoid accidentally
  // overwriting nested objects (e.g. notificationPrefs) with undefined.
  const update = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (address !== undefined) update.address = address;
  if (avatar !== undefined) update.avatar = avatar;
  if (notificationPrefs !== undefined) update.notificationPrefs = notificationPrefs;

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  }).populate('department', 'name');

  res.json({ success: true, user });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address.' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No user found with that email.' });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'This email is already verified.' });
  }

  const verifyToken = crypto.randomBytes(32).toString('hex');
  user.emailVerifyToken = verifyToken;
  user.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24h
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendVerificationEmail(email, verifyToken);
    res.json({ success: true, message: 'Verification email resent successfully.' });
  } catch (e) {
    console.error('Email send failed:', e.message);
    res.status(500).json({ success: false, message: 'Error sending verification email.' });
  }
});
