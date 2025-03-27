import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { model, searchFunction } from "../shared.js";

// Helper function to extract JSON from potential markdown code blocks
function extractJSON(text: any): string {
  // Ensure text is a string
  if (typeof text !== 'string') {
    console.warn('extractJSON received non-string input:', typeof text);
    // Convert to string if possible, or return empty string
    text = String(text || '');
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

// 知识检索 Agent
const knowledgePrompt = ChatPromptTemplate.fromMessages([
  ["system", `你是一个知识检索专家。你的职责是：
1. 理解任务计划
2. 分析每个任务需要搜索的知识类型
3. 使用搜索函数获取相关知识
4. 整理和总结检索到的信息
5. 提供结构化的知识输出

极其重要：确保获取最近一年内的最新数据和报道，以保证信息的时效性。你必须非常严格地关注数据的发布时间，优先选择2024年发布的数据源。

你可以使用 search_knowledge 函数来搜索知识。对于每个任务，你应该：
1. 分析任务描述，确定需要搜索的关键信息
2. 构建合适的搜索查询，必须在每个查询中加入年份、"最新"、"2024"、"recent"等时间限定词
3. 提供搜索上下文，帮助理解搜索目的
4. 整合搜索结果，确保信息的完整性、相关性和时效性
5. 核实数据来源和发布时间，优先使用最新的信息
6. 明确标识每个信息的发布时间，如"根据2024年3月的报告..."
7. 如果检索结果包含过时信息，明确标注并寻找更新的替代来源

搜索查询策略：
- 对于中文查询，必须添加"2024"或"最新"词语，如"人工智能技术 2024年3月"
- 对于英文查询，必须添加"2024"、"latest"或"recent"词语，如"AI technology March 2024"
- 避免使用一般性或时间不明确的查询
- 使用精确的时间描述，如"2024年Q1"、"2024年3月"，而不是笼统的"2023-2024"
- 多使用"报告"、"数据"、"统计"等词语，以获取更多具体数据

请以 JSON 格式输出检索结果，包含以下字段：
- query: 搜索查询（必须包含精确的时间限定词）
- results: 检索到的知识列表（必须标注每个结果的发布时间）
- summary: 知识总结，包括最新数据和统计（必须标注每个数据点的具体时间，如"2024年3月数据显示..."）
- recency_assessment: 对检索到信息时效性的评估（例如"所有数据均来自2024年发布的报告"）

重要：请确保输出是有效的 JSON 格式，不要添加任何额外的文本或格式。总是优先使用最新数据，避免过时信息。`],
  ["human", "{plan}"],
]);

// 创建知识检索 Agent 的搜索和整合链
const knowledgeSearchChain = RunnableSequence.from([
  async (input: { plan: string }) => {
    // 从计划中提取任务信息
    let planData;
    try {
      // Try to parse the plan, but handle potential errors gracefully
      planData = JSON.parse(input.plan);
    } catch (error) {
      console.error('Failed to parse plan data:', error);
      // Provide a default structure if parsing fails
      planData = { 
        tasks: [{ 
          id: "default_task",
          description: input.plan 
        }] 
      };
    }
    
    // 使用 LLM 进行搜索策略规划
    const searchStrategyPrompt = ChatPromptTemplate.fromMessages([
      ["system", `分析以下任务，为每个任务生成搜索策略。对于每个任务，你需要：
1. 确定需要搜索的关键信息
2. 构建合适的搜索查询
3. 提供搜索上下文

特别注意：
- 所有搜索查询都必须获取最近一年内的最新数据和报道，特别是2024年的内容
- 每个查询中必须包含时间限定词，强制使用"2024"、"2024年Q1"、"最新"、"recent 2024"等明确的时间标识
- 对于查询英文内容，使用"2024 latest"、"2024 Q1"、"March 2024"等具体的时间标识
- 所有查询都必须明确指定为"最新"、"最近"或具体年份（2023-2024）
- 将每个搜索的主题拆分成多个更具体的查询，每个查询都聚焦于最新数据

请以 JSON 格式输出搜索策略，必须是一个数组，每个元素代表一个任务的搜索策略，包含以下字段：
- task_id: 任务ID
- search_queries: 搜索查询列表（必须是数组），每个查询包含 query 和 context
- time_constraints: 搜索的时间范围要求（必须指定"2024年内"或"最近6个月"等具体时间范围）

示例格式：
[
  {{
    "task_id": "task1",
    "search_queries": [
      {{
        "query": "2024年Q1人工智能最新应用数据",
        "context": "获取2024年第一季度人工智能应用的最新统计数据"
      }},
      {{
        "query": "人工智能市场规模 2024年3月 最新报告",
        "context": "查询2024年3月发布的人工智能市场规模报告"
      }},
      {{
        "query": "AI应用技术突破 2023-2024 最新进展",
        "context": "获取2023年底到2024年初的AI技术重大突破"
      }}
    ],
    "time_constraints": "2024年内的数据，优先获取最近3个月的信息"
  }},
  {{
    "task_id": "task2",
    "search_queries": [
      {{
        "query": "latest AI market trends March 2024 report",
        "context": "获取2024年3月发布的AI市场趋势报告"
      }}
    ],
    "time_constraints": "2024年第一季度的数据"
  }}
]

重要：请确保输出是有效的 JSON 格式，且必须是如上所示的数组结构，不要添加任何额外的文本或格式。每个生成的查询都必须包含明确的时间标识。`],
      ["human", "{tasks}"]
    ]);

    // Format tasks for the search strategy prompt
    const tasksString = JSON.stringify(planData.tasks || []);

    try {
      const searchStrategyMessages = await searchStrategyPrompt.formatMessages({ tasks: tasksString });
      const searchStrategy = await model.invoke(searchStrategyMessages);
      
      let strategyData;
      try {
        // Extract content safely from model response, which could be string or object
        let contentText;
        if (typeof searchStrategy === 'string') {
          contentText = searchStrategy;
        } else if (searchStrategy && typeof searchStrategy === 'object') {
          // Handle AIMessage or similar objects
          contentText = searchStrategy.content ? 
            (typeof searchStrategy.content === 'string' ? 
              searchStrategy.content : 
              JSON.stringify(searchStrategy.content)) :
            JSON.stringify(searchStrategy);
        } else {
          throw new Error(`Unexpected search strategy format: ${typeof searchStrategy}`);
        }

        // Extract and clean JSON from potential markdown formatting
        const cleanedJson = extractJSON(contentText);
        const parsedData = JSON.parse(cleanedJson);
        
        // Ensure strategyData is always an array
        if (Array.isArray(parsedData)) {
          strategyData = parsedData;
        } else if (parsedData && typeof parsedData === 'object') {
          // Handle case where it might be a single object instead of an array
          strategyData = [parsedData];
        } else {
          // Fallback to default if the structure is completely unexpected
          throw new Error('Parsed data has unexpected structure');
        }
      } catch (error) {
        console.error('Failed to parse search strategy:', error);
        // Provide a default strategy if parsing fails
        strategyData = [{
          task_id: "default_task",
          search_queries: [{
            query: input.plan,
            context: "General search for information"
          }]
        }];
      }
      
      // Validate each strategy has the required structure
      strategyData = strategyData.map((strategy: any) => {
        if (!strategy.search_queries || !Array.isArray(strategy.search_queries)) {
          // Fix missing or invalid search_queries
          return {
            task_id: strategy.task_id || "default_task",
            search_queries: [{
              query: input.plan,
              context: "General search for information"
            }]
          };
        }
        return strategy;
      });
      
      // 执行搜索
      const searchResults = await Promise.all(
        strategyData.map(async (strategy: any) => {
          try {
            const results = await Promise.all(
              strategy.search_queries.map(async (query: any) => {
                try {
                  // Validate query before passing to search function
                  const validQuery = {
                    query: typeof query.query === 'string' ? query.query : input.plan,
                    context: typeof query.context === 'string' ? query.context : "General search"
                  };
                  
                  const result = await searchFunction.function(validQuery);
                  return {
                    query: validQuery.query,
                    context: validQuery.context,
                    result
                  };
                } catch (queryError) {
                  console.error('Error in search query execution:', queryError);
                  // Return fallback for failed query
                  return {
                    query: typeof query.query === 'string' ? query.query : input.plan,
                    context: typeof query.context === 'string' ? query.context : "General search",
                    result: "Error retrieving search results"
                  };
                }
              })
            );
            return {
              task_id: strategy.task_id,
              results
            };
          } catch (strategyError) {
            console.error('Error processing strategy:', strategyError);
            // Return fallback for failed strategy
            return {
              task_id: strategy.task_id || "unknown_task",
              results: [{
                query: input.plan,
                context: "General search after error",
                result: "Error processing search strategy"
              }]
            };
          }
        })
      );
      
      // 整合搜索结果
      const combinedInput = {
        plan: input.plan,
        searchResults: JSON.stringify(searchResults)
      };
      
      return combinedInput;
    } catch (error) {
      console.error('Error in search strategy generation:', error);
      // Return minimal valid data if search fails
      return {
        plan: input.plan,
        searchResults: JSON.stringify([])
      };
    }
  },
  knowledgePrompt,
  model,
  // Use custom parser to handle possible code block formatting
  {
    parse: async (text: any) => {
      try {
        // If input is already an object (not a string), return it directly as JSON
        if (typeof text !== 'string' && text !== null && typeof text === 'object') {
          if (text.content) {
            // If it's an AI message object with content property
            return typeof text.content === 'string' 
              ? extractJSON(text.content) 
              : JSON.stringify(text);
          }
          return JSON.stringify(text);
        }
        
        // Try to extract and clean JSON first from string
        const cleaned = extractJSON(text);
        try {
          // If it's valid JSON, return as structured data
          const parsed = JSON.parse(cleaned);
          return JSON.stringify(parsed);
        } catch (e) {
          // If JSON parsing fails, return text as is
          return cleaned;
        }
      } catch (error) {
        console.error('Error in parsing output:', error);
        return text ? String(text) : '';
      }
    }
  }
]);

export const knowledgeAgent = knowledgeSearchChain; 