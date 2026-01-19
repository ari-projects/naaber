const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { belongsToCommunity } = require('../middleware/roleCheck');
const ChatMessage = require('../models/ChatMessage');
const Community = require('../models/Community');
const User = require('../models/User');
const { emitToCommunity, EVENTS } = require('../services/socketService');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg
    });
  }
  next();
};

// @route   GET /api/communities/:communityId/chat
// @desc    Get community chat history
// @access  Private
router.get('/communities/:communityId/chat', protect, belongsToCommunity, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessage.find({ communityId: req.params.communityId })
        .populate('authorId', 'name surname role')
        .populate('flatId', 'number')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ChatMessage.countDocuments({ communityId: req.params.communityId })
    ]);

    // Reverse to get chronological order (oldest first in this page)
    const orderedMessages = messages.reverse();

    res.json({
      success: true,
      messages: orderedMessages.map(m => ({
        id: m._id,
        content: m.content,
        author: {
          id: m.authorId._id,
          name: m.authorId.name,
          surname: m.authorId.surname,
          role: m.authorId.role
        },
        flat: m.flatId ? { number: m.flatId.number } : null,
        createdAt: m.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/chat
// @desc    Send message to community chat
// @access  Private
router.post('/communities/:communityId/chat', protect, belongsToCommunity, [
  body('content').notEmpty().withMessage('Message content is required'),
  validate
], async (req, res) => {
  try {
    const { content } = req.body;

    const message = await ChatMessage.create({
      communityId: req.params.communityId,
      authorId: req.user._id,
      flatId: req.user.flatId,
      content
    });

    await message.populate('authorId', 'name surname role');
    await message.populate('flatId', 'number');

    const messageData = {
      id: message._id,
      content: message.content,
      author: {
        id: message.authorId._id,
        name: message.authorId.name,
        surname: message.authorId.surname,
        role: message.authorId.role
      },
      flat: message.flatId ? { number: message.flatId.number } : null,
      createdAt: message.createdAt
    };

    // Emit real-time event to community
    emitToCommunity(req.params.communityId, EVENTS.NEW_MESSAGE, messageData);
    emitToCommunity(req.params.communityId, EVENTS.STATS_UPDATED, { type: 'messages' });

    res.status(201).json({
      success: true,
      message: messageData
    });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/communities/:communityId/chat/unread-count
// @desc    Get count of unread messages since last chat visit
// @access  Private
router.get('/communities/:communityId/chat/unread-count', protect, belongsToCommunity, async (req, res) => {
  try {
    const communityId = req.params.communityId;
    
    // Get user's last visit time for this community chat
    const user = await User.findById(req.user._id);
    const lastVisit = user.lastChatVisit?.get(communityId) || new Date(0);
    
    // Count messages since last visit (excluding own messages)
    const count = await ChatMessage.countDocuments({
      communityId: communityId,
      authorId: { $ne: req.user._id },
      createdAt: { $gt: lastVisit }
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/chat/mark-read
// @desc    Mark chat as read (update last visit time)
// @access  Private
router.post('/communities/:communityId/chat/mark-read', protect, belongsToCommunity, async (req, res) => {
  try {
    const communityId = req.params.communityId;
    
    // Update user's last visit time for this community chat
    await User.findByIdAndUpdate(req.user._id, {
      [`lastChatVisit.${communityId}`]: new Date()
    });

    res.json({
      success: true,
      message: 'Chat marked as read'
    });
  } catch (error) {
    console.error('Mark chat read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/communities/:communityId/chat/since/:timestamp
// @desc    Get new messages since timestamp (for polling)
// @access  Private
router.get('/communities/:communityId/chat/since/:timestamp', protect, belongsToCommunity, async (req, res) => {
  try {
    const since = new Date(parseInt(req.params.timestamp));

    const messages = await ChatMessage.find({
      communityId: req.params.communityId,
      createdAt: { $gt: since }
    })
      .populate('authorId', 'name surname role')
      .populate('flatId', 'number')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      success: true,
      messages: messages.map(m => ({
        id: m._id,
        content: m.content,
        author: {
          id: m.authorId._id,
          name: m.authorId.name,
          surname: m.authorId.surname,
          role: m.authorId.role
        },
        flat: m.flatId ? { number: m.flatId.number } : null,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('Get new chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
