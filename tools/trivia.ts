import { Tool } from "@langchain/core/tools";
import { config } from "dotenv";
// Import tavily using dynamic import to avoid TypeScript errors
import('@tavily/core').then(module => {
  tavilyModule = module;
});

let tavilyModule: any = null;

config();

export class TriviaSearchTool extends Tool {
  name = "trivia_search";
  description = "使用 TRIVIA API 搜索知识库";

  async _call(input: string): Promise<string> {
    try {
      // Initialize Tavily client with API key
      const apiKey = process.env.TRIVIA_API_KEY || "";
      if (!apiKey) {
        throw new Error("Missing TRIVIA_API_KEY environment variable");
      }
      
      // Ensure the tavily module is loaded
      if (!tavilyModule) {
        tavilyModule = await import('@tavily/core');
      }
      
      // Use the tavily function without TypeScript checking
      // @ts-ignore
      const client = tavilyModule.tavily({ apiKey });
      
      // Make the search request with simple string query
      // @ts-ignore - Ignore TypeScript issues with the package
      const data = await client.search(input);
      
      console.log('Trivia search result received');
      return JSON.stringify(data);
    } catch (error) {
      console.error(`Error searching TRIVIA: ${error}`);
      return JSON.stringify({
        results: [{ title: "Search Error", content: `Failed to retrieve search results: ${error}` }]
      });
    }
  }
} 