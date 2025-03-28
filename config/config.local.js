'use strict';

const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = () => {
  const config = {};
  
  // Cluster configuration for development
  config.cluster = {
    listen: {
      port: 7001,
    },
  };
  
  // Console logger
  config.logger = {
    consoleLevel: 'DEBUG',
  };
  
  // Turn on development error handling
  config.onerror = {
    all(err, ctx) {
      // Log all errors in development
      ctx.logger.error('Error caught in onerror config:', err);
      
      // Return detailed error in development
      ctx.body = {
        success: false,
        error: err.message,
        stack: err.stack,
      };
      ctx.status = err.status || 500;
    },
  };
  
  return config;
}; 