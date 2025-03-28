'use strict';

// Mock implementation of multiAgentWorkflow for demonstration
// In a real setup, you would need to properly convert the ESM workflow.ts to CommonJS
const multiAgentWorkflow = {
  async run(input) {
    console.log(`[Mock Workflow] Running workflow with input: ${input}`);

    // Just return mock data for this demonstration
    return {
      plan: JSON.stringify({
        tasks: [
          {
            id: "task_1",
            type: "research",
            description: input,
            dependencies: []
          }
        ],
        execution_order: ["task_1"]
      }),
      knowledge: JSON.stringify({
        results: [{ title: "Demo Knowledge", content: "This is mock knowledge retrieval." }],
        summary: "Knowledge retrieval result."
      }),
      analysis: JSON.stringify({
        data_summary: "Demo Analysis",
        analysis_results: { key_trends: ["Mock trend 1", "Mock trend 2"] },
        insights: ["Mock insight 1"]
      }),
      report: JSON.stringify({
        executive_summary: "这是一份关于" + input + "的演示报告。",
        detailed_findings: "详细发现部分，这里只是演示数据。",
        recommendations: ["建议1", "建议2", "建议3"],
        visualization_suggestions: ["数据可视化建议1", "数据可视化建议2"]
      })
    };
  }
};

module.exports = multiAgentWorkflow; 