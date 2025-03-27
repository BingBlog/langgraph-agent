// Test script for Tavily
import { tavily } from '@tavily/core';

async function testTavily() {
  try {
    const client = tavily({ apiKey: "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" });
    
    // Using the simplest form from the README
    console.log("Simple query test:");
    const result1 = await client.search("Who is Leo Messi?");
    console.log(result1);
    
    // Using what seems to be the object form from the error
    console.log("\nObject query test:");
    const result2 = await client.search({
      query: "Who is Cristiano Ronaldo?",
      max_results: 5
    });
    console.log(result2);
  } catch (error) {
    console.error("Error:", error);
  }
}

testTavily(); 