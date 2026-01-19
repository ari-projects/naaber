// Check if user has one of the allowed roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check if user is president
const isPresident = (req, res, next) => {
  if (!req.user || req.user.role !== 'president') {
    return res.status(403).json({
      success: false,
      message: 'Only presidents can perform this action'
    });
  }
  next();
};

// Check if user is member or president
const isMember = (req, res, next) => {
  if (!req.user || !['member', 'president'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only community members can perform this action'
    });
  }
  next();
};

// Check if user belongs to the specified community
const belongsToCommunity = async (req, res, next) => {
  const communityId = req.params.communityId || req.params.id || req.body.communityId;

  if (!communityId) {
    return res.status(400).json({
      success: false,
      message: 'Community ID is required'
    });
  }

  // Presidents can access any of their communities
  if (req.user.role === 'president') {
    const Community = require('../models/Community');
    const community = await Community.findOne({
      _id: communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this community'
      });
    }

    req.community = community;
    return next();
  }

  // Members can only access their own community
  if (req.user.communityId?.toString() !== communityId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this community'
    });
  }

  next();
};

module.exports = {
  requireRole,
  isPresident,
  isMember,
  belongsToCommunity
};
