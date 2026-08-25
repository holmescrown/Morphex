import { z } from "zod";

/**
 * ============================================================================
 * 1. WORKSPACES (工作区与权限隔离)
 * ============================================================================
 */

export const WorkspacePlanEnum = z.enum(["free", "starter", "pro", "enterprise"]);
export type WorkspacePlan = z.infer<typeof WorkspacePlanEnum>;

export const WorkspaceSettingsSchema = z.object({
  allowed_domains: z.array(z.string()).default([]),
  default_llm_model: z.string().default("gemini-3.7-flash"),
  enable_mcp: z.boolean().default(true),
  enable_audit_logs: z.boolean().default(true),
  rate_limit_per_min: z.number().int().positive().default(120),
  custom_theme: z.record(z.string(), z.string()).optional(),
  feature_flags: z.record(z.string(), z.boolean()).default({}),
});
export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;

export const defaultWorkspaceSettings: WorkspaceSettings = {
  allowed_domains: [],
  default_llm_model: "gemini-3.7-flash",
  enable_mcp: true,
  enable_audit_logs: true,
  rate_limit_per_min: 120,
  feature_flags: {},
};

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "工作区名称不能为空").max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug 必须由小写字母、数字或横杠组成"),
  owner_id: z.string().min(1),
  plan: WorkspacePlanEnum.default("free"),
  settings: WorkspaceSettingsSchema.default(defaultWorkspaceSettings),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const CreateWorkspaceSchema = WorkspaceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  settings: true,
  plan: true,
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;


/**
 * ============================================================================
 * 2. DYNAMIC_MODULES (动态模块定义: table / kanban / form / gallery / calendar)
 * ============================================================================
 */

export const DynamicModuleTypeEnum = z.enum([
  "table",
  "kanban",
  "form",
  "gallery",
  "calendar",
]);
export type DynamicModuleType = z.infer<typeof DynamicModuleTypeEnum>;

export const DynamicModuleConfigSchema = z.object({
  kanban_group_field_id: z.string().optional(),
  calendar_start_field_id: z.string().optional(),
  calendar_end_field_id: z.string().optional(),
  form_submit_button_text: z.string().default("提交"),
  form_success_message: z.string().default("提交成功！"),
  default_sort_field_id: z.string().optional(),
  default_sort_order: z.enum(["asc", "desc"]).default("desc"),
  visible_column_ids: z.array(z.string()).default([]),
  page_size: z.number().int().positive().default(20),
  custom_styles: z.record(z.string(), z.unknown()).optional(),
});
export type DynamicModuleConfig = z.infer<typeof DynamicModuleConfigSchema>;

export const defaultDynamicModuleConfig: DynamicModuleConfig = {
  form_submit_button_text: "提交",
  form_success_message: "提交成功！",
  default_sort_order: "desc",
  visible_column_ids: [],
  page_size: 20,
};

export const DynamicModuleSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1, "模块名称不能为空").max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-_]+$/, "模块标识必须为小写字母、数字、横杠或下划线"),
  type: DynamicModuleTypeEnum.default("table"),
  icon: z.string().max(50).default("Table"),
  description: z.string().max(500).nullable().default(""),
  config: DynamicModuleConfigSchema.default(defaultDynamicModuleConfig),
  order: z.number().int().default(0),
  is_system: z.boolean().default(false),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type DynamicModule = z.infer<typeof DynamicModuleSchema>;

export const CreateDynamicModuleSchema = DynamicModuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  config: true,
  order: true,
  is_system: true,
  description: true,
  icon: true,
});
export type CreateDynamicModuleInput = z.infer<typeof CreateDynamicModuleSchema>;

export const UpdateDynamicModuleSchema = CreateDynamicModuleSchema.partial();
export type UpdateDynamicModuleInput = z.infer<typeof UpdateDynamicModuleSchema>;


/**
 * ============================================================================
 * 3. DYNAMIC_FIELDS (动态字段配置)
 * 关键扩展字段: is_hidden (软删除/隐藏), deprecated_keys (键名迁移历史)
 * ============================================================================
 */

export const DynamicFieldTypeEnum = z.enum([
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "boolean",
  "user",
  "file",
  "relation",
  "formula",
  "json",
]);
export type DynamicFieldType = z.infer<typeof DynamicFieldTypeEnum>;

export const FieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
});
export type FieldOption = z.infer<typeof FieldOptionSchema>;

export const FieldValidationRulesSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  min_length: z.number().int().optional(),
  max_length: z.number().int().optional(),
  regex_pattern: z.string().optional(),
  custom_error_message: z.string().optional(),
});
export type FieldValidationRules = z.infer<typeof FieldValidationRulesSchema>;

export const DynamicFieldSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  name: z.string().min(1, "字段展示名不能为空").max(100),
  field_key: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_]+$/, "字段存储键名必须是英文字母、数字或下划线"),
  field_type: DynamicFieldTypeEnum.default("text"),
  is_required: z.boolean().default(false),
  is_unique: z.boolean().default(false),
  is_primary: z.boolean().default(false),
  /**
   * 关键扩展字段: 软删除 / 逻辑隐藏标记
   */
  is_hidden: z.boolean().default(false),
  /**
   * 关键扩展字段: 历史废弃旧键名列表，用于在 JSONB 载荷读取时平滑迁移旧数据
   */
  deprecated_keys: z.array(z.string()).default([]),
  default_value: z.unknown().nullable().default(null),
  validation_rules: FieldValidationRulesSchema.nullable().default(null),
  options: z.array(FieldOptionSchema).nullable().default(null),
  field_order: z.number().int().default(0),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type DynamicField = z.infer<typeof DynamicFieldSchema>;

export const CreateDynamicFieldSchema = DynamicFieldSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  is_required: true,
  is_unique: true,
  is_primary: true,
  is_hidden: true,
  deprecated_keys: true,
  default_value: true,
  validation_rules: true,
  options: true,
  field_order: true,
});
export type CreateDynamicFieldInput = z.infer<typeof CreateDynamicFieldSchema>;

export const UpdateDynamicFieldSchema = CreateDynamicFieldSchema.partial();
export type UpdateDynamicFieldInput = z.infer<typeof UpdateDynamicFieldSchema>;


/**
 * ============================================================================
 * 4. DYNAMIC_RECORDS (动态业务数据记录 - JSONB 动态载荷)
 * 关键扩展字段: version (乐观并发控制锁)
 * ============================================================================
 */

export const DynamicRecordDataSchema = z.record(z.string(), z.unknown());
export type DynamicRecordData = z.infer<typeof DynamicRecordDataSchema>;

export const DynamicRecordSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  /**
   * JSONB 动态数据载荷
   */
  data: DynamicRecordDataSchema.default({}),
  /**
   * 关键扩展字段: 乐观锁版本号，写操作时必须 version = version + 1
   */
  version: z.number().int().nonnegative().default(1),
  created_by: z.string().nullable().default(null),
  updated_by: z.string().nullable().default(null),
  is_deleted: z.boolean().default(false),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type DynamicRecord = z.infer<typeof DynamicRecordSchema>;

export const CreateDynamicRecordSchema = DynamicRecordSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  version: true,
  created_by: true,
  updated_by: true,
  is_deleted: true,
});
export type CreateDynamicRecordInput = z.infer<typeof CreateDynamicRecordSchema>;

export const UpdateDynamicRecordSchema = z.object({
  data: DynamicRecordDataSchema.optional(),
  version: z.number().int().nonnegative(), // 乐观锁必须携带当前期待版本
  updated_by: z.string().optional(),
  is_deleted: z.boolean().optional(),
});
export type UpdateDynamicRecordInput = z.infer<typeof UpdateDynamicRecordSchema>;


/**
 * ============================================================================
 * 5. AI_AGENTS (AI Agent 员工配置)
 * ============================================================================
 */

export const AgentModelConfigSchema = z.object({
  provider: z.enum(["google", "openai", "anthropic", "custom"]).default("google"),
  model: z.string().default("gemini-3.7-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  top_p: z.number().min(0).max(1).default(0.95),
  max_tokens: z.number().int().positive().default(2048),
  response_format: z.enum(["text", "json"]).default("text"),
  system_prompt: z.string().default("你是一名高效、严谨的企业业务自动化智能助手。"),
  context_window_strategy: z.enum(["sliding", "summarize", "truncate"]).default("sliding"),
});
export type AgentModelConfig = z.infer<typeof AgentModelConfigSchema>;

export const AIAgentSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1, "Agent 名称不能为空").max(100),
  avatar: z.string().max(50).default("🤖"),
  role_title: z.string().max(100).default("智能自动化分析师"),
  description: z.string().max(1000).nullable().default(""),
  system_prompt: z.string().default("你是一名高效、严谨的企业业务自动化智能助手。"),
  model: z.string().default("gemini-3.7-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  top_p: z.number().min(0).max(1).default(0.95),
  max_tokens: z.number().int().positive().default(2048),
  response_format: z.enum(["text", "json"]).default("text"),
  is_active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type AIAgent = z.infer<typeof AIAgentSchema>;

export const CreateAIAgentSchema = AIAgentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  avatar: true,
  role_title: true,
  description: true,
  system_prompt: true,
  model: true,
  temperature: true,
  top_p: true,
  max_tokens: true,
  response_format: true,
  is_active: true,
  metadata: true,
});
export type CreateAIAgentInput = z.infer<typeof CreateAIAgentSchema>;

export const UpdateAIAgentSchema = CreateAIAgentSchema.partial();
export type UpdateAIAgentInput = z.infer<typeof UpdateAIAgentSchema>;


/**
 * ============================================================================
 * 6. AUTOMATION_TASKS (自动化任务队列 - State Machine)
 * 关键扩展字段: trigger_type 扩充 webhook / data_change
 * ============================================================================
 */

export const TaskTriggerTypeEnum = z.enum([
  "manual",
  "webhook",
  "data_change",
  "cron",
  "workflow_event",
]);
export type TaskTriggerType = z.infer<typeof TaskTriggerTypeEnum>;

export const TaskStatusEnum = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "retrying",
]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TriggerConfigSchema = z.object({
  webhook_secret: z.string().optional(),
  watched_module_id: z.string().optional(),
  watched_events: z.array(z.enum(["insert", "update", "delete"])).optional(),
  cron_expression: z.string().optional(),
  source_ip: z.string().optional(),
  headers_matched: z.record(z.string(), z.string()).optional(),
});
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;

export const AutomationTaskSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  agent_id: z.string().uuid().nullable().default(null),
  name: z.string().min(1, "任务名称不能为空").max(150),
  /**
   * 关键扩展字段: 触发源类型，已扩充 webhook / data_change
   */
  trigger_type: TaskTriggerTypeEnum.default("manual"),
  trigger_config: TriggerConfigSchema.default({}),
  status: TaskStatusEnum.default("pending"),
  payload: z.record(z.string(), z.unknown()).default({}),
  result: z.record(z.string(), z.unknown()).nullable().default(null),
  priority: z.number().int().min(1).max(10).default(5),
  retry_count: z.number().int().nonnegative().default(0),
  max_retries: z.number().int().nonnegative().default(3),
  error_message: z.string().nullable().default(null),
  started_at: z.string().datetime().or(z.date()).nullable().default(null),
  finished_at: z.string().datetime().or(z.date()).nullable().default(null),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type AutomationTask = z.infer<typeof AutomationTaskSchema>;

export const CreateAutomationTaskSchema = AutomationTaskSchema.omit({
  id: true,
  status: true,
  result: true,
  retry_count: true,
  error_message: true,
  started_at: true,
  finished_at: true,
  created_at: true,
  updated_at: true,
}).partial({
  agent_id: true,
  trigger_type: true,
  trigger_config: true,
  payload: true,
  priority: true,
  max_retries: true,
});
export type CreateAutomationTaskInput = z.infer<typeof CreateAutomationTaskSchema>;

export const UpdateAutomationTaskSchema = z.object({
  status: TaskStatusEnum.optional(),
  result: z.record(z.string(), z.unknown()).nullable().optional(),
  error_message: z.string().nullable().optional(),
  retry_count: z.number().int().nonnegative().optional(),
  started_at: z.string().datetime().or(z.date()).nullable().optional(),
  finished_at: z.string().datetime().or(z.date()).nullable().optional(),
});
export type UpdateAutomationTaskInput = z.infer<typeof UpdateAutomationTaskSchema>;


/**
 * ============================================================================
 * 7. TASK_LOGS (任务执行日志与审计 Trace 增强)
 * 关键扩展字段: raw_payload, tool_call_raw, token_usage
 * ============================================================================
 */

export const LogLevelEnum = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof LogLevelEnum>;

export const TokenUsageSchema = z.object({
  prompt_tokens: z.number().int().nonnegative().default(0),
  completion_tokens: z.number().int().nonnegative().default(0),
  total_tokens: z.number().int().nonnegative().default(0),
  cost_usd: z.number().nonnegative().default(0),
});
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const ToolCallRawSchema = z.object({
  tool_id: z.string().optional(),
  tool_name: z.string().optional(),
  mcp_tool_name: z.string().optional(),
  call_args: z.record(z.string(), z.unknown()).default({}),
  raw_response: z.unknown().optional(),
  is_error: z.boolean().default(false),
  error_message: z.string().optional(),
  execution_duration_ms: z.number().nonnegative().default(0),
});
export type ToolCallRaw = z.infer<typeof ToolCallRawSchema>;

export const TaskLogSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  agent_id: z.string().uuid().nullable().default(null),
  log_level: LogLevelEnum.default("info"),
  event_type: z.string().min(1).max(100),
  message: z.string().min(1),
  /**
   * 关键扩展字段: Trace 原始输入/环境载荷快照
   */
  raw_payload: z.record(z.string(), z.unknown()).nullable().default(null),
  /**
   * 关键扩展字段: 工具调用详细 Trace 记录 (含入参与响应)
   */
  tool_call_raw: ToolCallRawSchema.nullable().default(null),
  /**
   * 关键扩展字段: 细粒度 Token 消耗与成本审计
   */
  token_usage: TokenUsageSchema.nullable().default(null),
  duration_ms: z.number().nonnegative().default(0),
  created_at: z.string().datetime().or(z.date()),
});
export type TaskLog = z.infer<typeof TaskLogSchema>;

export const CreateTaskLogSchema = TaskLogSchema.omit({
  id: true,
  created_at: true,
}).partial({
  agent_id: true,
  log_level: true,
  raw_payload: true,
  tool_call_raw: true,
  token_usage: true,
  duration_ms: true,
});
export type CreateTaskLogInput = z.infer<typeof CreateTaskLogSchema>;


/**
 * ============================================================================
 * 8. AGENT_SKILLS (原子技能注册表 - MCP 兼容与向量检索)
 * 关键扩展字段: mcp_server_url, mcp_tool_name, auth_type, embedding
 * ============================================================================
 */

export const SkillExecutionTypeEnum = z.enum([
  "javascript",
  "http_request",
  "mcp",
  "prompt_template",
]);
export type SkillExecutionType = z.infer<typeof SkillExecutionTypeEnum>;

export const SkillAuthTypeEnum = z.enum([
  "none",
  "bearer",
  "api_key",
  "oauth2",
  "custom",
]);
export type SkillAuthType = z.infer<typeof SkillAuthTypeEnum>;

export const SkillAuthConfigSchema = z.object({
  header_key: z.string().optional(),
  header_prefix: z.string().optional(),
  api_key_ref: z.string().optional(),
  oauth_scope: z.array(z.string()).optional(),
  custom_headers: z.record(z.string(), z.string()).optional(),
});
export type SkillAuthConfig = z.infer<typeof SkillAuthConfigSchema>;

export const AgentSkillSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1, "技能名称不能为空").max(100),
  identifier: z.string().min(2).max(64).regex(/^[a-zA-Z0-9_-]+$/, "技能唯一标识必须是英文字母、数字、横杠或下划线"),
  description: z.string().max(1000).default(""),
  category: z.string().max(50).default("Utility"),
  execution_type: SkillExecutionTypeEnum.default("javascript"),
  parameters_schema: z.record(z.string(), z.unknown()).default({}),
  returns_schema: z.record(z.string(), z.unknown()).default({}),
  code_snippet: z.string().nullable().default(null),
  /**
   * 关键扩展字段: MCP 服务器连接地址 (Model Context Protocol)
   */
  mcp_server_url: z.string().url().nullable().default(null),
  /**
   * 关键扩展字段: MCP 导出的工具函数名称
   */
  mcp_tool_name: z.string().nullable().default(null),
  /**
   * 关键扩展字段: 技能鉴权方式
   */
  auth_type: SkillAuthTypeEnum.default("none"),
  auth_config: SkillAuthConfigSchema.nullable().default(null),
  /**
   * 关键扩展字段: 技能语义向量 (用于 RAG / 动态 Tool 路由与检索匹配，如 1536 维 embedding)
   */
  embedding: z.array(z.number()).nullable().default(null),
  is_system: z.boolean().default(false),
  is_enabled: z.boolean().default(true),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type AgentSkill = z.infer<typeof AgentSkillSchema>;

export const CreateAgentSkillSchema = AgentSkillSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  description: true,
  category: true,
  execution_type: true,
  parameters_schema: true,
  returns_schema: true,
  code_snippet: true,
  mcp_server_url: true,
  mcp_tool_name: true,
  auth_type: true,
  auth_config: true,
  embedding: true,
  is_system: true,
  is_enabled: true,
});
export type CreateAgentSkillInput = z.infer<typeof CreateAgentSkillSchema>;

export const UpdateAgentSkillSchema = CreateAgentSkillSchema.partial();
export type UpdateAgentSkillInput = z.infer<typeof UpdateAgentSkillSchema>;


/**
 * ============================================================================
 * 9. AGENT_SKILL_BINDINGS (Agent 与 Skill 多对多绑定)
 * ============================================================================
 */

export const AgentSkillBindingSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  skill_id: z.string().uuid(),
  is_active: z.boolean().default(true),
  override_config: z.record(z.string(), z.unknown()).default({}),
  priority: z.number().int().default(0),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});
export type AgentSkillBinding = z.infer<typeof AgentSkillBindingSchema>;

export const CreateAgentSkillBindingSchema = AgentSkillBindingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  is_active: true,
  override_config: true,
  priority: true,
});
export type CreateAgentSkillBindingInput = z.infer<typeof CreateAgentSkillBindingSchema>;

export const UpdateAgentSkillBindingSchema = CreateAgentSkillBindingSchema.partial();
export type UpdateAgentSkillBindingInput = z.infer<typeof UpdateAgentSkillBindingSchema>;


/**
 * ============================================================================
 * 聚合类型与 DDL 契约表映射 (Database Schema Map)
 * ============================================================================
 */
export interface DatabaseSchema {
  workspaces: Workspace;
  dynamic_modules: DynamicModule;
  dynamic_fields: DynamicField;
  dynamic_records: DynamicRecord;
  ai_agents: AIAgent;
  automation_tasks: AutomationTask;
  task_logs: TaskLog;
  agent_skills: AgentSkill;
  agent_skill_bindings: AgentSkillBinding;
}
