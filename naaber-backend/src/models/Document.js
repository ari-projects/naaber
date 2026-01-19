const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileSize: {
    type: Number
  },
  fileType: {
    type: String
  },
  category: {
    type: String,
    enum: ['rules', 'minutes', 'contracts', 'other'],
    default: 'other'
  }
}, {
  timestamps: true
});

// Index for faster queries
documentSchema.index({ communityId: 1, category: 1, createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
