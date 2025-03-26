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
export const triviaTool = new TriviaSearchTool();

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