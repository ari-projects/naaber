const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { generateToken } = require('../config/auth');
const { protect } = require('../middleware/auth');
const { sendTemplatedEmail } = require('../services/emailService');
const User = require('../models/User');
const Community = require('../models/Community');
const Flat = require('../models/Flat');
const { emitToCommunity, EVENTS } = require('../services/socketService');

// Validation middleware
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

// @route   POST /api/auth/register
// @desc    Register president with community
// @access  Public
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('surname').notEmpty().withMessage('Surname is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('communityName').notEmpty().withMessage('Community name is required'),
  body('communityAddress').notEmpty().withMessage('Community address is required'),
  validate
], async (req, res) => {
  try {
    const { email, password, name, surname, phone, communityName, communityAddress, language } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create president user
    const user = await User.create({
      email,
      password,
      name,
      surname,
      phone,
      role: 'president',
      language: language || 'ru',
      confirmedAt: new Date()
    });

    // Create community
    const community = await Community.create({
      name: communityName,
      address: communityAddress,
      presidentId: user._id
    });

    // Update user with community reference
    user.communityId = community._id;
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        language: user.language
      },
      community: {
        id: community._id,
        name: community.name,
        address: community.address
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/register-member
// @desc    Register member (requires flat selection, pending approval)
// @access  Public
router.post('/register-member', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('surname').notEmpty().withMessage('Surname is required'),
  body('flatId').notEmpty().withMessage('Flat selection is required'),
  validate
], async (req, res) => {
  try {
    const { email, password, name, surname, phone, flatId, language } = req.body;

    // Check if flat exists
    const flat = await Flat.findById(flatId).populate('communityId');
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: 'Flat not found'
      });
    }

    // Check if user already exists in this specific community
    const existingUserInCommunity = await User.findOne({ 
      email, 
      communityId: flat.communityId._id 
    });
    
    if (existingUserInCommunity) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered in this community',
        code: 'ALREADY_IN_COMMUNITY'
      });
    }
    
    // User may exist in other communities - that's fine, we create a new account for this community

    // Create pending member
    const user = await User.create({
      email,
      password,
      name,
      surname,
      phone,
      role: 'pending',
      flatId: flat._id,
      communityId: flat.communityId._id,
      language: language || 'ru'
    });

    // Emit real-time event for pending member registration
    emitToCommunity(flat.communityId._id.toString(), EVENTS.MEMBER_PENDING, {
      userId: user._id,
      name: `${user.name} ${user.surname}`,
      flatNumber: flat.number,
      createdAt: user.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Please wait for president approval.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        flat: flat.number,
        community: flat.communityId.name
      }
    });
  } catch (error) {
    console.error('Register member error:', error);
    
    // Handle duplicate key error (email + communityId)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered in this community',
        code: 'ALREADY_IN_COMMUNITY'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { email, password, communityId } = req.body;

    // Find all users with this email
    let users = await User.find({ email }).select('+password');
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials'
      });
    }

    // If communityId provided, filter to that community
    if (communityId) {
      users = users.filter(u => u.communityId?.toString() === communityId);
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials for this community'
        });
      }
    }

    // If multiple accounts, filter out pending/rejected and prefer active ones
    let user = users.find(u => u.role === 'president' || u.role === 'member');
    if (!user) {
      user = users[0]; // Fall back to first (might be pending)
    }

    // Check if pending
    if (user.role === 'pending') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_PENDING',
        message: 'Your account is pending approval'
      });
    }

    // Check if rejected
    if (user.role === 'rejected') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_REJECTED',
        message: 'Your account has been rejected'
      });
    }

    // Check if disabled
    if (user.isDisabled) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DISABLED',
        message: 'Your account has been disabled'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials'
      });
    }

    // Check if user has multiple active communities
    const activeCommunities = await User.find({ 
      email, 
      role: { $in: ['president', 'member'] } 
    }).populate('communityId', 'name address');

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        language: user.language,
        communityId: user.communityId,
        flatId: user.flatId
      },
      // Include list of all communities if user has multiple
      communities: activeCommunities.length > 1 ? activeCommunities.map(u => ({
        userId: u._id,
        communityId: u.communityId?._id,
        communityName: u.communityId?.name,
        communityAddress: u.communityId?.address,
        role: u.role
      })) : undefined
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('communityId', 'name address')
      .populate('flatId', 'number');

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        role: user.role,
        language: user.language,
        community: user.communityId,
        flat: user.flatId
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user
// @access  Private
router.put('/me', protect, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('surname').optional().notEmpty().withMessage('Surname cannot be empty'),
  validate
], async (req, res) => {
  try {
    const { name, surname, phone, language } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, surname, phone, language },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        role: user.role,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  validate
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendTemplatedEmail(user.email, 'resetPassword', user.name, resetUrl);

    res.json({
      success: true,
      message: 'If an account exists, a reset email has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
