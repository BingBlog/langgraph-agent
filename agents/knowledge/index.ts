import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { model, searchFunction } from "../shared.js";

/**
 * Extracts JSON content from text, handling markdown code blocks
 */
function extractJSON(text: unknown): string {
  // Ensure text is a string
  if (typeof text !== 'string') {
    console.warn('extractJSON received non-string input:', typeof text);
    text = String(text || '');
  }

  // At this point, text is guaranteed to be a string
  const textAsString = text as string;
  
  // Extract JSON from markdown code blocks
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = textAsString.match(jsonRegex);
  
  return match && match[1] ? match[1].trim() : textAsString;
}

/**
 * System prompt for the knowledge agent
 */
const KNOWLEDGE_SYSTEM_PROMPT = `你是一个知识检索专家。你的职责是：
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

重要：请确保输出是有效的 JSON 格式，不要添加任何额外的文本或格式。总是优先使用最新数据，避免过时信息。`;

/**
 * System prompt for search strategy generation
 */
const SEARCH_STRATEGY_SYSTEM_PROMPT = `分析以下任务，为每个任务生成搜索策略。对于每个任务，你需要：
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
  {
    "task_id": "task1",
    "search_queries": [
      {
        "query": "2024年Q1人工智能最新应用数据",
        "context": "获取2024年第一季度人工智能应用的最新统计数据"
      },
      {
        "query": "人工智能市场规模 2024年3月 最新报告",
        "context": "查询2024年3月发布的人工智能市场规模报告"
      },
      {
        "query": "AI应用技术突破 2023-2024 最新进展",
        "context": "获取2023年底到2024年初的AI技术重大突破"
      }
    ],
    "time_constraints": "2024年内的数据，优先获取最近3个月的信息"
  },
  {
    "task_id": "task2",
    "search_queries": [
      {
        "query": "latest AI market trends March 2024 report",
        "context": "获取2024年3月发布的AI市场趋势报告"
      }
    ],
    "time_constraints": "2024年第一季度的数据"
  }
]

重要：请确保输出是有效的 JSON 格式，且必须是如上所示的数组结构，不要添加任何额外的文本或格式。每个生成的查询都必须包含明确的时间标识。`;

// Define types for better structure and readability
interface SearchQuery {
  query: string;
  context: string;
}

interface SearchStrategy {
  task_id: string;
  search_queries: SearchQuery[];
  time_constraints?: string;
}

interface TaskSearchResult {
  task_id: string;
  results: {
    query: string;
    context: string;
    result: string;
  }[];
}

interface PlanData {
  tasks: { id: string; description: string }[];
}

// Knowledge agent prompt template
const knowledgePrompt = ChatPromptTemplate.fromMessages([
  ["system", KNOWLEDGE_SYSTEM_PROMPT],
  ["human", "{plan}"],
]);

// Search strategy prompt template
const searchStrategyPrompt = ChatPromptTemplate.fromMessages([
  ["system", SEARCH_STRATEGY_SYSTEM_PROMPT],
  ["human", "{tasks}"]
]);

/**
 * Custom output parser that handles JSON extraction from model outputs
 */
const customOutputParser = {
  parse: async (text: unknown): Promise<string> => {
    try {
      // Handle AI message objects with content property
      if (typeof text !== 'string' && text !== null && typeof text === 'object') {
        if ('content' in text && text.content) {
          return typeof text.content === 'string' 
            ? extractJSON(text.content) 
            : JSON.stringify(text);
        }
        return JSON.stringify(text);
      }
      
      // Process string content
      const cleaned = extractJSON(text);
      try {
        // If valid JSON, return structured data
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
};

/**
 * Parses the plan data, falling back to a default if parsing fails
 */
function parsePlan(plan: string): PlanData {
  try {
    return JSON.parse(plan);
  } catch (error) {
    console.error('Failed to parse plan data:', error);
    return { 
      tasks: [{ 
        id: "default_task",
        description: plan 
      }] 
    };
  }
}

/**
 * Generates search strategies for the tasks in the plan
 */
async function generateSearchStrategies(tasksString: string): Promise<SearchStrategy[]> {
  try {
    const searchStrategyMessages = await searchStrategyPrompt.formatMessages({ tasks: tasksString });
    const searchStrategy = await model.invoke(searchStrategyMessages);
    
    // Extract content from model response
    let contentText = '';
    if (typeof searchStrategy === 'string') {
      contentText = searchStrategy;
    } else if (searchStrategy && typeof searchStrategy === 'object') {
      contentText = 'content' in searchStrategy && searchStrategy.content
        ? String(searchStrategy.content)
        : JSON.stringify(searchStrategy);
    } else {
      throw new Error(`Unexpected search strategy format: ${typeof searchStrategy}`);
    }

    // Extract and parse JSON
    const cleanedJson = extractJSON(contentText);
    const parsedData = JSON.parse(cleanedJson);
    
    // Ensure result is an array
    if (Array.isArray(parsedData)) {
      return parsedData;
    } else if (parsedData && typeof parsedData === 'object') {
      return [parsedData];
    } else {
      throw new Error('Parsed data has unexpected structure');
    }
  } catch (error) {
    console.error('Failed to generate search strategies:', error);
    return [{
      task_id: "default_task",
      search_queries: [{
        query: tasksString,
        context: "General search for information"
      }]
    }];
  }
}

/**
 * Validates and normalizes search strategies
 */
function normalizeSearchStrategies(strategies: SearchStrategy[]): SearchStrategy[] {
  return strategies.map(strategy => {
    if (!strategy.search_queries || !Array.isArray(strategy.search_queries)) {
      return {
        task_id: strategy.task_id || "default_task",
        search_queries: [{
          query: "general information",
          context: "General search for information"
        }]
      };
    }
    return strategy;
  });
}

/**
 * Executes searches based on the provided strategies
 */
async function executeSearches(strategies: SearchStrategy[], fallbackQuery: string): Promise<TaskSearchResult[]> {
  return Promise.all(
    strategies.map(async (strategy): Promise<TaskSearchResult> => {
      try {
        const results = await Promise.all(
          strategy.search_queries.map(async (query) => {
            try {
              const validQuery = {
                query: typeof query.query === 'string' ? query.query : fallbackQuery,
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
              return {
                query: typeof query.query === 'string' ? query.query : fallbackQuery,
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
        return {
          task_id: strategy.task_id || "unknown_task",
          results: [{
            query: fallbackQuery,
            context: "General search after error",
            result: "Error processing search strategy"
          }]
        };
      }
    })
  );
}

/**
 * Main knowledge search chain
 * 
 * RunnableSequence is a powerful abstraction from LangChain that chains multiple operations into a cohesive pipeline.
 * It implements the functional composition pattern where the output of one component becomes the input to the next.
 * Key features:
 * - Sequential execution: Steps run in order, with outputs passing to subsequent steps
 * - Type safety: Properly handles input/output types between components
 * - Error handling: Errors propagate through the chain and can be caught at the end
 * - Modular design: Each step focuses on a specific task, making code more maintainable
 */

/**
 * RunnableSequence.from is a static factory method that creates a new RunnableSequence instance.
 * It accepts an array of "runnable" components which can include:
 * - Language models
 * - Prompt templates
 * - Output parsers
 * - Custom functions (both synchronous and asynchronous)
 * - Other Runnable instances
 * 
 * The method:
 * - Passes initial input to the first component
 * - Routes outputs between middle components
 * - Returns the last component's output as the final result
 * - Automatically wraps regular functions as RunnableLambda instances
 * - Preserves type safety throughout the pipeline
 */
const knowledgeSearchChain = RunnableSequence.from([
  // 1. Custom async processing function: Handles the plan, generates search strategies, executes searches
  async (input: { plan: string }) => {
    // Parse the plan
    const planData = parsePlan(input.plan);
    
    // Format tasks for the search strategy prompt
    const tasksString = JSON.stringify(planData.tasks || []);

    try {
      // Generate search strategies
      let strategies = await generateSearchStrategies(tasksString);
      strategies = normalizeSearchStrategies(strategies);
      
      // Execute searches
      const searchResults = await executeSearches(strategies, input.plan);
      
      // Return combined input for final processing
      return {
        plan: input.plan,
        searchResults: JSON.stringify(searchResults)
      };
    } catch (error) {
      console.error('Error in search and knowledge processing:', error);
      return {
        plan: input.plan,
        searchResults: JSON.stringify([])
      };
    }
  },
  // 2. Prompt template: Formats the processed data as messages for the language model
  knowledgePrompt,
  // 3. Language model: Processes the prompt and generates a response
  model,
  // 4. Output parser: Structures and cleans the model's response into the final output
  customOutputParser
]);

export const knowledgeAgent = knowledgeSearchChain; 