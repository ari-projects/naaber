const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Event = require('../models/Event');
const Community = require('../models/Community');

// @route   GET /api/communities/:communityId/events
// @desc    Get all events for a community
// @access  Private
router.get('/communities/:communityId/events', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { upcoming } = req.query;

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
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name surname')
      .populate('attendees', 'name surname')
      .sort({ date: 1 });

    res.json({
      success: true,
      events: events.map(e => ({
        id: e._id,
        title: e.title,
        description: e.description,
        date: e.date,
        endDate: e.endDate,
        location: e.location,
        createdBy: e.createdBy,
        attendeesCount: e.attendees?.length || 0,
        attendees: e.attendees,
        isAttending: e.attendees?.some(a => a._id.toString() === req.user._id.toString()),
        createdAt: e.createdAt
      }))
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/events
// @desc    Create a new event (president only)
// @access  Private (President)
router.post('/communities/:communityId/events', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { title, description, date, endDate, location } = req.body;

    // Verify user is president
    if (req.user.role !== 'president') {
      return res.status(403).json({
        success: false,
        message: 'Only presidents can create events'
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
    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: 'Title and date are required'
      });
    }

    const event = await Event.create({
      communityId,
      createdBy: req.user._id,
      title,
      description,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      location
    });

    await event.populate('createdBy', 'name surname');

    res.status(201).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        location: event.location,
        createdBy: event.createdBy,
        attendeesCount: 0,
        attendees: [],
        isAttending: false,
        createdAt: event.createdAt
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/events/:id/attend
// @desc    Toggle attendance for an event
// @access  Private
router.post('/events/:id/attend', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check access
    let hasAccess = false;
    if (req.user.role === 'president') {
      const community = await Community.findOne({
        _id: event.communityId,
        presidentId: req.user._id
      });
      hasAccess = !!community;
    } else {
      hasAccess = req.user.communityId?.toString() === event.communityId.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const isNowAttending = event.toggleAttendance(req.user._id);
    await event.save();

    await event.populate('attendees', 'name surname');

    res.json({
      success: true,
      isAttending: isNowAttending,
      attendeesCount: event.attendees.length,
      attendees: event.attendees
    });
  } catch (error) {
    console.error('Toggle attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event (president only)
// @access  Private (President)
router.delete('/events/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'president') {
      return res.status(403).json({
        success: false,
        message: 'Only presidents can delete events'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Verify president owns this community
    const community = await Community.findOne({
      _id: event.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
