'use strict';

const { Controller } = require('egg');

class WorkflowController extends Controller {
  /**
   * Run workflow API endpoint
   */
  async run() {
    const { ctx, service } = this;
    const { query } = ctx.request.body;
    
    // Input validation
    if (!query) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Query is required',
      };
      return;
    }
    
    // Retrieve trace from middleware
    const trace = ctx.state.trace;
    
    try {
      ctx.logger.info(`Running workflow for query: ${query}`);
      
      // Run the workflow
      const result = await service.workflow.run(query, trace);
      
      // Format the result
      ctx.body = service.workflow.formatResult(result);
    } catch (error) {
      ctx.logger.error('Workflow API error:', error);
      
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: error.message || 'An error occurred during workflow execution',
        traceId: trace?.id,
      };
    }
  }
  
  /**
   * Health check endpoint
   */
  async health() {
    const { ctx } = this;
    
    ctx.body = {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = WorkflowController; 