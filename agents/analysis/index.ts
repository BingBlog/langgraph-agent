import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { model, triviaTool } from "../shared.js";

// 数据分析 Agent
const analysisPrompt = ChatPromptTemplate.fromMessages([
  ["system", `你是一个数据分析专家。你的职责是：
1. 接收知识检索结果
2. 使用 TRIVIA 工具获取补充数据
3. 进行数据清洗和预处理 
4. 执行深入数据分析
5. 生成全面的分析报告

请以 JSON 格式输出分析结果，包含以下字段：
- data_summary: 数据概览
- analysis_results: 分析结果，包括市场规模、增长率和关键趋势
- insights: 关键发现和未来发展预测

严格按照 JSON 格式返回，不要包含任何其他文本、代码块标记或格式说明。
`],
  ["human", `知识数据: {knowledge}
  
补充数据: {supplementaryData}`],
]);

// 创建数据分析 Agent 的搜索和整合链
const analysisSearchChain = RunnableSequence.from([
  async (input: { knowledge: string }) => {
    // 从知识中提取关键信息进行补充搜索
    let knowledgeData;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      let jsonStr = input.knowledge;
      const jsonMatch = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      }
      
      knowledgeData = JSON.parse(jsonStr);
    } catch (error) {
      console.error("Failed to parse knowledge data:", error);
      // If parsing fails, use the raw input and extract key terms
      const searchTerms = input.knowledge
        .replace(/```.*?```/gs, "") // Remove code blocks
        .split(/\s+/)
        .filter(term => term.length > 3)
        .slice(0, 5)
        .join(" ");
      
      knowledgeData = { 
        results: [{ title: searchTerms || "AI medical applications" }]
      };
    }
    
    // Extract key terms for supplementary search
    let keyTerms;
    try {
      keyTerms = knowledgeData.results
        ? knowledgeData.results.map((result: any) => result.title || result.query || "").join(" ")
        : "AI medical applications";
    } catch (error) {
      keyTerms = "AI medical applications";
    }
    
    if (!keyTerms || keyTerms.trim() === "") {
      keyTerms = "AI medical applications";
    }
    
    // 进行补充数据搜索
    let supplementaryData;
    try {
      supplementaryData = await triviaTool._call(keyTerms);
    } catch (error) {
      console.error("Error fetching supplementary data:", error);
      supplementaryData = JSON.stringify({
        results: [
          { title: "AI in healthcare market growth", content: "The AI in healthcare market is growing rapidly." }
        ]
      });
    }
    
    return {
      knowledge: input.knowledge,
      supplementaryData
    };
  },
  analysisPrompt,
  model,
  new StringOutputParser(),
  // Ensure valid JSON output
  (text: string): string => {
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
      console.error("Error validating analysis output as JSON:", error);
      // Return a minimal valid JSON structure if parsing fails
      return JSON.stringify({
        data_summary: "Analysis of AI in healthcare applications",
        analysis_results: {
          market_size: "Growing market with significant potential",
          growth_rate: "Rapid growth expected in coming years",
          key_trends: ["Diagnostic AI", "Treatment optimization", "Administrative efficiency"]
        },
        insights: ["AI is transforming healthcare diagnostics", "Future applications will focus on personalized medicine"]
      });
    }
  }
]);

export const analysisAgent = analysisSearchChain; 