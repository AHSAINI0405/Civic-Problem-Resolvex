const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
