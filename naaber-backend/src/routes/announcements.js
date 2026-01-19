const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { isPresident, belongsToCommunity } = require('../middleware/roleCheck');
const { sendTemplatedEmail } = require('../services/emailService');
const Announcement = require('../models/Announcement');
const Comment = require('../models/Comment');
const Community = require('../models/Community');
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

// @route   GET /api/communities/:communityId/announcements
// @desc    Get all announcements
// @access  Private
router.get('/communities/:communityId/announcements', protect, belongsToCommunity, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      Announcement.find({ communityId: req.params.communityId })
        .populate('authorId', 'name surname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments({ communityId: req.params.communityId })
    ]);

    // Get comment counts
    const announcementsWithComments = await Promise.all(
      announcements.map(async (announcement) => {
        const commentCount = await Comment.countDocuments({
          announcementId: announcement._id
        });

        const result = {
          id: announcement._id,
          title: announcement.title,
          content: announcement.content,
          type: announcement.type,
          author: {
            id: announcement.authorId._id,
            name: announcement.authorId.name,
            surname: announcement.authorId.surname
          },
          commentCount,
          createdAt: announcement.createdAt,
          updatedAt: announcement.updatedAt
        };

        // Add vote info if it's a vote type
        if (announcement.type === 'vote') {
          result.voteOptions = announcement.getVoteResults();
          result.voteDeadline = announcement.voteDeadline;
          result.hasVoted = announcement.hasUserVoted(req.user._id);
        }

        return result;
      })
    );

    res.json({
      success: true,
      announcements: announcementsWithComments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/announcements/:id
// @desc    Get single announcement with comments
// @access  Private
router.get('/announcements/:id', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('authorId', 'name surname');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check access
    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: announcement.communityId,
        presidentId: req.user._id
      });
      if (!community) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.communityId?.toString() !== announcement.communityId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get comments
    const comments = await Comment.find({ announcementId: announcement._id })
      .populate('authorId', 'name surname')
      .populate('flatId', 'number')
      .sort({ createdAt: 1 });

    const result = {
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      author: {
        id: announcement.authorId._id,
        name: announcement.authorId.name,
        surname: announcement.authorId.surname
      },
      comments: comments.map(c => ({
        id: c._id,
        content: c.content,
        author: {
          id: c.authorId._id,
          name: c.authorId.name,
          surname: c.authorId.surname
        },
        flat: c.flatId ? { number: c.flatId.number } : null,
        createdAt: c.createdAt
      })),
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt
    };

    if (announcement.type === 'vote') {
      result.voteOptions = announcement.getVoteResults();
      result.voteDeadline = announcement.voteDeadline;
      result.hasVoted = announcement.hasUserVoted(req.user._id);
    }

    res.json({
      success: true,
      announcement: result
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/announcements
// @desc    Create announcement
// @access  Private (President)
router.post('/communities/:communityId/announcements', protect, isPresident, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').isIn(['news', 'update', 'vote']).withMessage('Invalid type'),
  validate
], async (req, res) => {
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

    const { title, content, type, voteOptions, voteDeadline, sendEmail } = req.body;

    // Validate vote options if type is vote
    if (type === 'vote') {
      if (!voteOptions || !Array.isArray(voteOptions) || voteOptions.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Vote announcements require at least 2 options'
        });
      }
    }

    const announcement = await Announcement.create({
      communityId: community._id,
      authorId: req.user._id,
      title,
      content,
      type,
      voteOptions: type === 'vote' ? voteOptions.map(opt => ({ text: opt, votes: [] })) : [],
      voteDeadline: type === 'vote' ? voteDeadline : null,
      sendEmail: sendEmail || false
    });

    // Send email notifications if requested
    if (sendEmail && community.settings.emailNotifications) {
      const members = await User.find({
        communityId: community._id,
        role: 'member'
      }).select('email name');

      // Send emails asynchronously
      for (const member of members) {
        sendTemplatedEmail(
          member.email,
          'newAnnouncement',
          member.name,
          community.name,
          title,
          content,
          req.user.fullName
        ).catch(err => console.error('Failed to send email:', err));
      }

      announcement.emailSentAt = new Date();
      await announcement.save();
    }

    res.status(201).json({
      success: true,
      announcement: {
        id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        voteOptions: type === 'vote' ? announcement.getVoteResults() : undefined,
        voteDeadline: announcement.voteDeadline,
        createdAt: announcement.createdAt
      }
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private (President)
router.put('/announcements/:id', protect, isPresident, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  validate
], async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Verify president owns the community
    const community = await Community.findOne({
      _id: announcement.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { title, content } = req.body;

    if (title) announcement.title = title;
    if (content) announcement.content = content;

    await announcement.save();

    res.json({
      success: true,
      announcement: {
        id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        updatedAt: announcement.updatedAt
      }
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private (President)
router.delete('/announcements/:id', protect, isPresident, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Verify president owns the community
    const community = await Community.findOne({
      _id: announcement.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete comments
    await Comment.deleteMany({ announcementId: announcement._id });

    await announcement.deleteOne();

    res.json({
      success: true,
      message: 'Announcement deleted'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/announcements/:id/vote
// @desc    Cast vote on announcement
// @access  Private
router.post('/announcements/:id/vote', protect, [
  body('optionId').notEmpty().withMessage('Option ID is required'),
  validate
], async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (announcement.type !== 'vote') {
      return res.status(400).json({
        success: false,
        message: 'This announcement is not a vote'
      });
    }

    // Check if voting is still open
    if (announcement.voteDeadline && new Date() > announcement.voteDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Voting has ended'
      });
    }

    // Check access
    let hasAccess = false;
    if (req.user.role === 'president') {
      const Community = require('../models/Community');
      const community = await Community.findOne({
        _id: announcement.communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;
    } else {
      hasAccess = req.user.communityId?.toString() === announcement.communityId.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already voted
    if (announcement.hasUserVoted(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted'
      });
    }

    const { optionId } = req.body;

    // Find the option and add vote
    const option = announcement.voteOptions.id(optionId);
    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Vote option not found'
      });
    }

    option.votes.push(req.user._id);
    await announcement.save();

    res.json({
      success: true,
      message: 'Vote recorded',
      voteResults: announcement.getVoteResults()
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/announcements/:id/comments
// @desc    Add comment to announcement
// @access  Private
router.post('/announcements/:id/comments', protect, [
  body('content').notEmpty().withMessage('Comment content is required'),
  validate
], async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check access
    let hasAccess = false;
    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: announcement.communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;
    } else {
      hasAccess = req.user.communityId?.toString() === announcement.communityId.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content } = req.body;

    const comment = await Comment.create({
      announcementId: announcement._id,
      authorId: req.user._id,
      flatId: req.user.flatId,
      content
    });

    await comment.populate('authorId', 'name surname');
    await comment.populate('flatId', 'number');

    res.status(201).json({
      success: true,
      comment: {
        id: comment._id,
        content: comment.content,
        author: {
          id: comment.authorId._id,
          name: comment.authorId.name,
          surname: comment.authorId.surname
        },
        flat: comment.flatId ? { number: comment.flatId.number } : null,
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
