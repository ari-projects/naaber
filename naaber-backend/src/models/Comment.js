const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  announcementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
    required: [true, 'Announcement is required']
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
    required: [true, 'Comment content is required'],
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
commentSchema.index({ announcementId: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
