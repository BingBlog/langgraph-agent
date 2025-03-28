'use strict';

const { Service } = require('egg');
const multiAgentWorkflow = require('../../workflow-egg.js');

class WorkflowService extends Service {
  /**
   * Run the multi-agent workflow
   * @param {String} query - User query
   * @param {Object} trace - Langfuse trace object
   * @return {Object} Workflow result
   */
  async run(query, trace) {
    const { ctx, service } = this;
    
    try {
      // Create a span for the workflow execution
      const workflowSpan = service.langfuse.createSpan(trace, {
        name: 'Multi-Agent Workflow Execution',
        input: { query }
      });
      
      try {
        // Run the workflow with the trace in the state
        const result = await multiAgentWorkflow.run(query);
        
        // End the span with success
        workflowSpan.end({
          output: {
            success: true,
            reportLength: result.report ? result.report.length : 0
          }
        });
        
        return {
          success: true,
          data: result,
          traceId: trace.id
        };
      } catch (error) {
        // End the span with error
        workflowSpan.end({
          output: {
            success: false,
            error: error.message || 'Unknown error'
          }
        });
        
        // Re-throw the error to be handled by the controller
        throw error;
      }
    } catch (error) {
      this.logger.error('Workflow execution failed:', error);
      
      // Record error in Langfuse
      service.langfuse.recordError({
        name: 'Workflow Error',
        input: { query },
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Format the workflow result for response
   * @param {Object} result - Workflow execution result
   * @return {Object} Formatted result
   */
  formatResult(result) {
    try {
      const { plan, knowledge, analysis, report } = result.data;
      
      // Parse the report JSON string
      let reportObj = {};
      try {
        reportObj = typeof report === 'string' ? JSON.parse(report) : report;
      } catch (e) {
        this.logger.error('Failed to parse report as JSON:', e);
        reportObj = { error: 'Failed to parse report' };
      }
      
      return {
        success: true,
        traceId: result.traceId,
        report: reportObj,
        metadata: {
          plan: plan ? (typeof plan === 'string' ? plan.substring(0, 200) + '...' : plan) : null,
          knowledge: knowledge ? (typeof knowledge === 'string' ? knowledge.substring(0, 200) + '...' : knowledge) : null,
          analysis: analysis ? (typeof analysis === 'string' ? analysis.substring(0, 200) + '...' : analysis) : null,
        }
      };
    } catch (error) {
      this.logger.error('Error formatting workflow result:', error);
      return {
        success: false,
        error: 'Error formatting workflow result',
      };
    }
  }
}

module.exports = WorkflowService; 