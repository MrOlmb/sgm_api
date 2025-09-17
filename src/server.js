const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 SGM Backend server running on http://${HOST}:${PORT}`);
  logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Health check: http://${HOST}:${PORT}/api/health`);
  logger.info(`📖 API info: http://${HOST}:${PORT}/api`);
  
  // Log important configuration
  logger.info('Configuration:', {
    port: PORT,
    host: HOST,
    database: process.env.DATABASE_URL ? 'configured' : 'missing',
    clerk: process.env.CLERK_SECRET_KEY ? 'configured' : 'missing',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'missing',
  });
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);