const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community is required']
  },
  flatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat',
    required: [true, 'Flat is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invoiceUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ communityId: 1, status: 1, dueDate: 1 });
paymentSchema.index({ flatId: 1, status: 1 });

// Method to check if payment is overdue
paymentSchema.methods.checkOverdue = function() {
  if (this.status === 'pending' && new Date() > this.dueDate) {
    this.status = 'overdue';
    return true;
  }
  return false;
};

// Static method to update overdue payments
paymentSchema.statics.updateOverduePayments = async function(communityId) {
  const now = new Date();
  return this.updateMany(
    {
      communityId,
      status: 'pending',
      dueDate: { $lt: now }
    },
    { status: 'overdue' }
  );
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
