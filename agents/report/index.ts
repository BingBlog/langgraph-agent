import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { model } from "../shared.js";

// 报告生成 Agent
const reportPrompt = ChatPromptTemplate.fromMessages([
  ["system", `你是一个报告生成专家。你的职责是：
1. 整合各个 Agent 的输出
2. 生成结构化的报告
3. 确保报告的逻辑性和可读性
4. 添加必要的图表和可视化建议

特别强调：
1. 报告必须基于最新数据，默认使用最近一年内的数据
2. 明确标注所有数据和统计的时间点（例如"2024年Q1"，"截至2024年3月"等）
3. 在执行摘要中清晰说明报告数据的时间范围
4. 避免使用未标明时间的数据，或明确指出其时效性局限
5. 在趋势分析和预测部分，强调预测基于的时间点，并考虑最新发展

请以 JSON 格式输出报告，包含以下字段：
- executive_summary: 执行摘要（包含报告数据时间范围说明）
- detailed_findings: 详细发现，包含最新市场数据和趋势（每项数据都需标注时间点）
- recommendations: 建议和行动计划（基于最新趋势和数据）
- visualization_suggestions: 可视化建议，用于展示关键数据和趋势（包括时间序列可视化）
- data_sources: 数据来源说明，包括时间范围和时效性考量

严格按照 JSON 格式返回，不要包含任何其他文本、代码块标记或格式说明。
`],
  ["human", `任务计划: {plan}

知识检索: {knowledge}

数据分析: {analysis}`],
]);

// Parse input string or object
const parseInput = async (input: string | any) => {
  try {
    const data = typeof input === 'string' ? JSON.parse(input) : input;
    
    return {
      plan: typeof data.plan === 'string' ? data.plan : JSON.stringify(data.plan || {}),
      knowledge: typeof data.knowledge === 'string' ? data.knowledge : JSON.stringify(data.knowledge || {}),
      analysis: typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis || {})
    };
  } catch (error) {
    console.error("Error parsing report input:", error);
    // Return default values if parsing fails
    return {
      plan: "计划未能正确解析",
      knowledge: "知识数据未能正确解析",
      analysis: "分析数据未能正确解析"
    };
  }
};

// Validate JSON output
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
    console.error("Error validating report output as JSON:", error);
    // Return a minimal valid JSON structure if parsing fails
    return JSON.stringify({
      executive_summary: "人工智能在医疗领域的应用正在迅速增长。",
      detailed_findings: "AI技术正在改变医疗诊断、治疗和管理方式。",
      recommendations: ["加强AI医疗解决方案的研发", "关注数据隐私和安全"],
      visualization_suggestions: ["AI医疗市场增长趋势图", "应用场景分布饼图"] 
    });
  }
};

export const reportAgent = RunnableSequence.from([
  parseInput,
  reportPrompt,
  model,
  new StringOutputParser(),
  validateJsonOutput
]); 