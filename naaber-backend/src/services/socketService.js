const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

// Map of communityId -> Set of socket ids
const communityRooms = new Map();

// Map of userId -> socket id
const userSockets = new Map();

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ],
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Store user socket mapping
    userSockets.set(socket.userId, socket.id);

    // Join community room
    socket.on('join-community', (communityId) => {
      socket.join(`community:${communityId}`);
      socket.communityId = communityId;
      
      // Track community membership
      if (!communityRooms.has(communityId)) {
        communityRooms.set(communityId, new Set());
      }
      communityRooms.get(communityId).add(socket.id);
      
      console.log(`User ${socket.userId} joined community ${communityId}`);
    });

    // Leave community room
    socket.on('leave-community', (communityId) => {
      socket.leave(`community:${communityId}`);
      
      if (communityRooms.has(communityId)) {
        communityRooms.get(communityId).delete(socket.id);
      }
      
      console.log(`User ${socket.userId} left community ${communityId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Clean up user socket mapping
      userSockets.delete(socket.userId);
      
      // Clean up community rooms
      if (socket.communityId && communityRooms.has(socket.communityId)) {
        communityRooms.get(socket.communityId).delete(socket.id);
      }
    });
  });

  return io;
};

/**
 * Emit event to all members of a community
 * @param {string} communityId - Community ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToCommunity = (communityId, event, data) => {
  if (io) {
    io.to(`community:${communityId}`).emit(event, data);
  }
};

/**
 * Emit event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  }
};

/**
 * Get the Socket.IO instance
 * @returns {Server} Socket.IO server instance
 */
const getIO = () => io;

// Event types
const EVENTS = {
  // Dashboard stats
  STATS_UPDATED: 'stats:updated',
  
  // Chat
  NEW_MESSAGE: 'chat:new-message',
  
  // Maintenance
  MAINTENANCE_CREATED: 'maintenance:created',
  MAINTENANCE_UPDATED: 'maintenance:updated',
  
  // Members
  MEMBER_PENDING: 'member:pending',
  MEMBER_APPROVED: 'member:approved',
  
  // Announcements
  ANNOUNCEMENT_CREATED: 'announcement:created',
  
  // Events
  EVENT_CREATED: 'event:created',
  
  // Documents
  DOCUMENT_UPLOADED: 'document:uploaded',
  
  // Payments
  PAYMENT_CREATED: 'payment:created',
  PAYMENT_UPDATED: 'payment:updated'
};

module.exports = {
  initializeSocket,
  emitToCommunity,
  emitToUser,
  getIO,
  EVENTS
};
