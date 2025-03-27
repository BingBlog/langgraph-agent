import { config } from "dotenv";
import { TriviaSearchTool } from "./tools/trivia.js";

// Load environment variables
config();

// Create test function
async function testTriviaSearch() {
  try {
    console.log("Initializing Trivia search tool...");
    const triviaSearchTool = new TriviaSearchTool();
    
    // Test query
    const testQuery = "人工智能在数据分析领域应用现状 2024年最新报告";
    
    console.log(`Testing search with query: "${testQuery}"`);
    
    // Execute search
    const result = await triviaSearchTool._call(testQuery);
    
    // Parse and display results in a structured manner
    try {
      const parsedResult = JSON.parse(result);
      console.log("Search succeeded!");
      console.log("Results count:", parsedResult.results?.length || 0);
      console.log("First result:", parsedResult.results?.[0] || "No results");
    } catch (parseError) {
      console.log("Raw result:", result);
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
console.log("Starting Trivia search test...");
testTriviaSearch()
  .then(() => console.log("Test completed."))
  .catch(err => console.error("Unhandled error:", err)); 