const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community is required']
  },
  fromFlatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: [true, 'Sender flat is required']
  },
  toFlatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: [true, 'Recipient flat is required']
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ communityId: 1, fromFlatId: 1, toFlatId: 1, createdAt: -1 });
messageSchema.index({ toFlatId: 1, read: 1 });

// Static method to get conversation between two flats
messageSchema.statics.getConversation = async function(flatId1, flatId2, limit = 50) {
  return this.find({
    $or: [
      { fromFlatId: flatId1, toFlatId: flatId2 },
      { fromFlatId: flatId2, toFlatId: flatId1 }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('fromUserId', 'name surname')
  .populate('fromFlatId', 'number')
  .populate('toFlatId', 'number');
};

// Static method to get unread count for a flat
messageSchema.statics.getUnreadCount = async function(flatId) {
  return this.countDocuments({ toFlatId: flatId, read: false });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
