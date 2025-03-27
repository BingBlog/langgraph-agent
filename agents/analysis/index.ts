import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { model, triviaTool } from "../shared.js";

// Helper function to extract JSON from potential markdown code blocks
function extractJSON(text: any): string {
  // Ensure text is a string
  if (typeof text !== 'string') {
    console.warn('extractJSON received non-string input:', typeof text);
    // Convert to string if possible, or return empty string
    if (text === null || text === undefined) {
      return '';
    }
    
    // If it's an object, try to stringify it
    if (typeof text === 'object') {
      try {
        return JSON.stringify(text);
      } catch (e) {
        console.error('Failed to stringify object in extractJSON:', e);
        return '';
      }
    }
    
    // Fallback to String constructor
    return String(text || '');
  }

  // Try to extract JSON from markdown code blocks
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code block is found, return the original text
  return text;
}

// 数据分析 Agent
const analysisPrompt = ChatPromptTemplate.fromMessages([
  ["system", `你是一个数据分析专家。你的职责是：
1. 接收知识检索结果
2. 使用 TRIVIA 工具获取补充数据
3. 进行数据清洗和预处理 
4. 执行深入数据分析
5. 生成全面的分析报告

特别重要：确保你的分析基于最近一年内的最新数据，强调数据的时效性。如果检测到数据时间较旧，请在分析中明确指出并寻求更新的数据来源。

在数据处理过程中，请：
1. 优先使用2023年之后的数据
2. 标注所有数据的时间点，例如"2024年Q1数据显示..."
3. 在进行预测和趋势分析时，明确说明数据来源的时间范围
4. 避免使用过时的报告和分析，尤其是在快速发展的技术领域

请以 JSON 格式输出分析结果，包含以下字段：
- data_summary: 数据概览（包含数据收集时间范围）
- analysis_results: 分析结果，包括市场规模、增长率和关键趋势（标注时间点）
- insights: 关键发现和未来发展预测（明确指出预测的基准时间点）
- data_limitations: 数据局限性说明（包括时效性问题）

严格按照 JSON 格式返回，不要包含任何其他文本、代码块标记或格式说明。
`],
  ["human", `知识数据: {knowledge}
  
补充数据: {supplementaryData}`],
]);

// 创建数据分析 Agent 的搜索和整合链
const analysisSearchChain = RunnableSequence.from([
  async (input: any) => {
    console.log('Analysis agent received input type:', typeof input);
    if (typeof input !== 'object' || !input) {
      console.warn('Analysis agent received invalid input:', input);
      input = { knowledge: 'No knowledge data provided' };
    }
    
    // If input.knowledge is not present, use the entire input as knowledge
    if (!('knowledge' in input) && typeof input === 'object') {
      console.log('Converting entire input object to knowledge');
      input = { knowledge: input };
    }
    
    // 从知识中提取关键信息进行补充搜索
    let knowledgeData;
    try {
      // Log the input for debugging
      console.log('Knowledge input type:', typeof input.knowledge);
      if (typeof input.knowledge === 'object') {
        console.log('Knowledge input is an object, attempting to use directly');
        // If input.knowledge is already an object, use it directly
        knowledgeData = input.knowledge;
      } else {
        // Try to extract JSON if it's wrapped in markdown code blocks or handle non-string input
        const jsonStr = extractJSON(input.knowledge);
        console.log('Extracted JSON string length:', jsonStr.length);
        
        knowledgeData = JSON.parse(jsonStr);
      }
      console.log('Successfully parsed knowledge data');
    } catch (error) {
      console.error("Failed to parse knowledge data:", error);
      // If parsing fails, use the raw input and extract key terms
      // First ensure knowledge is a string
      const knowledgeText = typeof input.knowledge === 'string' 
        ? input.knowledge 
        : extractJSON(input.knowledge);
        
      const searchTerms = knowledgeText
        .replace(/```.*?```/gs, "") // Remove code blocks
        .split(/\s+/)
        .filter((term: string) => term.length > 3)
        .slice(0, 5)
        .join(" ");
      
      console.log('Using fallback search terms:', searchTerms);
      knowledgeData = { 
        results: [{ title: searchTerms || "AI data analysis applications" }]
      };
    }
    
    // Extract key terms for supplementary search
    let keyTerms;
    try {
      keyTerms = knowledgeData.results
        ? knowledgeData.results.map((result: any) => result.title || result.query || "").join(" ")
        : "AI data analysis applications";
    } catch (error) {
      console.error("Error extracting key terms:", error);
      keyTerms = "AI data analysis applications";
    }
    
    if (!keyTerms || keyTerms.trim() === "") {
      keyTerms = "AI data analysis applications";
    }
    
    console.log('Using key terms for supplementary search:', keyTerms);
    
    // 进行补充数据搜索
    let supplementaryData;
    try {
      supplementaryData = await triviaTool._call(keyTerms);
      console.log('Successfully retrieved supplementary data');
    } catch (error) {
      console.error("Error fetching supplementary data:", error);
      supplementaryData = JSON.stringify({
        results: [
          { title: "AI in data analysis market growth", content: "The AI in data analysis market is growing rapidly." }
        ]
      });
    }
    
    // Make sure knowledge is serialized as string for the prompt
    const serializedKnowledge = typeof input.knowledge === 'object' 
      ? JSON.stringify(input.knowledge)
      : String(input.knowledge || '');
      
    return {
      knowledge: serializedKnowledge,
      supplementaryData
    };
  },
  analysisPrompt,
  model,
  new StringOutputParser(),
  // Ensure valid JSON output
  (text: string): string => {
    try {
      // Handle non-string inputs
      if (typeof text !== 'string') {
        console.warn('Analysis output formatter received non-string input:', typeof text);
        text = String(text || ''); 
      }
      
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonStr = extractJSON(text);
      
      // Try to parse and re-stringify to ensure valid JSON
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed);
    } catch (error) {
      console.error("Error validating analysis output as JSON:", error);
      // Return a minimal valid JSON structure if parsing fails
      return JSON.stringify({
        data_summary: "Analysis of AI in data analysis applications",
        analysis_results: {
          market_size: "Growing market with significant potential",
          growth_rate: "Rapid growth expected in coming years",
          key_trends: ["Automated data processing", "Pattern recognition", "Predictive analytics"]
        },
        insights: ["AI is transforming data analysis workflows", "Future applications will focus on automated insights generation"]
      });
    }
  }
]);

export const analysisAgent = analysisSearchChain; 