require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { toNodeHandler } = require("better-auth/node");
const { auth } = require('./utils/auth');
const logger = require('./config/logger');
const { helmet, generalLimiter } = require('./middleware/security');

// Routes
const betterAuthRoutes = require('./routes/better-auth'); // Better-auth authentication routes

// Swagger documentation
const { specs, swaggerUi } = require('./config/swagger');

const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet);
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Better Auth handler - MUST be before express.json() middleware
app.all("/api/auth/*", toNodeHandler(auth));

// Body parsing middleware (after Better Auth handler)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// COMMENTÉ - Clerk middleware for authentication (applies to all routes)
// app.use(clerkMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Routes
app.use('/api/auth', betterAuthRoutes); // Better-auth authentication routes

// Swagger documentation routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SGM Backend API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// JSON specification endpoint for programmatic access
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Basic info route
app.get('/api', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    name: 'SGM Backend API',
    version: '1.0.0',
    description: 'API for Association des Gabonais du Congo - Member Management System',
    authors: ['Elvis Destin OLEMBE', 'Mondésir NTSOUMOU'],
    documentation: {
      swagger_ui: `${baseUrl}/api-docs`,
      openapi_json: `${baseUrl}/api-docs.json`,
      postman_collection: 'Available in /postman folder'
    },
    endpoints: {
      auth_signin: '/api/auth/signin (POST) - User authentication',
      auth_signout: '/api/auth/signout (POST) - User logout'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    type: 'not_found_error',
    message: 'Route non trouvée',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    context: 'route_resolution',
    path: req.originalUrl,
    method: req.method,
    suggestions: [
      'Vérifiez l\'URL et la méthode HTTP',
      'Consultez la documentation API à /api',
      'Vérifiez que l\'endpoint existe et est correctement orthographié'
    ],
    available_endpoints: {
      info: 'GET /api',
      auth_signin: 'POST /api/auth/signin',
      auth_signout: 'POST /api/auth/signout'
    }
  });
});

// Global error handler
const ErrorHandler = require('./utils/errorHandler');

app.use((error, req, res, next) => {
  const context = {
    operation: `${req.method} ${req.path}`,
    user_id: req.utilisateur?.id || req.user?.id || 'anonymous',
    request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  return ErrorHandler.handleError(error, res, context);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;