const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const Community = require('../models/Community');

// @route   GET /api/payments/summary
// @desc    Get payment summary for dashboard (pending/overdue counts)
// @access  Private
router.get('/payments/summary', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'member') {
      if (!req.user.flatId) {
        return res.json({
          success: true,
          pendingCount: 0,
          overdueCount: 0,
          totalPending: 0
        });
      }
      query.flatId = req.user.flatId;

      // Update overdue payments first
      if (req.user.communityId) {
        await Payment.updateOverduePayments(req.user.communityId);
      }
    } else if (req.user.role === 'president') {
      // Get all communities owned by this president
      const communities = await Community.find({ presidentId: req.user._id });
      const communityIds = communities.map(c => c._id);
      query.communityId = { $in: communityIds };

      // Update overdue payments for all communities
      for (const communityId of communityIds) {
        await Payment.updateOverduePayments(communityId);
      }
    }

    const [pendingPayments, overduePayments] = await Promise.all([
      Payment.find({ ...query, status: 'pending' }),
      Payment.find({ ...query, status: 'overdue' })
    ]);

    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0) +
                         overduePayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length,
      totalPending
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/communities/:communityId/payments
// @desc    Get all payments for a community
// @access  Private
router.get('/communities/:communityId/payments', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { status, flatId } = req.query;

    // Check access
    let hasAccess = false;
    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;
    } else {
      hasAccess = req.user.communityId?.toString() === communityId;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update overdue payments
    await Payment.updateOverduePayments(communityId);

    const query = { communityId };
    if (status && status !== 'all') {
      query.status = status;
    }
    // Members can only see their own payments
    if (req.user.role === 'member') {
      query.flatId = req.user.flatId;
    } else if (flatId) {
      query.flatId = flatId;
    }

    const payments = await Payment.find(query)
      .populate('flatId', 'number')
      .populate('paidBy', 'name surname')
      .sort({ dueDate: -1 });

    res.json({
      success: true,
      payments: payments.map(p => ({
        id: p._id,
        amount: p.amount,
        currency: p.currency,
        description: p.description,
        dueDate: p.dueDate,
        status: p.status,
        paidAt: p.paidAt,
        paidBy: p.paidBy,
        flatNumber: p.flatId?.number,
        flat: p.flatId,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/payments
// @desc    Create a new payment (president only)
// @access  Private (President)
router.post('/communities/:communityId/payments', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { flatId, amount, description, dueDate, currency = 'EUR' } = req.body;

    // Verify user is president
    if (req.user.role !== 'president') {
      return res.status(403).json({
        success: false,
        message: 'Only presidents can create payments'
      });
    }

    // Verify president owns this community
    const community = await Community.findOne({
      _id: communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate required fields
    if (!flatId || !amount || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Flat, amount, description, and due date are required'
      });
    }

    // Verify flat exists in this community
    const flat = await Flat.findOne({ _id: flatId, communityId });
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found in this community'
      });
    }

    const payment = await Payment.create({
      communityId,
      flatId,
      amount,
      currency,
      description,
      dueDate: new Date(dueDate)
    });

    await payment.populate('flatId', 'number');

    res.status(201).json({
      success: true,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        dueDate: payment.dueDate,
        status: payment.status,
        flatNumber: payment.flatId?.number,
        flat: payment.flatId,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payments/:id/mark-paid
// @desc    Mark a payment as paid
// @access  Private
router.put('/payments/:id/mark-paid', protect, async (req, res) => {
  try {
    const { invoiceUrl } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check access - president can mark any payment, member only their own
    let hasAccess = false;
    const isPresident = req.user.role === 'president';

    if (isPresident) {
      const community = await Community.findOne({
        _id: payment.communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;
    } else {
      hasAccess = req.user.flatId?.toString() === payment.flatId.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Members must provide invoice URL
    if (!isPresident && !invoiceUrl) {
      return res.status(400).json({
        success: false,
        message: 'Invoice is required'
      });
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.paidBy = req.user._id;
    if (invoiceUrl) {
      payment.invoiceUrl = invoiceUrl;
    }
    await payment.save();

    await payment.populate('flatId', 'number');
    await payment.populate('paidBy', 'name surname');

    res.json({
      success: true,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        dueDate: payment.dueDate,
        status: payment.status,
        paidAt: payment.paidAt,
        paidBy: payment.paidBy,
        invoiceUrl: payment.invoiceUrl,
        flatNumber: payment.flatId?.number,
        flat: payment.flatId
      }
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete a payment (president only)
// @access  Private (President)
router.delete('/payments/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'president') {
      return res.status(403).json({
        success: false,
        message: 'Only presidents can delete payments'
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify president owns this community
    const community = await Community.findOne({
      _id: payment.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await payment.deleteOne();

    res.json({
      success: true,
      message: 'Payment deleted'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
