import { multiAgentWorkflow } from "./workflow.js";

async function test() {
  try {
    const input = "请分析人工智能在数据分析领域的应用现状和未来发展趋势，并生成一份详细报告。";
    console.log("Input:", input);
    
    const result = await multiAgentWorkflow.run(input);
    
    console.log("\n=== 任务规划 ===");
    console.log(result.plan);
    
    console.log("\n=== 知识检索 ===");
    console.log(result.knowledge);
    
    console.log("\n=== 数据分析 ===");
    console.log(result.analysis);
    
    console.log("\n=== 最终报告 ===");
    console.log(result.report);
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    if (typeof error === "object" && error !== null) {
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
  }
}

test(); 