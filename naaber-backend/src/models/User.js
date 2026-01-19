const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  googleId: {
    type: String,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  surname: {
    type: String,
    required: [true, 'Surname is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['president', 'member', 'pending'],
    default: 'pending'
  },
  flatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat'
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  },
  language: {
    type: String,
    enum: ['ru', 'et', 'en'],
    default: 'ru'
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  confirmedAt: {
    type: Date,
    default: null
  },
  lastChatVisit: {
    type: Map,
    of: Date,
    default: new Map()
  },
  lastFlatsVisit: {
    type: Map,
    of: Date,
    default: new Map()
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.surname}`;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Index for faster queries
userSchema.index({ communityId: 1, role: 1 });
userSchema.index({ flatId: 1 });
// Unique index: same email can only be in one community once
userSchema.index({ email: 1, communityId: 1 }, { unique: true, sparse: true });
// Index for email lookups (for login, finding by email)
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
