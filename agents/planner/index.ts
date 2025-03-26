import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { model } from "../shared.js";

// 任务规划 Agent
const plannerPrompt = ChatPromptTemplate.fromMessages([
  ["system", `你是一个任务规划专家。你的职责是：
1. 分析用户的需求
2. 将需求分解为具体的子任务
3. 为每个子任务分配合适的执行者
4. 确定任务的执行顺序

请以 JSON 格式输出任务计划，包含以下字段：
- tasks: 任务列表，每个任务包含 id, type, description, dependencies
- execution_order: 任务执行顺序

严格按照 JSON 格式返回，不要包含任何其他文本、代码块标记(\`\`\`)或格式说明。
`],
  ["human", "{input}"],
]);

// Create a post-processor to ensure valid JSON output
const validateJsonOutput = (text: string): string => {
  try {
    // Try to extract JSON if it's wrapped in markdown code blocks
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed);
  } catch (error) {
    console.error("Error validating planner output as JSON:", error);
    // Return a minimal valid JSON structure if parsing fails
    return JSON.stringify({
      tasks: [
        {
          id: "task_1",
          type: "research",
          description: "Research the topic from the user query",
          dependencies: []
        }
      ],
      execution_order: ["task_1"]
    });
  }
};

export const plannerAgent = RunnableSequence.from([
  plannerPrompt,
  model,
  new StringOutputParser(),
  validateJsonOutput
]); 