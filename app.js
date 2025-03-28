'use strict';

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  configWillLoad() {
    // Ready to load the configuration
    this.app.logger.info('Egg.js application starting up...');
  }

  async didLoad() {
    // All configurations have loaded
    this.app.logger.info('Application configuration loaded');
  }

  async willReady() {
    // All plugins have started, but application is not yet ready
    this.app.logger.info('Plugins have started, application is warming up');
  }

  async didReady() {
    // Application is ready
    const { app } = this;
    
    app.logger.info('========================================');
    app.logger.info('🚀 Application is ready!');
    app.logger.info(`📝 Using DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No'}`);
    app.logger.info(`📝 Using TRIVIA_API_KEY: ${process.env.TRIVIA_API_KEY ? 'Yes' : 'No'}`);
    app.logger.info(`🔍 API endpoint: http://localhost:${app.config.cluster.listen.port}/api/workflow`);
    app.logger.info(`🩺 Health endpoint: http://localhost:${app.config.cluster.listen.port}/health`);
    app.logger.info('📊 Langfuse dashboard: https://cloud.langfuse.com');
    app.logger.info('========================================');
  }

  async beforeClose() {
    // Application is about to close
    this.app.logger.info('Application is shutting down...');
  }
}

module.exports = AppBootHook; 