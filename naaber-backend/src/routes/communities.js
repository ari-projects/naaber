const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { isPresident } = require('../middleware/roleCheck');
const Community = require('../models/Community');
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

// @route   GET /api/communities
// @desc    Get all communities for president
// @access  Private (President)
router.get('/', protect, isPresident, async (req, res) => {
  try {
    const communities = await Community.find({ presidentId: req.user._id });

    // Get stats for each community
    const communitiesWithStats = await Promise.all(
      communities.map(async (community) => {
        const [flatsCount, membersCount, pendingCount] = await Promise.all([
          Flat.countDocuments({ communityId: community._id }),
          User.countDocuments({ communityId: community._id, role: 'member' }),
          User.countDocuments({ communityId: community._id, role: 'pending' })
        ]);

        return {
          id: community._id,
          name: community.name,
          address: community.address,
          settings: community.settings,
          stats: {
            flats: flatsCount,
            members: membersCount,
            pending: pendingCount
          },
          createdAt: community.createdAt
        };
      })
    );

    res.json({
      success: true,
      communities: communitiesWithStats
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities
// @desc    Create new community
// @access  Private (President)
router.post('/', protect, isPresident, [
  body('name').notEmpty().withMessage('Community name is required'),
  body('address').notEmpty().withMessage('Community address is required'),
  validate
], async (req, res) => {
  try {
    const { name, address } = req.body;

    const community = await Community.create({
      name,
      address,
      presidentId: req.user._id
    });

    res.status(201).json({
      success: true,
      community: {
        id: community._id,
        name: community.name,
        address: community.address,
        settings: community.settings
      }
    });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/communities/:id
// @desc    Get community details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check access
    if (req.user.role === 'president') {
      if (community.presidentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.communityId?.toString() !== community._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get stats
    const [flatsCount, membersCount, pendingCount] = await Promise.all([
      Flat.countDocuments({ communityId: community._id }),
      User.countDocuments({ communityId: community._id, role: 'member' }),
      User.countDocuments({ communityId: community._id, role: 'pending' })
    ]);

    res.json({
      success: true,
      community: {
        id: community._id,
        name: community.name,
        address: community.address,
        settings: community.settings,
        stats: {
          flats: flatsCount,
          members: membersCount,
          pending: pendingCount
        },
        createdAt: community.createdAt
      }
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/communities/:id
// @desc    Update community
// @access  Private (President)
router.put('/:id', protect, isPresident, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  validate
], async (req, res) => {
  try {
    const community = await Community.findOne({
      _id: req.params.id,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const { name, address, settings } = req.body;

    if (name) community.name = name;
    if (address) community.address = address;
    if (settings) community.settings = { ...community.settings, ...settings };

    await community.save();

    res.json({
      success: true,
      community: {
        id: community._id,
        name: community.name,
        address: community.address,
        settings: community.settings
      }
    });
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/communities/:id
// @desc    Delete community
// @access  Private (President)
router.delete('/:id', protect, isPresident, async (req, res) => {
  try {
    const community = await Community.findOne({
      _id: req.params.id,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Delete all related data
    await Promise.all([
      Flat.deleteMany({ communityId: community._id }),
      User.deleteMany({ communityId: community._id, role: { $ne: 'president' } })
    ]);

    await community.deleteOne();

    res.json({
      success: true,
      message: 'Community deleted'
    });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/communities/public/:id
// @desc    Get public community info (for member registration)
// @access  Public
router.get('/public/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).select('name address');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const flats = await Flat.find({ communityId: community._id }).select('number');

    res.json({
      success: true,
      community: {
        id: community._id,
        name: community.name,
        address: community.address
      },
      flats: flats.map(f => ({ id: f._id, number: f.number }))
    });
  } catch (error) {
    console.error('Get public community error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
