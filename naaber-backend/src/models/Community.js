const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Community address is required'],
    trim: true
  },
  presidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'President is required']
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
communitySchema.index({ presidentId: 1 });

// Virtual for getting flats count
communitySchema.virtual('flats', {
  ref: 'Flat',
  localField: '_id',
  foreignField: 'communityId'
});

// Virtual for getting members count
communitySchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'communityId'
});

communitySchema.set('toJSON', { virtuals: true });
communitySchema.set('toObject', { virtuals: true });

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
