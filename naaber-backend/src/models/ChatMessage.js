const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community is required']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  flatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat'
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
chatMessageSchema.index({ communityId: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
