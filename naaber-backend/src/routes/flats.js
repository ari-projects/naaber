const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { isPresident, belongsToCommunity } = require('../middleware/roleCheck');
const Flat = require('../models/Flat');
const User = require('../models/User');
const Community = require('../models/Community');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const ChatMessage = require('../models/ChatMessage');

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

// @route   GET /api/communities/:communityId/flats
// @desc    Get all flats in community
// @access  Private
router.get('/communities/:communityId/flats', protect, belongsToCommunity, async (req, res) => {
  try {
    const flats = await Flat.find({ communityId: req.params.communityId })
      .sort({ number: 1 });

    // Get members for each flat
    const flatsWithMembers = await Promise.all(
      flats.map(async (flat) => {
        const members = await User.find({
          flatId: flat._id,
          role: { $in: ['member', 'pending'] }
        }).select('name surname email role');

        return {
          id: flat._id,
          number: flat.number,
          members: members.map(m => ({
            id: m._id,
            name: m.name,
            surname: m.surname,
            email: m.email,
            role: m.role
          })),
          createdAt: flat.createdAt
        };
      })
    );

    res.json({
      success: true,
      flats: flatsWithMembers
    });
  } catch (error) {
    console.error('Get flats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/flats
// @desc    Create new flat
// @access  Private (President)
router.post('/communities/:communityId/flats', protect, isPresident, [
  body('number').notEmpty().withMessage('Flat number is required'),
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

    const { number } = req.body;

    // Check for duplicate
    const existing = await Flat.findOne({
      communityId: community._id,
      number
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Flat with this number already exists'
      });
    }

    const flat = await Flat.create({
      number,
      communityId: community._id
    });

    res.status(201).json({
      success: true,
      flat: {
        id: flat._id,
        number: flat.number,
        members: []
      }
    });
  } catch (error) {
    console.error('Create flat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/flats/bulk
// @desc    Create multiple flats at once
// @access  Private (President)
router.post('/communities/:communityId/flats/bulk', protect, isPresident, [
  body('flats').isArray({ min: 1 }).withMessage('At least one flat is required'),
  body('flats.*.number').notEmpty().withMessage('Flat number is required'),
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

    const { flats } = req.body;

    // Create flats, skipping duplicates
    const results = [];
    const errors = [];

    for (const flatData of flats) {
      try {
        const flat = await Flat.create({
          number: flatData.number,
          communityId: community._id
        });
        results.push({
          id: flat._id,
          number: flat.number
        });
      } catch (err) {
        if (err.code === 11000) {
          errors.push(`Flat ${flatData.number} already exists`);
        } else {
          errors.push(`Failed to create flat ${flatData.number}`);
        }
      }
    }

    res.status(201).json({
      success: true,
      created: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create flats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/flats/:id
// @desc    Update flat
// @access  Private (President)
router.put('/:id', protect, isPresident, [
  body('number').optional().notEmpty().withMessage('Flat number cannot be empty'),
  validate
], async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    // Verify president owns the community
    const community = await Community.findOne({
      _id: flat.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { number } = req.body;

    if (number && number !== flat.number) {
      // Check for duplicate
      const existing = await Flat.findOne({
        communityId: flat.communityId,
        number,
        _id: { $ne: flat._id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Flat with this number already exists'
        });
      }

      flat.number = number;
      await flat.save();
    }

    res.json({
      success: true,
      flat: {
        id: flat._id,
        number: flat.number
      }
    });
  } catch (error) {
    console.error('Update flat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/communities/:communityId/flats/updates-count
// @desc    Get count of flats with updates since last visit
// @access  Private (President)
router.get('/communities/:communityId/flats/updates-count', protect, isPresident, async (req, res) => {
  try {
    const communityId = req.params.communityId;
    
    // Verify president owns this community
    const community = await Community.findOne({
      _id: communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Get user's last visit time for flats page
    const user = await User.findById(req.user._id);
    const lastVisit = user.lastFlatsVisit?.get(communityId) || new Date(0);

    // Get all flats in community
    const flats = await Flat.find({ communityId });
    
    // Count flats with updates since last visit
    let flatsWithUpdates = 0;
    
    for (const flat of flats) {
      // Check for maintenance requests created/updated after last visit
      const hasMaintenanceUpdates = await MaintenanceRequest.exists({
        flatId: flat._id,
        updatedAt: { $gt: lastVisit }
      });

      if (hasMaintenanceUpdates) {
        flatsWithUpdates++;
        continue;
      }

      // Check for new chat messages from this flat after last visit
      const hasChatUpdates = await ChatMessage.exists({
        communityId,
        flatId: flat._id,
        createdAt: { $gt: lastVisit }
      });

      if (hasChatUpdates) {
        flatsWithUpdates++;
      }
    }

    res.json({
      success: true,
      count: flatsWithUpdates
    });
  } catch (error) {
    console.error('Get flats updates count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/flats/mark-visited
// @desc    Mark flats page as visited
// @access  Private (President)
router.post('/communities/:communityId/flats/mark-visited', protect, isPresident, async (req, res) => {
  try {
    const communityId = req.params.communityId;
    
    // Update user's last visit time for flats page
    await User.findByIdAndUpdate(req.user._id, {
      [`lastFlatsVisit.${communityId}`]: new Date()
    });

    res.json({
      success: true,
      message: 'Flats page marked as visited'
    });
  } catch (error) {
    console.error('Mark flats visited error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/flats/:id
// @desc    Delete flat
// @access  Private (President)
router.delete('/:id', protect, isPresident, async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    // Verify president owns the community
    const community = await Community.findOne({
      _id: flat.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if flat has members
    const membersCount = await User.countDocuments({ flatId: flat._id });
    if (membersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete flat with members. Remove members first.'
      });
    }

    await flat.deleteOne();

    res.json({
      success: true,
      message: 'Flat deleted'
    });
  } catch (error) {
    console.error('Delete flat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
