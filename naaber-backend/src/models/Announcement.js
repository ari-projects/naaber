const mongoose = require('mongoose');

const voteOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  votes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: true });

const announcementSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  type: {
    type: String,
    enum: ['news', 'update', 'vote'],
    default: 'news'
  },
  voteOptions: [voteOptionSchema],
  voteDeadline: {
    type: Date
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
announcementSchema.index({ communityId: 1, createdAt: -1 });

// Virtual for comments
announcementSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'announcementId'
});

// Method to check if user has voted
announcementSchema.methods.hasUserVoted = function(userId) {
  if (this.type !== 'vote') return false;
  return this.voteOptions.some(option =>
    option.votes.some(vote => vote.toString() === userId.toString())
  );
};

// Method to get vote results
announcementSchema.methods.getVoteResults = function() {
  if (this.type !== 'vote') return null;

  const totalVotes = this.voteOptions.reduce((sum, option) => sum + option.votes.length, 0);

  return this.voteOptions.map(option => ({
    optionId: option._id,
    text: option.text,
    voteCount: option.votes.length,
    percentage: totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0
  }));
};

announcementSchema.set('toJSON', { virtuals: true });
announcementSchema.set('toObject', { virtuals: true });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
