const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

// @desc  Get user notifications
// @route GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort('-createdAt').limit(30)
    .populate('complaint', 'title status');
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, notifications, unreadCount });
});

// @desc  Mark notification as read
// @route PUT /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json({ success: true });
});

// @desc  Mark all as read
// @route PUT /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});
