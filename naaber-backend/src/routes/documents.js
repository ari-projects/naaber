const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Document = require('../models/Document');
const Community = require('../models/Community');

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

// @route   GET /api/communities/:communityId/documents
// @desc    Get all documents for a community
// @access  Private
router.get('/communities/:communityId/documents', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { category } = req.query;

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
    if (category && category !== 'all') {
      query.category = category;
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name surname')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        description: doc.description,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        category: doc.category,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt
      }))
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/communities/:communityId/documents
// @desc    Upload a new document (president only)
// @access  Private (President)
router.post('/communities/:communityId/documents', protect, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { title, description, fileUrl, fileName, fileSize, fileType, category = 'other' } = req.body;

    // Basic validation
    if (!title || !fileUrl || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Title, file URL, and file name are required'
      });
    }

    // Verify user is president of this community
    if (req.user.role !== 'president') {
      return res.status(403).json({
        success: false,
        message: 'Only presidents can upload documents'
      });
    }

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

    const document = await Document.create({
      communityId,
      uploadedBy: req.user._id,
      title,
      description,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      category
    });

    await document.populate('uploadedBy', 'name surname');

    res.status(201).json({
      success: true,
      document: {
        id: document._id,
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        fileType: document.fileType,
        category: document.category,
        uploadedBy: document.uploadedBy,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document (president only)
// @access  Private (President)
router.delete('/documents/:id', protect, async (req, res) => {
  try {
    // Verify user is president
    if (req.user.role !== 'president') {
      return res.status(403).json({
        success: false,
        message: 'Only presidents can delete documents'
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Verify president owns this community
    const community = await Community.findOne({
      _id: document.communityId,
      presidentId: req.user._id
    });

    if (!community) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
