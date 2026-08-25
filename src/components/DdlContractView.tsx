import React, { useState } from "react";
import {
  FileCode2,
  Database,
  CheckCircle2,
  Copy,
  Table,
  Cpu,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface TableContractMeta {
  tableName: string;
  duty: string;
  keyFields: string;
  ddlSnippet: string;
  typescriptSchema: string;
}

export const DdlContractView: React.FC = () => {
  const tables: TableContractMeta[] = [
    {
      tableName: "workspaces",
      duty: "工作区与多租户权限隔离",
      keyFields: "plan (free/pro/enterprise), settings (JSONB)",
      ddlSnippet: `CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  owner_id VARCHAR NOT NULL,
  plan VARCHAR(20) DEFAULT 'free',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50),
  owner_id: z.string().min(1),
  plan: WorkspacePlanEnum.default("free"),
  settings: WorkspaceSettingsSchema.default({}),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});`,
    },
    {
      tableName: "dynamic_modules",
      duty: "动态模块定义 (table/kanban/form/gallery/calendar)",
      keyFields: "type, config (JSONB), slug",
      ddlSnippet: `CREATE TABLE dynamic_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  type VARCHAR(20) DEFAULT 'table',
  icon VARCHAR(50) DEFAULT 'Table',
  description TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  "order" INT DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const DynamicModuleSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50),
  type: DynamicModuleTypeEnum.default("table"),
  icon: z.string().max(50).default("Table"),
  config: DynamicModuleConfigSchema.default({}),
  order: z.number().int().default(0),
  is_system: z.boolean().default(false),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});`,
    },
    {
      tableName: "dynamic_fields",
      duty: "动态字段配置",
      keyFields: "is_hidden (软删除)、deprecated_keys (键名迁移数组)",
      ddlSnippet: `CREATE TABLE dynamic_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES dynamic_modules(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  field_key VARCHAR(64) NOT NULL,
  field_type VARCHAR(32) DEFAULT 'text',
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false, -- 关键扩展：软删除/逻辑隐藏
  deprecated_keys TEXT[] DEFAULT '{}', -- 关键扩展：历史废弃键名迁移
  default_value JSONB,
  validation_rules JSONB,
  options JSONB,
  field_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const DynamicFieldSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  field_key: z.string().min(1).max(64),
  field_type: DynamicFieldTypeEnum.default("text"),
  is_hidden: z.boolean().default(false), // 软删除
  deprecated_keys: z.array(z.string()).default([]), // 历史旧键名
  default_value: z.unknown().nullable().default(null),
  options: z.array(FieldOptionSchema).nullable().default(null),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});`,
    },
    {
      tableName: "dynamic_records",
      duty: "动态业务数据记录 (JSONB)",
      keyFields: "version (乐观并发锁)、data (JSONB)",
      ddlSnippet: `CREATE TABLE dynamic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES dynamic_modules(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}'::jsonb, -- 动态 JSONB 载荷
  version INT NOT NULL DEFAULT 1, -- 关键扩展：乐观锁并发版本号
  created_by VARCHAR,
  updated_by VARCHAR,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const DynamicRecordSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  data: DynamicRecordDataSchema.default({}),
  version: z.number().int().nonnegative().default(1), // 乐观并发锁
  created_by: z.string().nullable().default(null),
  updated_by: z.string().nullable().default(null),
  is_deleted: z.boolean().default(false),
  created_at: z.string().datetime().or(z.date()),
  updated_at: z.string().datetime().or(z.date()),
});`,
    },
    {
      tableName: "ai_agents",
      duty: "AI Agent 员工配置",
      keyFields: "system_prompt, model, temperature, top_p, max_tokens",
      ddlSnippet: `CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(50) DEFAULT '🤖',
  role_title VARCHAR(100) DEFAULT '智能自动化分析师',
  description TEXT,
  system_prompt TEXT NOT NULL,
  model VARCHAR(50) DEFAULT 'gemini-3.7-flash',
  temperature NUMERIC(3, 2) DEFAULT 0.2,
  top_p NUMERIC(3, 2) DEFAULT 0.95,
  max_tokens INT DEFAULT 2048,
  response_format VARCHAR(20) DEFAULT 'text',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const AIAgentSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  system_prompt: z.string().default("你是一名高效智能助手。"),
  model: z.string().default("gemini-3.7-flash"),
  temperature: z.number().min(0).max(2).default(0.2),
  is_active: z.boolean().default(true),
});`,
    },
    {
      tableName: "automation_tasks",
      duty: "自动化任务队列 (State Machine)",
      keyFields: "trigger_type 扩充 webhook / data_change / cron / manual",
      ddlSnippet: `CREATE TABLE automation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  trigger_type VARCHAR(32) DEFAULT 'manual', -- 扩充 webhook / data_change
  trigger_config JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'pending', -- 状态机: pending/running/completed/failed
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  priority INT DEFAULT 5,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const AutomationTaskSchema = z.object({
  id: z.string().uuid(),
  trigger_type: TaskTriggerTypeEnum.default("manual"),
  trigger_config: TriggerConfigSchema.default({}),
  status: TaskStatusEnum.default("pending"),
  payload: z.record(z.string(), z.unknown()).default({}),
  result: z.record(z.string(), z.unknown()).nullable().default(null),
});`,
    },
    {
      tableName: "task_logs",
      duty: "任务执行日志与审计 (Trace 增强)",
      keyFields: "raw_payload, tool_call_raw, token_usage",
      ddlSnippet: `CREATE TABLE task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES automation_tasks(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  log_level VARCHAR(10) DEFAULT 'info',
  event_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  raw_payload JSONB, -- Trace 原始快照
  tool_call_raw JSONB, -- 工具调用详细入参与响应
  token_usage JSONB, -- Token 细粒度消耗与成本审计
  duration_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const TaskLogSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  event_type: z.string().min(1).max(100),
  raw_payload: z.record(z.string(), z.unknown()).nullable().default(null),
  tool_call_raw: ToolCallRawSchema.nullable().default(null),
  token_usage: TokenUsageSchema.nullable().default(null),
  duration_ms: z.number().nonnegative().default(0),
});`,
    },
    {
      tableName: "agent_skills",
      duty: "原子技能注册表 (MCP 兼容与向量检索)",
      keyFields: "mcp_server_url, mcp_tool_name, auth_type, embedding",
      ddlSnippet: `CREATE TABLE agent_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  identifier VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'Utility',
  execution_type VARCHAR(20) DEFAULT 'javascript',
  parameters_schema JSONB DEFAULT '{}'::jsonb,
  returns_schema JSONB DEFAULT '{}'::jsonb,
  code_snippet TEXT,
  mcp_server_url TEXT, -- MCP 协议服务器地址
  mcp_tool_name VARCHAR(100), -- MCP 导出的工具名
  auth_type VARCHAR(20) DEFAULT 'none',
  auth_config JSONB,
  embedding VECTOR(1536), -- 向量语义检索
  is_system BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`,
      typescriptSchema: `export const AgentSkillSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  identifier: z.string().min(2).max(64),
  mcp_server_url: z.string().url().nullable().default(null),
  mcp_tool_name: z.string().nullable().default(null),
  auth_type: SkillAuthTypeEnum.default("none"),
  embedding: z.array(z.number()).nullable().default(null),
});`,
    },
    {
      tableName: "agent_skill_bindings",
      duty: "Agent 与 Skill 多对多绑定",
      keyFields: "agent_id, skill_id, override_config",
      ddlSnippet: `CREATE TABLE agent_skill_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES agent_skills(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  override_config JSONB DEFAULT '{}'::jsonb,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, skill_id)
);`,
      typescriptSchema: `export const AgentSkillBindingSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  skill_id: z.string().uuid(),
  is_active: z.boolean().default(true),
  override_config: z.record(z.string(), z.unknown()).default({}),
});`,
    },
  ];

  const [selectedTable, setSelectedTable] = useState<TableContractMeta>(tables[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              PostgreSQL 9 大核心表
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
            DDL 契约
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tables.map((t, idx) => {
            const isSelected = selectedTable.tableName === t.tableName;
            return (
              <div
                key={t.tableName}
                onClick={() => setSelectedTable(t)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-950/40"
                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-mono font-bold text-white">
                    #{idx + 1} {t.tableName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{t.duty}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Details */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg">
                  TABLE: {selectedTable.tableName}
                </span>
              </div>
              <h1 className="text-base font-bold text-white">{selectedTable.duty}</h1>
            </div>

            <button
              onClick={() => handleCopy(selectedTable.ddlSnippet)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "已复制 DDL" : "复制 SQL"}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
            <span className="text-slate-500">关键扩展字段: </span>
            <span className="text-purple-300 font-semibold">{selectedTable.keyFields}</span>
          </div>
        </div>

        {/* DDL SQL Snippet */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-purple-400" />
            PostgreSQL DDL 结构定义
          </span>
          <pre className="p-4 bg-slate-950 text-purple-200 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
            {selectedTable.ddlSnippet}
          </pre>
        </div>

        {/* TypeScript & Zod Schema */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            前端 TypeScript & Zod 运行时强校验契约
          </span>
          <pre className="p-4 bg-slate-950 text-cyan-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
            {selectedTable.typescriptSchema}
          </pre>
        </div>
      </div>
    </div>
  );
};
