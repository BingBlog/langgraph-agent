'use strict';

module.exports = () => {
  return async function langfuseTracing(ctx, next) {
    const { app, request, service } = ctx;
    const startTime = Date.now();
    
    // Create a trace for the request
    let trace;
    
    // Only trace API requests
    if (request.path.startsWith('/api')) {
      const userId = ctx.get('x-user-id') || 'anonymous';
      
      // Create trace with request details
      trace = service.langfuse.createTrace({
        name: `API Request: ${request.method} ${request.path}`,
        userId,
        input: {
          method: request.method,
          path: request.path,
          query: request.query,
          body: request.body,
          headers: {
            'user-agent': ctx.get('user-agent'),
            'x-request-id': ctx.get('x-request-id'),
          }
        },
      });
      
      // Store trace in context for access in controllers
      ctx.state.trace = trace;
    }
    
    try {
      // Process the request
      await next();
      
      // Record trace result on completion if trace exists
      if (trace) {
        const responseTime = Date.now() - startTime;
        const span = service.langfuse.createSpan(trace, {
          name: 'Response',
          input: {
            statusCode: ctx.status,
            responseTime,
            responseSize: ctx.response.length,
          }
        });
        
        span.end({
          output: {
            status: ctx.status,
            responseTime,
          }
        });
      }
    } catch (error) {
      // Record error if trace exists
      if (trace) {
        service.langfuse.recordError({
          name: 'Request Error',
          input: {
            path: request.path,
            method: request.method,
          },
          error,
        });
      }
      throw error;
    }
  };
}; 