const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const Flat = require('../models/Flat');
const User = require('../models/User');

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

// @route   GET /api/messages/unread/count
// @desc    Get unread message count
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
  try {
    if (!req.user.flatId) {
      return res.json({
        success: true,
        count: 0
      });
    }

    const count = await Message.countDocuments({
      toFlatId: req.user.flatId,
      read: false
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

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user's flat
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    if (!req.user.flatId) {
      return res.status(400).json({
        success: false,
        message: 'You are not assigned to a flat'
      });
    }

    // Get all unique conversations
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { fromFlatId: req.user.flatId },
            { toFlatId: req.user.flatId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$fromFlatId', req.user.flatId] },
              '$toFlatId',
              '$fromFlatId'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Get flat details and unread counts
    const conversations = await Promise.all(
      messages.map(async (conv) => {
        const otherFlat = await Flat.findById(conv._id);
        const unreadCount = await Message.countDocuments({
          fromFlatId: conv._id,
          toFlatId: req.user.flatId,
          read: false
        });

        // Get the sender's name from the last message
        const lastMessageUser = await User.findById(conv.lastMessage.fromUserId)
          .select('name surname');

        return {
          flatId: conv._id,
          flatNumber: otherFlat?.number || 'Unknown',
          lastMessage: {
            content: conv.lastMessage.content,
            senderName: lastMessageUser ? `${lastMessageUser.name} ${lastMessageUser.surname}` : 'Unknown',
            isFromMe: conv.lastMessage.fromFlatId.toString() === req.user.flatId.toString(),
            createdAt: conv.lastMessage.createdAt
          },
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/messages/:flatId
// @desc    Get conversation with specific flat
// @access  Private
router.get('/:flatId', protect, async (req, res) => {
  try {
    if (!req.user.flatId) {
      return res.status(400).json({
        success: false,
        message: 'You are not assigned to a flat'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const otherFlat = await Flat.findById(req.params.flatId);
    if (!otherFlat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    // Check if same community
    const myFlat = await Flat.findById(req.user.flatId);
    if (otherFlat.communityId.toString() !== myFlat.communityId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot message flats in other communities'
      });
    }

    const [messages, total] = await Promise.all([
      Message.find({
        $or: [
          { fromFlatId: req.user.flatId, toFlatId: req.params.flatId },
          { fromFlatId: req.params.flatId, toFlatId: req.user.flatId }
        ]
      })
        .populate('fromUserId', 'name surname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({
        $or: [
          { fromFlatId: req.user.flatId, toFlatId: req.params.flatId },
          { fromFlatId: req.params.flatId, toFlatId: req.user.flatId }
        ]
      })
    ]);

    // Mark unread messages as read
    await Message.updateMany(
      {
        fromFlatId: req.params.flatId,
        toFlatId: req.user.flatId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    // Reverse to get chronological order
    const orderedMessages = messages.reverse();

    res.json({
      success: true,
      flat: {
        id: otherFlat._id,
        number: otherFlat.number
      },
      messages: orderedMessages.map(m => ({
        id: m._id,
        content: m.content,
        sender: {
          id: m.fromUserId._id,
          name: m.fromUserId.name,
          surname: m.fromUserId.surname
        },
        isFromMe: m.fromFlatId.toString() === req.user.flatId.toString(),
        read: m.read,
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
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/messages
// @desc    Send message to flat
// @access  Private
router.post('/', protect, [
  body('toFlatId').notEmpty().withMessage('Recipient flat is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  validate
], async (req, res) => {
  try {
    if (!req.user.flatId) {
      return res.status(400).json({
        success: false,
        message: 'You are not assigned to a flat'
      });
    }

    const { toFlatId, content } = req.body;

    const toFlat = await Flat.findById(toFlatId);
    if (!toFlat) {
      return res.status(404).json({
        success: false,
        message: 'Recipient flat not found'
      });
    }

    // Check if same community
    const myFlat = await Flat.findById(req.user.flatId);
    if (toFlat.communityId.toString() !== myFlat.communityId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot message flats in other communities'
      });
    }

    // Cannot message yourself
    if (toFlatId === req.user.flatId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to your own flat'
      });
    }

    const message = await Message.create({
      communityId: myFlat.communityId,
      fromFlatId: req.user.flatId,
      toFlatId,
      fromUserId: req.user._id,
      content
    });

    await message.populate('fromUserId', 'name surname');

    res.status(201).json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        sender: {
          id: message.fromUserId._id,
          name: message.fromUserId.name,
          surname: message.fromUserId.surname
        },
        isFromMe: true,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
