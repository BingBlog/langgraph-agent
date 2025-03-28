# 多 Agent 工作流 with Langfuse Tracing

使用 Egg.js 和 Langfuse 实现的多 Agent 工作流系统，支持 AI Agent 的完整追踪和监控。

## 项目特点

- 使用 Egg.js 框架构建，支持企业级应用开发
- 集成 Langfuse 追踪，监控所有 LLM 调用和工作流执行
- 多 Agent 协作工作流程，包含规划、知识检索、分析和报告生成
- RESTful API 接口，支持外部系统集成
- 友好的 Web 界面进行测试

## 项目结构

```
.
├── app                     # 应用代码目录
│   ├── controller          # 控制器
│   ├── middleware          # 中间件
│   ├── public              # 静态资源
│   ├── service             # 服务
│   └── router.js           # 路由配置
├── config                  # 配置文件
│   ├── config.default.js   # 默认配置
│   ├── config.local.js     # 开发环境配置
│   └── plugin.js           # 插件配置
├── agents                  # 各种AI代理实现
│   ├── planner             # 规划Agent
│   ├── knowledge           # 知识检索Agent
│   ├── analysis            # 分析Agent
│   ├── report              # 报告生成Agent
│   ├── shared.ts           # 共享组件
│   └── langfuse.ts         # Langfuse集成
├── workflow.ts             # 工作流定义
├── app.js                  # 应用启动钩子
└── package.json            # 项目配置
```

## Langfuse 集成说明

本项目通过多种方式集成了 Langfuse 追踪功能：

1. **中间件追踪**：`app/middleware/langfuseTracing.js` 自动为所有 API 请求创建追踪
2. **服务层集成**：`app/service/langfuse.js` 提供了全面的追踪 API
3. **工作流追踪**：每个 Agent 的执行被记录为独立的 span
4. **错误追踪**：自动捕获并记录错误信息

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 配置环境变量
   创建 `.env` 文件，填入：

```
DEEPSEEK_API_KEY=your_deepseek_api_key
TRIVIA_API_KEY=your_trivia_api_key
LANGFUSE_SECRET_KEY=sk-lf-2@workflow.ts 933d111-fadb-4be8-8a3c-c85ddf356234
LANGFUSE_PUBLIC_KEY=pk-lf-04061322-762b-46a1-b5bf-b606b436554b
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

3. 开发模式运行

```bash
pnpm run dev
```

4. 访问应用

- Web 界面: http://localhost:7001/
- API 接口: http://localhost:7001/api/workflow
- 健康检查: http://localhost:7001/health

5. 查看追踪数据
   访问 Langfuse 控制台: https://cloud.langfuse.com

## API 说明

### 执行工作流

- **URL**: `/api/workflow`
- **方法**: `POST`
- **请求体**:

```json
{
  "query": "人工智能在医疗领域的应用和发展趋势"
}
```

- **成功响应**:

```json
{
  "success": true,
  "traceId": "trace-uuid",
  "report": { ... },
  "metadata": { ... }
}
```

## 开发与部署

### 开发

```bash
pnpm run dev
```

### 部署

```bash
pnpm run start
```

### 停止

```bash
pnpm run stop
```
