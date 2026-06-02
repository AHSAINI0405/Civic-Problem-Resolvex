const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },
    role: { type: String, enum: ['citizen', 'admin', 'department'], default: 'citizen' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    googleId: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    emailVerifyExpire: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },
    notificationPrefs: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerifyToken;
  delete obj.resetPasswordToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
