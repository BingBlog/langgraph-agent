import { ChatOpenAI } from "@langchain/openai";
import { TriviaSearchTool } from "../tools/trivia.js";
import { config } from "dotenv";

config();

// 创建基础 LLM
export const model = new ChatOpenAI({
  modelName: "deepseek-chat",
  temperature: 0,
  openAIApiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com/v1",
  },
});

// 创建 TRIVIA 工具实例
export const triviaTool = {
  _call: async (query: string) => {
    try {
      // Log the attempt
      console.log(`Attempting Trivia search with query: ${query}`);
      
      // Check if API key exists
      if (!process.env.TRIVIA_API_KEY) {
        console.error("Missing TRIVIA_API_KEY environment variable");
        return JSON.stringify({
          results: [{ title: "API Error", content: "Missing API credentials" }]
        });
      }
      
      // Make the actual API call
      const result = await new TriviaSearchTool()._call(query);
      return result;
      
    } catch (error) {
      console.error("Error in Trivia API call:", error);
      return JSON.stringify({
        results: [{ title: "Search Error", content: "Failed to retrieve search results" }]
      });
    }
  }
};

// 定义搜索函数
export const searchFunction = {
  name: "search_knowledge",
  description: "使用 TRIVIA 工具搜索相关知识",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索查询",
      },
      context: {
        type: "string",
        description: "搜索上下文，帮助理解搜索目的",
      }
    },
    required: ["query", "context"]
  },
  function: async (args: { query: string; context: string }) => {
    const result = await triviaTool._call(args.query);
    return result;
  }
}; 