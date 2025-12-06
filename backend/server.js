const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import security middleware
const {
  apiLimiter,
  mongoSanitizer,
  hppProtection,
  securityHeaders,
  sanitizeInput
} = require('./middleware/security');

const {
  cookieParser,
  conditionalCsrfProtection,
  csrfErrorHandler,
  getCsrfToken
} = require('./middleware/csrf');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const hashtagRoutes = require('./routes/hashtags');
const storyRoutes = require('./routes/stories');
const messageRoutes = require('./routes/messages');
const collaborationRoutes = require('./routes/collaborations');
const commentRoutes = require('./routes/comments');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8001;

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
const userSockets = new Map(); // Map userId to socket.id

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Register user
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  // Join post room for comment updates
  socket.on('join_post_room', (postId) => {
    socket.join(`post_${postId}`);
    console.log(`Socket ${socket.id} joined post room post_${postId}`);
  });

  // Leave post room
  socket.on('leave_post_room', (postId) => {
    socket.leave(`post_${postId}`);
    console.log(`Socket ${socket.id} left post room post_${postId}`);
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, userId, username }) => {
    socket.to(conversationId).emit('user_typing', { userId, username });
  });

  // Stop typing indicator
  socket.on('stop_typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user_stop_typing', { userId });
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Remove user from map
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);
app.set('userSockets', userSockets);

// ===== SECURITY MIDDLEWARE =====

// Helmet - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Cloudinary uploads
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Custom security headers
app.use(securityHeaders);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (required for CSRF)
app.use(cookieParser);

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGINS || '*';
app.use(cors({
  origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token']
}));

// MongoDB injection prevention
app.use(mongoSanitizer);

// HTTP Parameter Pollution prevention
app.use(hppProtection);

// Input sanitization
app.use(sanitizeInput);

// API rate limiting (applies to all routes)
app.use('/api', apiLimiter);

// CSRF Protection (applies to state-changing requests)
app.use(conditionalCsrfProtection);

// MongoDB Connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/socialvibe';
mongoose.connect(mongoUrl)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/comments', commentRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// CSRF error handler (must come before general error handler)
app.use(csrfErrorHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.statusCode || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💬 WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});
