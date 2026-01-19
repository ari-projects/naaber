const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Flat number is required'],
    trim: true
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community is required']
  }
}, {
  timestamps: true
});

// Compound index for unique flat number within a community
flatSchema.index({ communityId: 1, number: 1 }, { unique: true });

// Virtual for getting members
flatSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'flatId'
});

flatSchema.set('toJSON', { virtuals: true });
flatSchema.set('toObject', { virtuals: true });

const Flat = mongoose.model('Flat', flatSchema);

module.exports = Flat;
