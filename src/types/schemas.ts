import { z } from "zod";

// ==========================================
// 1. Core Enums & Primitive State Schemas
// ==========================================

export const TaskStatusSchema = z.enum(["pending", "running", "completed", "failed"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const NodeExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);
export type NodeExecutionStatus = z.infer<typeof NodeExecutionStatusSchema>;

export const NodeTypeSchema = z.enum([
  "start",
  "llm",
  "code",
  "condition",
  "http_request",
  "tool",
  "retrieval",
  "variable_assigner",
  "end",
]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const ModelProviderSchema = z.enum(["google", "openai", "anthropic", "custom"]);
export type ModelProvider = z.infer<typeof ModelProviderSchema>;

// ==========================================
// 2. Node Config Schemas
// ==========================================

export const StartNodeConfigSchema = z.object({
  inputVariables: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["string", "number", "boolean", "object", "array"]),
      required: z.boolean(),
      defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
      description: z.string(),
    })
  ),
});
export type StartNodeConfig = z.infer<typeof StartNodeConfigSchema>;

export const LLMNodeConfigSchema = z.object({
  model: z.string(),
  provider: ModelProviderSchema,
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(32768),
  topP: z.number().min(0).max(1),
  systemPrompt: z.string(),
  userPrompt: z.string(),
  responseFormat: z.enum(["text", "json"]),
  jsonSchema: z.string().optional(),
  tools: z.array(z.string()),
});
export type LLMNodeConfig = z.infer<typeof LLMNodeConfigSchema>;

export const CodeNodeConfigSchema = z.object({
  language: z.enum(["javascript", "python"]),
  code: z.string(),
  inputs: z.record(z.string(), z.string()), // variable key -> expression or path
});
export type CodeNodeConfig = z.infer<typeof CodeNodeConfigSchema>;

export const ConditionRuleSchema = z.object({
  id: z.string(),
  leftOperand: z.string(), // e.g. {{nodes.llm_1.output}} or {{variables.query}}
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "greater_than",
    "less_than",
    "is_empty",
    "is_not_empty",
  ]),
  rightOperand: z.string(),
  targetHandle: z.string(), // 'true' | 'false' | branch id
});
export type ConditionRule = z.infer<typeof ConditionRuleSchema>;

export const ConditionNodeConfigSchema = z.object({
  logicalOperator: z.enum(["and", "or"]),
  conditions: z.array(ConditionRuleSchema),
  elseTargetHandle: z.string(),
});
export type ConditionNodeConfig = z.infer<typeof ConditionNodeConfigSchema>;

export const HttpRequestNodeConfigSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  url: z.string(),
  headers: z.record(z.string(), z.string()),
  params: z.record(z.string(), z.string()),
  bodyType: z.enum(["none", "json", "form_data", "raw"]),
  body: z.string(),
  timeoutMs: z.number().min(100).max(60000),
});
export type HttpRequestNodeConfig = z.infer<typeof HttpRequestNodeConfigSchema>;

export const ToolNodeConfigSchema = z.object({
  toolId: z.string(),
  toolName: z.string(),
  arguments: z.record(z.string(), z.string()),
});
export type ToolNodeConfig = z.infer<typeof ToolNodeConfigSchema>;

export const RetrievalNodeConfigSchema = z.object({
  knowledgeBaseId: z.string(),
  queryTemplate: z.string(),
  topK: z.number().min(1).max(20),
  scoreThreshold: z.number().min(0).max(1),
});
export type RetrievalNodeConfig = z.infer<typeof RetrievalNodeConfigSchema>;

export const VariableAssignerConfigSchema = z.object({
  assignments: z.array(
    z.object({
      targetVariable: z.string(),
      sourceExpression: z.string(),
    })
  ),
});
export type VariableAssignerConfig = z.infer<typeof VariableAssignerConfigSchema>;

export const EndNodeConfigSchema = z.object({
  outputVariables: z.array(
    z.object({
      name: z.string(),
      expression: z.string(), // e.g. {{nodes.llm_1.output}}
      description: z.string(),
    })
  ),
});
export type EndNodeConfig = z.infer<typeof EndNodeConfigSchema>;

// Generic Node Data Schema
export const WorkflowNodeDataSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  type: NodeTypeSchema,
  startConfig: StartNodeConfigSchema.optional(),
  llmConfig: LLMNodeConfigSchema.optional(),
  codeConfig: CodeNodeConfigSchema.optional(),
  conditionConfig: ConditionNodeConfigSchema.optional(),
  httpConfig: HttpRequestNodeConfigSchema.optional(),
  toolConfig: ToolNodeConfigSchema.optional(),
  retrievalConfig: RetrievalNodeConfigSchema.optional(),
  variableAssignerConfig: VariableAssignerConfigSchema.optional(),
  endConfig: EndNodeConfigSchema.optional(),
});
export type WorkflowNodeData = z.infer<typeof WorkflowNodeDataSchema>;

// ==========================================
// 3. Workflow Graph Schemas
// ==========================================

export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: WorkflowNodeDataSchema,
});
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().optional(),
  target: z.string(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;

export const WorkflowVariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  description: z.string(),
});
export type WorkflowVariable = z.infer<typeof WorkflowVariableSchema>;

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isPublished: z.boolean(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  variables: z.array(WorkflowVariableSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

// ==========================================
// 4. Agent Entity Schemas
// ==========================================

export const AgentModelConfigSchema = z.object({
  model: z.string(),
  provider: ModelProviderSchema,
  temperature: z.number(),
  maxTokens: z.number(),
  topP: z.number(),
  systemPrompt: z.string(),
});
export type AgentModelConfig = z.infer<typeof AgentModelConfigSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  avatar: z.string(),
  category: z.string(),
  isPublished: z.boolean(),
  modelConfig: AgentModelConfigSchema,
  promptTemplate: z.string(),
  tools: z.array(z.string()), // Tool IDs
  knowledgeBases: z.array(z.string()), // Knowledge Base IDs
  workflowId: z.string().optional(), // Linked workflow if any
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;

// ==========================================
// 5. Tool & Knowledge Schemas
// ==========================================

export const ToolParameterPropertySchema = z.object({
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  description: z.string(),
  required: z.boolean().default(false),
  default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});
export type ToolParameterProperty = z.infer<typeof ToolParameterPropertySchema>;

export const ToolDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  parameters: z.record(z.string(), ToolParameterPropertySchema),
  type: z.enum(["api", "function", "builtin"]),
  endpoint: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  codeBody: z.string().optional(),
  createdAt: z.string(),
});
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export const KnowledgeDocSchema = z.object({
  id: z.string(),
  knowledgeBaseId: z.string(),
  title: z.string(),
  content: z.string(),
  chunkCount: z.number(),
  status: z.enum(["indexed", "indexing", "error"]),
  createdAt: z.string(),
});
export type KnowledgeDoc = z.infer<typeof KnowledgeDocSchema>;

export const KnowledgeBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  documentsCount: z.number(),
  vectorDimension: z.number(),
  status: z.enum(["ready", "syncing", "error"]),
  createdAt: z.string(),
});
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

// ==========================================
// 6. Execution Trace & Telemetry Schemas
// ==========================================

export const TraceEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  nodeId: z.string().optional(),
  nodeName: z.string().optional(),
  eventType: z.enum([
    "task_start",
    "node_enter",
    "node_executing",
    "node_exit",
    "node_error",
    "llm_call",
    "tool_call",
    "condition_eval",
    "task_complete",
    "task_error",
  ]),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});
export type TraceEvent = z.infer<typeof TraceEventSchema>;

export const NodeExecutionResultSchema = z.object({
  nodeId: z.string(),
  nodeName: z.string(),
  nodeType: NodeTypeSchema,
  status: NodeExecutionStatusSchema,
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
  startedAt: z.number(),
  completedAt: z.number(),
  durationMs: z.number(),
  error: z.string().optional(),
  traceLogs: z.array(z.string()),
});
export type NodeExecutionResult = z.infer<typeof NodeExecutionResultSchema>;

export const ExecutionMetricsSchema = z.object({
  durationMs: z.number(),
  tokenUsage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  costUsd: z.number(),
});
export type ExecutionMetrics = z.infer<typeof ExecutionMetricsSchema>;

export const ExecutionTaskSchema = z.object({
  id: z.string(),
  targetId: z.string(), // workflowId or agentId
  targetType: z.enum(["workflow", "agent"]),
  targetName: z.string(),
  status: TaskStatusSchema,
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
  nodeResults: z.record(z.string(), NodeExecutionResultSchema),
  traceEvents: z.array(TraceEventSchema),
  metrics: ExecutionMetricsSchema,
  error: z.string().optional(),
  triggeredBy: z.enum(["manual", "api", "webhook", "cron"]),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});
export type ExecutionTask = z.infer<typeof ExecutionTaskSchema>;
