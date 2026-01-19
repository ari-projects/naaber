import { io } from 'socket.io-client';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Event types - must match backend
export const EVENTS = {
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

/**
 * Initialize socket connection
 * @param {string} token - JWT auth token
 * @returns {Socket} socket instance
 */
export const initializeSocket = (token) => {
  if (socket?.connected) {
    console.log('Socket already connected:', socket.id);
    return socket;
  }

  // Disconnect existing socket if not connected
  if (socket) {
    socket.disconnect();
  }

  const backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
  console.log('Initializing socket connection to:', backendUrl);
  
  socket = io(backendUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    reconnectAttempts = 0;
    
    // Re-join community if we had one stored
    if (socket._communityId) {
      console.log('Re-joining community:', socket._communityId);
      socket.emit('join-community', socket._communityId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('⚠️ Socket connection error:', error.message);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnect attempts reached, stopping...');
      socket.disconnect();
    }
  });

  return socket;
};

/**
 * Get current socket instance
 * @returns {Socket|null}
 */
export const getSocket = () => socket;

/**
 * Join a community room to receive community-specific events
 * @param {string} communityId 
 */
export const joinCommunity = (communityId) => {
  if (!socket || !communityId) return;
  
  // Store community ID for reconnection
  socket._communityId = communityId;
  
  if (socket.connected) {
    console.log('Joining community room:', communityId);
    socket.emit('join-community', communityId);
  } else {
    // If not connected yet, join when connected
    socket.once('connect', () => {
      console.log('Joining community room after connect:', communityId);
      socket.emit('join-community', communityId);
    });
  }
};

/**
 * Leave a community room
 * @param {string} communityId 
 */
export const leaveCommunity = (communityId) => {
  if (socket?.connected && communityId) {
    console.log('Leaving community room:', communityId);
    socket.emit('leave-community', communityId);
    socket._communityId = null;
  }
};

/**
 * Subscribe to an event
 * @param {string} event - Event name from EVENTS
 * @param {Function} callback - Event handler
 */
export const subscribe = (event, callback) => {
  if (socket) {
    console.log('Subscribing to event:', event);
    socket.on(event, (data) => {
      console.log(`📩 Received event: ${event}`, data);
      callback(data);
    });
  }
};

/**
 * Unsubscribe from an event
 * @param {string} event - Event name
 * @param {Function} callback - Optional specific callback to remove
 */
export const unsubscribe = (event, callback) => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};

/**
 * Disconnect and cleanup socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

/**
 * Check if socket is connected
 * @returns {boolean}
 */
export const isConnected = () => socket?.connected || false;

const socketService = {
  initializeSocket,
  getSocket,
  joinCommunity,
  leaveCommunity,
  subscribe,
  unsubscribe,
  disconnectSocket,
  isConnected,
  EVENTS
};

export default socketService;
