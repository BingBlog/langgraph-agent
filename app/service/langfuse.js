'use strict';

const { Service } = require('egg');
const { Langfuse } = require('langfuse');

class LangfuseService extends Service {
  /**
   * Initialize Langfuse client
   */
  get client() {
    const { app } = this;
    const { secretKey, publicKey, baseUrl } = app.config.langfuse;
    
    if (!this._client) {
      this._client = new Langfuse({
        secretKey,
        publicKey,
        baseUrl,
      });
    }
    
    return this._client;
  }
  
  /**
   * Create a new trace
   * @param {Object} options - Trace options
   * @return {Object} Trace object
   */
  createTrace(options) {
    const { name, userId, input } = options;
    return this.client.trace({
      name,
      userId: userId || 'anonymous',
      input,
    });
  }
  
  /**
   * Create a span within a trace
   * @param {Object} trace - Parent trace
   * @param {Object} options - Span options
   * @return {Object} Span object
   */
  createSpan(trace, options) {
    const { name, input, parentSpanId } = options;
    return trace.span({
      name,
      input,
      parentSpanId,
    });
  }
  
  /**
   * Record a generation (LLM call)
   * @param {Object} trace - Parent trace
   * @param {Object} options - Generation options
   * @return {Object} Generation object
   */
  trackGeneration(trace, options) {
    const { name, model, modelParams, prompt, completion, parentSpanId } = options;
    return trace.generation({
      name,
      model: model || 'unknown',
      modelParameters: modelParams || {},
      prompt,
      completion,
      parentSpanId,
    });
  }
  
  /**
   * Record an error
   * @param {Object} options - Error options
   */
  recordError(options) {
    const { name, input, error } = options;
    // 在新版本的Langfuse API中，没有直接的error方法
    // 使用trace来记录错误
    const errorTrace = this.createTrace({
      name: `Error: ${name}`,
      input,
    });
    
    const errorSpan = this.createSpan(errorTrace, {
      name: 'Error Details',
      input: {
        error: typeof error === 'string' ? error : (error?.message || 'Unknown error'),
        stack: error?.stack
      }
    });
    
    errorSpan.end({
      output: { success: false }
    });
    
    return errorTrace;
  }
}

module.exports = LangfuseService; 