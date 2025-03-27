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

      // Use basic search directly since it works reliably
      try {
        console.log(`Performing Trivia search with query: ${input}`);
        
        // Use basic search with minimal parameters that are known to work
        const data = await client.search(input);
        
        console.log('Trivia search successful');
        return JSON.stringify(data);
      } catch (error: any) {
        console.error(`Search error: ${error}`);
        // Return a structured fallback result
        return JSON.stringify({
          results: [{ 
            title: "Search Failed", 
            content: `Could not retrieve search results. Error: ${error.message || 'Unknown error'}`,
            score: 1.0 
          }]
        });
      }
    } catch (error: any) {
      console.error(`Error searching TRIVIA: ${error}`);
      return JSON.stringify({
        results: [{ 
          title: "API Error", 
          content: `Failed to initialize search: ${error.message || error}`,
          score: 1.0 
        }]
      });
    }
  }
} 