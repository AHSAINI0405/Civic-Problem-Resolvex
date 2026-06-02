const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['status_update', 'assignment', 'comment', 'upvote', 'system', 'sla_breach'],
      default: 'system',
    },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
