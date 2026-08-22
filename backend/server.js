// server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/database');
const localMlService = require('./services/localMlService');
const { ensureDemoData } = require('./scripts/seedDemoData');

// Initialize Express app
const app = express();
app.disable('x-powered-by');

const databaseReady = connectDB();
const demoDataReady = process.env.VERCEL
  ? databaseReady.then(() => ensureDemoData())
  : Promise.resolve();

// Get configuration from environment variables
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
const NODE_ENV = process.env.NODE_ENV || 'development';

const toHttpsOrigin = (hostname) => hostname ? `https://${hostname}` : null;

const isLocalOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

// CORS configuration using environment variables
const deploymentOrigins = [
  FRONTEND_URL,
  toHttpsOrigin(process.env.VERCEL_URL),
  toHttpsOrigin(process.env.VERCEL_BRANCH_URL),
  toHttpsOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
].filter(Boolean);

const corsOrigins = [...new Set(NODE_ENV === 'production'
  ? deploymentOrigins
  : [...deploymentOrigins, 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (NODE_ENV !== 'production' && (isLocalOrigin(origin) || corsOrigins.includes(origin))) {
      return callback(null, true);
    }

    if (NODE_ENV === 'production' && corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(async (_req, res, next) => {
  try {
    await Promise.all([databaseReady, demoDataReady]);
    next();
  } catch (_error) {
    res.status(503).json({ success: false, message: 'Database is temporarily unavailable' });
  }
});

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});

// Load routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes error:', error.message);
}

try {
  const careTipsRoutes = require('./routes/careTips');
  app.use('/api/care-tips', careTipsRoutes);
  console.log('✅ Care tips routes loaded');
} catch (error) {
  console.error('❌ Care tips routes error:', error.message);
}

try {
  const forumRoutes = require('./routes/forum');
  app.use('/api/forum', forumRoutes);
  console.log('✅ Forum routes loaded');
} catch (error) {
  console.error('❌ Forum routes error:', error.message);
}

try {
  const marketplaceRoutes = require('./routes/marketplace');
  app.use('/api/marketplace', marketplaceRoutes);
  console.log('✅ Marketplace routes loaded');
} catch (error) {
  console.error('❌ Marketplace routes error:', error.message);
}

try {
  const chatbotRoutes = require('./routes/chatbot');
  app.use('/api/chatbot', chatbotRoutes);
  console.log('✅ Chatbot routes loaded');
} catch (error) {
  console.error('❌ Chatbot routes error:', error.message);
}

try {
  const scannerRoutes = require('./routes/scanner');
  app.use('/api/scanner', scannerRoutes);
  console.log('✅ Scanner routes loaded');
} catch (error) {
  console.error('❌ Scanner routes error:', error.message);
}

try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Admin routes error:', error.message);
}

// Add static file serving for uploaded images
app.use('/uploads', express.static('uploads'));

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is working!',
    timestamp: new Date(),
    origin: req.get('Origin')
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

let server = null;

if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`🌱 AgriSathi Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${NODE_ENV}`);
    console.log('🌐 CORS enabled for:');
    corsOrigins.forEach(origin => console.log(`   - ${origin}`));
    console.log('📋 Available endpoints:');
    console.log(`   - GET  http://localhost:${PORT}/test`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   - GET  http://localhost:${PORT}/api/auth/me`);
    console.log(`   - GET  http://localhost:${PORT}/api/forum/questions`);
    console.log(`   - POST http://localhost:${PORT}/api/forum/questions`);
    console.log(`   - GET  http://localhost:${PORT}/api/marketplace/products`);
    console.log(`   - GET  http://localhost:${PORT}/api/care-tips`);
    console.log(`   - POST http://localhost:${PORT}/api/chatbot/chat`);
    console.log('\n🚀 Server ready for requests!');
  });

  localMlService.start();
}

const shutdown = () => {
  localMlService.stop();
  if (server) server.close(() => process.exit(0));
};

if (!process.env.VERCEL) {
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

module.exports = app;
