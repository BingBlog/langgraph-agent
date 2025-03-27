import { plannerAgent, knowledgeAgent, analysisAgent, reportAgent } from "./agents/index.js";
import { StateGraph, START, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";

// 定义工作流状态
const WorkflowState = Annotation.Root({
  input: Annotation<string>(),
  plan: Annotation<string>(),
  knowledge: Annotation<string>(),
  analysis: Annotation<string>(),
  report: Annotation<string>(),
});

// Helper function to handle errors and ensure data is properly JSON stringified
const ensureJSONString = (data: any): string => {
  if (typeof data === 'string') {
    return data;
  }
  
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error stringifying data:", error);
    return JSON.stringify({ error: "Failed to process data" });
  }
};

// 创建工作流图
const workflow = new StateGraph(WorkflowState)
  .addNode("planNode", async (state) => {
    console.log("\nStep 1: Planning...");
    try {
      const result = await plannerAgent.invoke({ input: state.input });
      return { plan: ensureJSONString(result) };
    } catch (error) {
      console.error("Error in planning step:", error);
      // Return a default plan in case of error
      return { 
        plan: JSON.stringify({
          tasks: [
            {
              id: "task_1",
              type: "research",
              description: state.input,
              dependencies: []
            }
          ],
          execution_order: ["task_1"]
        })
      };
    }
  })
  .addNode("knowledgeNode", async (state) => {
    console.log("\nStep 2: Knowledge Retrieval...");
    try {
      const result = await knowledgeAgent.invoke({ plan: state.plan });
      return { knowledge: ensureJSONString(result) };
    } catch (error) {
      console.error("Error in knowledge retrieval step:", error);
      // Return default knowledge in case of error
      return { 
        knowledge: JSON.stringify({
          query: state.input,
          results: [{ title: "Information not available", content: "Could not retrieve information." }],
          summary: "Knowledge retrieval was not successful."
        })
      };
    }
  })
  .addNode("analysisNode", async (state) => {
    console.log("\nStep 3: Analysis...");
    try {
      console.log("Passing knowledge to analysis agent, type:", typeof state.knowledge);
      const result = await analysisAgent.invoke({ knowledge: state.knowledge });
      return { analysis: ensureJSONString(result) };
    } catch (error) {
      console.error("Error in analysis step:", error);
      // Return default analysis in case of error
      return { 
        analysis: JSON.stringify({
          data_summary: "Analysis could not be completed",
          analysis_results: { key_trends: ["No trends available"] },
          insights: ["No insights available"]
        })
      };
    }
  })
  .addNode("reportNode", async (state) => {
    console.log("\nStep 4: Report Generation...");
    try {
      // Pass the individual components as proper inputs
      const result = await reportAgent.invoke({
        plan: state.plan,
        knowledge: state.knowledge,
        analysis: state.analysis
      });
      return { report: ensureJSONString(result) };
    } catch (error) {
      console.error("Error in report generation step:", error);
      // Return default report in case of error
      return { 
        report: JSON.stringify({
          executive_summary: "Report could not be generated due to technical issues.",
          detailed_findings: "No detailed findings available.",
          recommendations: ["Review the input and try again"],
          visualization_suggestions: ["No visualization suggestions available"]
        })
      };
    }
  })
  .addEdge(START, "planNode")
  .addEdge("planNode", "knowledgeNode")
  .addEdge("knowledgeNode", "analysisNode")
  .addEdge("analysisNode", "reportNode")
  .addEdge("reportNode", END);

// 编译工作流
const compiledWorkflow = workflow.compile();

// 导出工作流
export const multiAgentWorkflow = {
  async run(input: string) {
    try {
      const result = await compiledWorkflow.invoke({ input });
      return result;
    } catch (error) {
      console.error("Error in workflow:", error);
      throw error;
    }
  },
}; 