import { Langfuse } from "langfuse";

// Initialize Langfuse with the provided credentials
export const langfuse = new Langfuse({
  secretKey: "sk-lf-2@workflow.ts 933d111-fadb-4be8-8a3c-c85ddf356234",
  publicKey: "pk-lf-04061322-762b-46a1-b5bf-b606b436554b",
  baseUrl: "https://cloud.langfuse.com"
});

// Helper function to create a trace for a workflow run
export const createWorkflowTrace = (input: string) => {
  return langfuse.trace({
    name: "Multi-Agent Workflow",
    input: { query: input },
  });
};

// Helper function to create a span within a trace
export const createSpan = (
  trace: any, 
  name: string, 
  input?: any,
  parentSpanId?: string
) => {
  return trace.span({
    name,
    input,
    parentSpanId
  });
};

// Helper to track LLM generations
export const trackGeneration = (
  trace: any,
  name: string,
  prompt: any,
  completion: any,
  modelParams: any,
  parentSpanId?: string
) => {
  return trace.generation({
    name,
    model: modelParams.model || "unknown",
    modelParameters: modelParams,
    prompt,
    completion,
    parentSpanId
  });
}; 