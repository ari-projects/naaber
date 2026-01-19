require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/database');
const { initializeTransporter } = require('./config/email');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeSocket } = require('./services/socketService');

// Route imports
const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/communities');
const flatRoutes = require('./routes/flats');
const memberRoutes = require('./routes/members');
const announcementRoutes = require('./routes/announcements');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/messages');
const maintenanceRoutes = require('./routes/maintenance');
const documentRoutes = require('./routes/documents');
const paymentRoutes = require('./routes/payments');
const eventRoutes = require('./routes/events');

const app = express();

// Connect to database
connectDB();

// Initialize email transporter
initializeTransporter();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api', flatRoutes); // Handles /api/communities/:id/flats and /api/flats/:id
app.use('/api', memberRoutes); // Handles /api/communities/:id/members, /api/communities/:id/pending-members, and /api/members/:id
app.use('/api', announcementRoutes); // Handles /api/communities/:id/announcements and /api/announcements/:id
app.use('/api', chatRoutes); // Handles /api/communities/:id/chat
app.use('/api/messages', messageRoutes);
app.use('/api', maintenanceRoutes); // Handles /api/communities/:id/maintenance and /api/maintenance/:id
app.use('/api', documentRoutes); // Handles /api/communities/:id/documents and /api/documents/:id
app.use('/api', paymentRoutes); // Handles /api/communities/:id/payments and /api/payments/:id
app.use('/api', eventRoutes); // Handles /api/communities/:id/events and /api/events/:id

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };
