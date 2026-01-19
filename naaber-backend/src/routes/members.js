const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isPresident, belongsToCommunity } = require('../middleware/roleCheck');
const { sendTemplatedEmail } = require('../services/emailService');
const User = require('../models/User');
const Community = require('../models/Community');
const Flat = require('../models/Flat');
const { emitToCommunity, EVENTS } = require('../services/socketService');

// @route   GET /api/communities/:communityId/members
// @desc    Get all members in community
// @access  Private
router.get('/communities/:communityId/members', protect, belongsToCommunity, async (req, res) => {
  try {
    const members = await User.find({
      communityId: req.params.communityId,
      role: 'member' // Only regular members, not president
    })
      .populate('flatId', 'number')
      .select('name surname email phone role flatId createdAt')
      .sort({ name: 1 });

    res.json({
      success: true,
      members: members.map(m => ({
        id: m._id,
        name: m.name,
        surname: m.surname,
        email: m.email,
        phone: m.phone,
        role: m.role,
        flat: m.flatId ? { id: m.flatId._id, number: m.flatId.number } : null,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/communities/:communityId/pending-members
// @desc    Get pending members awaiting approval
// @access  Private (President)
router.get('/communities/:communityId/pending-members', protect, isPresident, async (req, res) => {
  try {
    // Verify president owns this community
    const community = await Community.findOne({
      _id: req.params.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const pendingMembers = await User.find({
      communityId: community._id,
      role: 'pending'
    })
      .populate('flatId', 'number')
      .select('name surname email phone flatId createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pendingMembers: pendingMembers.map(m => ({
        id: m._id,
        name: m.name,
        surname: m.surname,
        email: m.email,
        phone: m.phone,
        flat: m.flatId ? { id: m.flatId._id, number: m.flatId.number } : null,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('Get pending members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/members/:id/approve
// @desc    Approve pending member
// @access  Private (President)
router.post('/members/:id/approve', protect, isPresident, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (member.role !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Member is not in pending status'
      });
    }

    // Verify president owns the community
    const community = await Community.findOne({
      _id: member.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Approve member
    member.role = 'member';
    member.confirmedAt = new Date();
    await member.save();

    // Send notification email
    try {
      await sendTemplatedEmail(
        member.email,
        'memberApproved',
        member.name,
        community.name
      );
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    // Emit real-time event for member approval
    emitToCommunity(member.communityId.toString(), EVENTS.MEMBER_APPROVED, {
      memberId: member._id,
      name: `${member.name} ${member.surname}`,
      approvedAt: member.confirmedAt
    });

    res.json({
      success: true,
      message: 'Member approved',
      member: {
        id: member._id,
        name: member.name,
        surname: member.surname,
        email: member.email,
        role: member.role
      }
    });
  } catch (error) {
    console.error('Approve member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/members/:id/reject
// @desc    Reject pending member
// @access  Private (President)
router.post('/members/:id/reject', protect, isPresident, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (member.role !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Member is not in pending status'
      });
    }

    // Verify president owns the community
    const community = await Community.findOne({
      _id: member.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Send rejection email before deleting
    try {
      await sendTemplatedEmail(
        member.email,
        'memberRejected',
        member.name,
        community.name
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    // Store community ID before deletion
    const communityId = member.communityId.toString();

    // Delete the member
    await member.deleteOne();

    // Emit event to update dashboard stats
    emitToCommunity(communityId, EVENTS.STATS_UPDATED, {
      type: 'member_rejected'
    });

    res.json({
      success: true,
      message: 'Member rejected and removed'
    });
  } catch (error) {
    console.error('Reject member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/members/:id
// @desc    Remove member from community
// @access  Private (President)
router.delete('/members/:id', protect, isPresident, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Cannot remove president
    if (member.role === 'president') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove president'
      });
    }

    // Verify president owns the community
    const community = await Community.findOne({
      _id: member.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await member.deleteOne();

    res.json({
      success: true,
      message: 'Member removed'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
