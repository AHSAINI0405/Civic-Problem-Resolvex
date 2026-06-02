const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    categories: [{ type: String }],
    head: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    // Performance metrics (computed/cached)
    totalAssigned: { type: Number, default: 0 },
    totalResolved: { type: Number, default: 0 },
    avgResolutionDays: { type: Number, default: 0 },
    slaBreach: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
