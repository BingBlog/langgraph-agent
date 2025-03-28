'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  
  // Health check endpoint
  router.get('/health', controller.workflow.health);
  
  // API endpoints
  router.post('/api/workflow', controller.workflow.run);
}; 