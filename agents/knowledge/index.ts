import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { model, searchFunction } from "../shared.js";

// 知识检索 Agent
const knowledgePrompt = ChatPromptTemplate.fromMessages([
  ["system", `你是一个知识检索专家。你的职责是：
1. 理解任务计划
2. 分析每个任务需要搜索的知识类型
3. 使用搜索函数获取相关知识
4. 整理和总结检索到的信息
5. 提供结构化的知识输出

你可以使用 search_knowledge 函数来搜索知识。对于每个任务，你应该：
1. 分析任务描述，确定需要搜索的关键信息
2. 构建合适的搜索查询
3. 提供搜索上下文，帮助理解搜索目的
4. 整合搜索结果，确保信息的完整性和相关性

请以 JSON 格式输出检索结果，包含以下字段：
- query: 搜索查询
- results: 检索到的知识列表
- summary: 知识总结，包括最新数据和统计
`],
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

请以 JSON 格式输出搜索策略，包含以下字段：
- task_id: 任务ID
- search_queries: 搜索查询列表，每个查询包含 query 和 context
`],
      ["human", "{tasks}"]
    ]);

    // Format tasks for the search strategy prompt
    const tasksString = JSON.stringify(planData.tasks || []);

    try {
      const searchStrategyMessages = await searchStrategyPrompt.formatMessages({ tasks: tasksString });
      const searchStrategy = await model.invoke(searchStrategyMessages);
      
      let strategyData;
      try {
        strategyData = JSON.parse(searchStrategy.content.toString());
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
      
      // 执行搜索
      const searchResults = await Promise.all(
        strategyData.map(async (strategy: any) => {
          const results = await Promise.all(
            strategy.search_queries.map(async (query: any) => {
              const result = await searchFunction.function(query);
              return {
                query: query.query,
                context: query.context,
                result
              };
            })
          );
          return {
            task_id: strategy.task_id,
            results
          };
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
  new StringOutputParser(),
]);

export const knowledgeAgent = knowledgeSearchChain; 