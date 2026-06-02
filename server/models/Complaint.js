const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 2000 },

    // AI-generated
    category: {
      type: String,
      enum: ['roads', 'water', 'electricity', 'sanitation', 'public_safety', 'parks', 'noise', 'animals', 'other'],
      default: 'other',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    aiSuggestion: {
      category: String,
      priority: String,
      confidence: Number,
      reason: String,
    },
    isSpam: { type: Boolean, default: false },
    spamReason: { type: String, default: '' },

    // Status & workflow
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'resolved', 'rejected', 'closed'],
      default: 'pending',
    },
    timeline: [timelineEntrySchema],

    // Location
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, default: '' },
    },

    // Media
    images: [{ url: String, publicId: String }],
    videos: [{ url: String, publicId: String }],

    // User
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },

    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedAt: { type: Date, default: null },
    remarks: { type: String, default: '' },
    departmentRemarks: { type: String, default: '' },

    // Engagement
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },

    // SLA
    slaDeadline: { type: Date, default: null },
    slaBreached: { type: Boolean, default: false },

    // Resolution
    resolvedAt: { type: Date, default: null },
    proofImages: [{ url: String, publicId: String }],
  },
  { timestamps: true }
);

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ user: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
