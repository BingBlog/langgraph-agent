import { Tool } from "@langchain/core/tools";
import { config } from "dotenv";

config();

export class TriviaSearchTool extends Tool {
  name = "trivia_search";
  description = "使用 TRIVIA API 搜索知识库";

  async _call(input: string): Promise<string> {
    try {
      const response = await fetch("https://api.trivia.com/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.TRIVIA_API_KEY}`,
        },
        body: JSON.stringify({
          query: input,
          max_results: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`TRIVIA API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.stringify(data);
    } catch (error) {
      return `Error searching TRIVIA: ${error}`;
    }
  }
} 