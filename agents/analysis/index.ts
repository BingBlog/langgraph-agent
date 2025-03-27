import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { model, triviaTool } from "../shared.js";

// Types for data structures
interface AnalysisInput {
  knowledge: any;
  [key: string]: any;
}

interface KnowledgeResult {
  title?: string;
  query?: string;
  [key: string]: any;
}

interface AnalysisOutput {
  data_summary: string;
  analysis_results: {
    market_size: string;
    growth_rate: string;
    key_trends: string[];
  };
  insights: string[];
  data_limitations?: string;
}

/**
 * Extracts JSON from text, handling various input formats including markdown code blocks
 */
function extractJSON(input: any): string {
  // Handle non-string inputs
  if (typeof input !== 'string') {
    if (input === null || input === undefined) {
      return '';
    }
    
    if (typeof input === 'object') {
      try {
        return JSON.stringify(input);
      } catch {
        return '';
      }
    }
    
    return String(input || '');
  }

  // Extract JSON from markdown code blocks if present
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = input.match(jsonRegex);
  
  return match && match[1] ? match[1].trim() : input;
}

/**
 * Fallback analysis output when JSON parsing fails
 */
function getDefaultAnalysisOutput(): AnalysisOutput {
  return {
    data_summary: "Analysis of AI in data analysis applications",
    analysis_results: {
      market_size: "Growing market with significant potential",
      growth_rate: "Rapid growth expected in coming years",
      key_trends: ["Automated data processing", "Pattern recognition", "Predictive analytics"]
    },
    insights: ["AI is transforming data analysis workflows", "Future applications will focus on automated insights generation"],
    data_limitations: "Limited current data available"
  };
}

/**
 * Process input data and extract knowledge
 */
function processKnowledgeData(input: AnalysisInput): any {
  try {
    if (typeof input.knowledge === 'object') {
      return input.knowledge;
    }
    
    const jsonStr = extractJSON(input.knowledge);
    return JSON.parse(jsonStr);
  } catch (error) {
    // If parsing fails, extract key terms from text
    const knowledgeText = typeof input.knowledge === 'string' 
      ? input.knowledge 
      : extractJSON(input.knowledge);
      
    const searchTerms = knowledgeText
      .replace(/```.*?```/gs, "")
      .split(/\s+/)
      .filter((term: string) => term.length > 3)
      .slice(0, 5)
      .join(" ");
    
    return { 
      results: [{ title: searchTerms || "AI data analysis applications" }]
    };
  }
}

/**
 * Extract key terms for search from knowledge data
 */
function extractKeyTerms(knowledgeData: any): string {
  try {
    if (!knowledgeData.results) {
      return "AI data analysis applications";
    }
    
    const terms = knowledgeData.results
      .map((result: KnowledgeResult) => result.title || result.query || "")
      .join(" ")
      .trim();
      
    return terms || "AI data analysis applications";
  } catch {
    return "AI data analysis applications";
  }
}

/**
 * Validate and format JSON output
 */
function formatJsonOutput(text: unknown): string {
  try {
    const stringText = typeof text === 'string' ? text : String(text || '');
    const jsonStr = extractJSON(stringText);
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed);
  } catch {
    return JSON.stringify(getDefaultAnalysisOutput());
  }
}

// Data analysis prompt template
const analysisPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a data analysis expert. Your responsibilities include:
1. Receiving knowledge retrieval results
2. Using TRIVIA tool to obtain supplementary data
3. Performing data cleaning and preprocessing
4. Conducting in-depth data analysis
5. Generating comprehensive analysis reports

Important: Ensure your analysis is based on the latest data from the past year, emphasizing data timeliness. If you detect outdated data, explicitly note this in your analysis and seek more current data sources.

In your data processing, please:
1. Prioritize data from 2023 onwards
2. Annotate all data points with timestamps, e.g., "Q1 2024 data shows..."
3. Clearly state the time range of data sources when making predictions and trend analyses
4. Avoid using outdated reports and analyses, especially in rapidly evolving tech fields

Please output your analysis results in JSON format with the following fields:
- data_summary: Data overview (including data collection time range)
- analysis_results: Analysis results, including market size, growth rate, and key trends (with timestamps)
- insights: Key findings and future development predictions (clearly indicating baseline time for predictions)
- data_limitations: Data limitation notes (including timeliness issues)

Return strictly in JSON format without any other text, code block markers, or formatting instructions.`],
  ["human", `Knowledge data: {knowledge}
  
Supplementary data: {supplementaryData}`],
]);

// Create data analysis agent search and integration chain
const analysisSearchChain = RunnableSequence.from([
  async (input: any): Promise<AnalysisInput> => {
    // Normalize input
    if (typeof input !== 'object' || !input) {
      input = { knowledge: 'No knowledge data provided' };
    }
    
    // Convert entire input to knowledge if knowledge field is missing
    if (!('knowledge' in input) && typeof input === 'object') {
      input = { knowledge: input };
    }
    
    // Process knowledge data
    const knowledgeData = processKnowledgeData(input);
    
    // Extract key search terms
    const keyTerms = extractKeyTerms(knowledgeData);
    
    // Fetch supplementary data
    let supplementaryData;
    try {
      supplementaryData = await triviaTool._call(keyTerms);
    } catch {
      supplementaryData = JSON.stringify({
        results: [
          { title: "AI in data analysis market growth", content: "The AI in data analysis market is growing rapidly." }
        ]
      });
    }
    
    // Prepare final input for the prompt
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
  formatJsonOutput
]);

export const analysisAgent = analysisSearchChain; 