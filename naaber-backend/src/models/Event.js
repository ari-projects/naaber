const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
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
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for faster queries
eventSchema.index({ communityId: 1, date: 1 });

// Method to check if user is attending
eventSchema.methods.isAttending = function(userId) {
  return this.attendees.some(attendee => attendee.toString() === userId.toString());
};

// Method to toggle attendance
eventSchema.methods.toggleAttendance = function(userId) {
  const index = this.attendees.findIndex(
    attendee => attendee.toString() === userId.toString()
  );

  if (index === -1) {
    this.attendees.push(userId);
    return true; // Now attending
  } else {
    this.attendees.splice(index, 1);
    return false; // No longer attending
  }
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
