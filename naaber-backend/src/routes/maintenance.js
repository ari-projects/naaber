const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, isPresident } = require('../middleware/auth');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Flat = require('../models/Flat');
const Community = require('../models/Community');
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

// @route   GET /api/communities/:communityId/maintenance
// @desc    Get all maintenance requests for a community
// @access  Private
router.get('/communities/:communityId/maintenance', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { status } = req.query;

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

    const query = { communityId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await MaintenanceRequest.find(query)
      .populate('flatId', 'number')
      .populate('authorId', 'name surname')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests.map(r => ({
        id: r._id,
        title: r.title,
        description: r.description,
        status: r.status,
        priority: r.priority,
        flatNumber: r.flatId?.number,
        flat: r.flatId,
        author: r.authorId,
        images: r.images,
        commentsCount: r.comments?.length || 0,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt
      }))
    });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/maintenance
// @desc    Create a new maintenance request
// @access  Private
router.post('/communities/:communityId/maintenance', protect, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  validate
], async (req, res) => {
  try {
    const { communityId } = req.params;
    const { title, description, priority = 'medium', images = [] } = req.body;

    // Check access and get flat
    let flatId;
    let hasAccess = false;

    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;

      // President might not have a flat, use community context
      if (hasAccess && req.user.flatId) {
        flatId = req.user.flatId;
      } else if (hasAccess) {
        // Find or create a "management" flat for president requests
        const flat = await Flat.findOne({ communityId, number: 'Management' });
        if (flat) {
          flatId = flat._id;
        } else {
          // Use the first flat in the community
          const firstFlat = await Flat.findOne({ communityId });
          if (firstFlat) {
            flatId = firstFlat._id;
          }
        }
      }
    } else {
      hasAccess = req.user.communityId?.toString() === communityId;
      flatId = req.user.flatId;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!flatId) {
      return res.status(400).json({
        success: false,
        message: 'You must be assigned to a flat to create maintenance requests'
      });
    }

    const request = await MaintenanceRequest.create({
      communityId,
      flatId,
      authorId: req.user._id,
      title,
      description,
      priority,
      images
    });

    await request.populate('flatId', 'number');
    await request.populate('authorId', 'name surname');

    const requestData = {
      id: request._id,
      title: request.title,
      description: request.description,
      status: request.status,
      priority: request.priority,
      flatNumber: request.flatId?.number,
      flat: request.flatId,
      author: request.authorId,
      images: request.images,
      commentsCount: 0,
      createdAt: request.createdAt
    };

    // Emit real-time event to community
    emitToCommunity(communityId, EVENTS.MAINTENANCE_CREATED, requestData);
    emitToCommunity(communityId, EVENTS.STATS_UPDATED, { type: 'maintenance' });

    res.status(201).json({
      success: true,
      request: requestData
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/maintenance/:id
// @desc    Get a single maintenance request
// @access  Private
router.get('/maintenance/:id', protect, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('flatId', 'number')
      .populate('authorId', 'name surname')
      .populate('comments.authorId', 'name surname');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    // Check access
    let hasAccess = false;
    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: request.communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;
    } else {
      hasAccess = req.user.communityId?.toString() === request.communityId.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      request: {
        id: request._id,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        flatNumber: request.flatId?.number,
        flat: request.flatId,
        author: request.authorId,
        images: request.images,
        comments: request.comments.map(c => ({
          id: c._id,
          content: c.content,
          author: c.authorId,
          createdAt: c.createdAt
        })),
        createdAt: request.createdAt,
        resolvedAt: request.resolvedAt
      }
    });
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance request status (president only)
// @access  Private (President)
router.put('/maintenance/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    // Only president can update status
    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: request.communityId,
        presidentId: req.user._id
      });
      if (!community) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only president can update request status'
      });
    }

    if (status) {
      request.status = status;
      if (status === 'resolved') {
        request.resolvedAt = new Date();
      } else {
        request.resolvedAt = null;
      }
    }

    await request.save();
    await request.populate('flatId', 'number');
    await request.populate('authorId', 'name surname');

    // Emit real-time event for status update
    emitToCommunity(request.communityId.toString(), EVENTS.MAINTENANCE_UPDATED, {
      requestId: request._id,
      status: request.status,
      updatedAt: new Date()
    });
    emitToCommunity(request.communityId.toString(), EVENTS.STATS_UPDATED, { type: 'maintenance_updated' });

    res.json({
      success: true,
      request: {
        id: request._id,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        flatNumber: request.flatId?.number,
        flat: request.flatId,
        author: request.authorId,
        createdAt: request.createdAt,
        resolvedAt: request.resolvedAt
      }
    });
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/maintenance/:id/comments
// @desc    Add a comment to maintenance request
// @access  Private
router.post('/maintenance/:id/comments', protect, [
  body('content').notEmpty().withMessage('Comment content is required'),
  validate
], async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    // Check access
    let hasAccess = false;
    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: request.communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;
    } else {
      hasAccess = req.user.communityId?.toString() === request.communityId.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    request.comments.push({
      authorId: req.user._id,
      content: req.body.content
    });

    await request.save();

    const newComment = request.comments[request.comments.length - 1];
    await MaintenanceRequest.populate(newComment, {
      path: 'authorId',
      select: 'name surname'
    });

    res.status(201).json({
      success: true,
      comment: {
        id: newComment._id,
        content: newComment.content,
        author: newComment.authorId,
        createdAt: newComment.createdAt
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
