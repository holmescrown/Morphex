import React, { useState } from "react";
import {
  AutomationTask,
  TaskTriggerType,
  TaskStatus,
} from "../types/database.ts";
import {
  TraceEvent,
  ExecutionTask,
  NodeExecutionResult,
} from "../types/schemas.ts";
import { TraceViewer } from "./TraceViewer.tsx";
import {
  X,
  Play,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Database,
  ShieldCheck,
  Activity,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode2,
  Filter,
  Layers,
  Plus,
  Trash2,
  Check,
  Copy,
  Clock,
  Zap,
  Coins,
  Lock,
  UserCheck,
  Send,
  HelpCircle,
} from "lucide-react";

export interface SqlFilterRule {
  id: string;
  field: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "IS NULL" | "JSON_CONTAINS";
  value: string;
}

export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: "high" | "medium" | "low";
}

export interface AgentTaskDrawerProps {
  task?: AutomationTask | null;
  isOpen: boolean;
  onClose: () => void;
  onRunTask?: (configuredTask: Partial<AutomationTask>) => void;
  availableAgents?: Array<{ id: string; name: string; avatar?: string }>;
}

export const AgentTaskDrawer: React.FC<AgentTaskDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onRunTask,
  availableAgents = [
    { id: "agent_sales", name: "销售商机与分类 Agent", avatar: "💼" },
    { id: "agent_analyst", name: "数据变更监听与分析 Agent", avatar: "📊" },
    { id: "agent_guard", name: "合规审计与风控 Agent", avatar: "🛡️" },
    { id: "agent_finance", name: "财务精算与退款审核 Agent", avatar: "💰" },
  ],
}) => {
  if (!isOpen) return null;

  // Progressive Accordion Expansion State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dispatch: true,
    sqlFilter: true,
    approval: true,
    trace: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Section 1: Dispatch & Inputs
  const [taskName, setTaskName] = useState(task?.name || "新自动化 Agent 执行任务");
  const [selectedAgentId, setSelectedAgentId] = useState(task?.agent_id || availableAgents[0]?.id);
  const [triggerType, setTriggerType] = useState<TaskTriggerType>(task?.trigger_type || "manual");
  const [priority, setPriority] = useState<number>(task?.priority || 7);
  const [maxRetries, setMaxRetries] = useState<number>(task?.max_retries || 3);
  const [rawPayloadMode, setRawPayloadMode] = useState(false);
  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify(
      task?.payload || {
        deal_id: "deal_9821",
        customer_tier: "Enterprise",
        budget: 250000,
        contact_email: "ceo@megacorp.com",
        region: "APAC",
      },
      null,
      2
    )
  );

  // Section 2: SQL Filter & Conditions
  const [sqlMode, setSqlMode] = useState<"visual" | "raw">("visual");
  const [logicalOp, setLogicalOp] = useState<"AND" | "OR">("AND");
  const [sqlRules, setSqlRules] = useState<SqlFilterRule[]>([
    { id: "rule_1", field: "budget", operator: ">=", value: "50000" },
    { id: "rule_2", field: "customer_tier", operator: "=", value: "'Enterprise'" },
    { id: "rule_3", field: "status", operator: "!=", value: "'archived'" },
  ]);
  const [rawSqlExpression, setRawSqlExpression] = useState(
    "WHERE budget >= 50000 AND customer_tier = 'Enterprise' AND status != 'archived'"
  );

  // Section 3: Human-in-the-loop Approval & Policies
  const [approvalPolicies, setApprovalPolicies] = useState<ApprovalPolicy[]>([
    {
      id: "pol_push",
      name: "涉及外部 Webhook / 消息群发需人工预览",
      description: "在向飞书、企微或公网 Webhook 广播前暂停，需审核员核对消息内容",
      enabled: true,
      severity: "medium",
    },
    {
      id: "pol_money",
      name: "涉及资金/退款/信用额度变动 (> ¥10,000) 强制审批",
      description: "拦截所有金额超过阈值的写操作，必须由财务主管签名放行",
      enabled: true,
      severity: "high",
    },
    {
      id: "pol_mutation",
      name: "高危 SQL UPDATE / DELETE 批量写操作拦截",
      description: "防止批量数据误覆写，强制进行影响行数评估与人工确认",
      enabled: true,
      severity: "high",
    },
    {
      id: "pol_masking",
      name: "敏感数据 (身份证/手机号/秘钥) 自动脱敏合规校验",
      description: "在输出前自动执行掩码脱敏并生成脱敏审计签名",
      enabled: true,
      severity: "low",
    },
  ]);

  const [approvalStatus, setApprovalStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "BYPASS">("PENDING");
  const [approverRole, setApproverRole] = useState("安全审计主管 (SecOps Lead)");
  const [approvalComment, setApprovalComment] = useState("已核对客户信用评级与审批阈值，符合风控合规要求。");

  // Section 4: Live Execution & Trace
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTraceTask, setActiveTraceTask] = useState<ExecutionTask | null>(() => {
    return {
      id: task?.id || `task_${Math.random().toString(36).substring(2, 8)}`,
      targetId: selectedAgentId || "agent_sales",
      targetType: "agent",
      targetName: taskName,
      status: task?.status === "completed" ? "completed" : "completed",
      input: {
        deal_id: "deal_9821",
        customer_tier: "Enterprise",
        budget: 250000,
      },
      output: {
        score: 95,
        assigned_rep: "Sarah Lee",
        priority: "High",
        approval_state: "APPROVED",
        governance_verdict: "PASSED",
      },
      nodeResults: {},
      traceEvents: [
        {
          id: "tr_1",
          timestamp: Date.now() - 450,
          eventType: "task_start",
          message: `启动自动化任务 [${taskName}]，触发源: ${triggerType}`,
        },
        {
          id: "tr_2",
          timestamp: Date.now() - 380,
          eventType: "node_enter",
          nodeName: "SQL 动态数据检索过滤器",
          message: `应用 SQL 过滤规则: WHERE budget >= 50000 AND customer_tier = 'Enterprise'`,
        },
        {
          id: "tr_3",
          timestamp: Date.now() - 260,
          eventType: "llm_call",
          nodeName: "Agent 意图与价值评分引擎",
          message: "调用 Gemini 3.7 Flash 评估商机等级与决策置信度 (Confidence: 99.4%)",
          details: { model: "gemini-3.7-flash", tokens: 520, cost_usd: 0.000104 },
        },
        {
          id: "tr_4",
          timestamp: Date.now() - 140,
          eventType: "tool_call",
          nodeName: "企业政策精算工具",
          message: "执行原子工具计算所得税与提成比例",
        },
        {
          id: "tr_5",
          timestamp: Date.now() - 50,
          eventType: "task_complete",
          message: "自动化任务执行完成，输出已完成合规脱敏并生成结构化结果。",
        },
      ],
      metrics: {
        durationMs: 450,
        tokenUsage: {
          promptTokens: 380,
          completionTokens: 140,
          totalTokens: 520,
        },
        costUsd: 0.000104,
      },
      triggeredBy: "manual",
      createdAt: new Date().toISOString(),
    };
  });

  // Generate live SQL query string from visual rules
  const generateSqlPreview = () => {
    if (sqlRules.length === 0) return "SELECT * FROM dynamic_module_records";
    const clauses = sqlRules.map((r) => `${r.field} ${r.operator} ${r.value}`);
    return `SELECT * FROM dynamic_module_records\nWHERE ${clauses.join(`\n  ${logicalOp} `)}`;
  };

  const handleAddSqlRule = () => {
    const newRule: SqlFilterRule = {
      id: `rule_${Date.now()}`,
      field: "priority",
      operator: ">=",
      value: "5",
    };
    setSqlRules([...sqlRules, newRule]);
  };

  const handleRemoveSqlRule = (id: string) => {
    setSqlRules(sqlRules.filter((r) => r.id !== id));
  };

  const handleUpdateSqlRule = (id: string, updates: Partial<SqlFilterRule>) => {
    setSqlRules(sqlRules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleApplyPresetFilter = (presetName: string) => {
    if (presetName === "high_value") {
      setSqlRules([
        { id: "r1", field: "budget", operator: ">=", value: "100000" },
        { id: "r2", field: "customer_tier", operator: "=", value: "'Enterprise'" },
      ]);
    } else if (presetName === "pending_review") {
      setSqlRules([
        { id: "r1", field: "status", operator: "=", value: "'pending'" },
        { id: "r2", field: "approval_needed", operator: "=", value: "true" },
      ]);
    } else if (presetName === "failed_retry") {
      setSqlRules([
        { id: "r1", field: "status", operator: "=", value: "'failed'" },
        { id: "r2", field: "retry_count", operator: "<", value: "3" },
      ]);
    }
  };

  const handleTogglePolicy = (id: string) => {
    setApprovalPolicies(
      approvalPolicies.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  // Run simulation / Dry Run
  const handleExecuteTask = () => {
    setIsExecuting(true);
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(payloadJson);
    } catch {
      parsedPayload = { raw_text: payloadJson };
    }

    const newTask: ExecutionTask = {
      id: `task_exec_${Date.now().toString(36)}`,
      targetId: selectedAgentId || "agent_sales",
      targetType: "agent",
      targetName: taskName,
      status: "running",
      input: parsedPayload,
      output: {},
      nodeResults: {},
      traceEvents: [
        {
          id: `tr_${Date.now()}_1`,
          timestamp: Date.now(),
          eventType: "task_start",
          message: `正在派发任务 [${taskName}]，应用 ${sqlRules.length} 条 SQL 动态筛选规则`,
        },
      ],
      metrics: {
        durationMs: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        costUsd: 0,
      },
      triggeredBy: triggerType === "manual" ? "manual" : "webhook",
      createdAt: new Date().toISOString(),
    };

    setActiveTraceTask(newTask);

    setTimeout(() => {
      // Simulate completed trace
      const completedTask: ExecutionTask = {
        ...newTask,
        status: "completed",
        output: {
          status: "SUCCESS",
          matched_records: 12,
          sql_filter_applied: sqlMode === "visual" ? generateSqlPreview() : rawSqlExpression,
          approval_status: approvalStatus,
          governance_checks: approvalPolicies.filter((p) => p.enabled).map((p) => p.name),
          result_payload: {
            assigned_agent: selectedAgentId,
            calculated_score: 96.8,
            action_taken: "AUTO_ASSIGN_AND_NOTIFY",
            processed_at: new Date().toISOString(),
          },
        },
        traceEvents: [
          ...newTask.traceEvents,
          {
            id: `tr_${Date.now()}_2`,
            timestamp: Date.now() + 120,
            eventType: "condition_eval",
            nodeName: "SQL Filter Guard",
            message: `SQL 条件匹配成功: ${sqlRules.length} 个条件全部满足`,
          },
          {
            id: `tr_${Date.now()}_3`,
            timestamp: Date.now() + 280,
            eventType: "llm_call",
            nodeName: "Agent 智能推断引擎",
            message: "Gemini 3.7 Flash 完成动态入参理解与业务策略生成",
            details: { tokens: 680, model: "gemini-3.7-flash" },
          },
          {
            id: `tr_${Date.now()}_4`,
            timestamp: Date.now() + 410,
            eventType: "tool_call",
            nodeName: "脱敏与审批网关",
            message: `审批流状态: [${approvalStatus}]，合规脱敏策略执行完毕`,
          },
          {
            id: `tr_${Date.now()}_5`,
            timestamp: Date.now() + 490,
            eventType: "task_complete",
            message: "任务全部执行完毕，数据已安全写入结果快照。",
          },
        ],
        metrics: {
          durationMs: 490,
          tokenUsage: {
            promptTokens: 460,
            completionTokens: 220,
            totalTokens: 680,
          },
          costUsd: 0.000136,
        },
      };

      setActiveTraceTask(completedTask);
      setIsExecuting(false);

      if (onRunTask) {
        onRunTask({
          name: taskName,
          agent_id: selectedAgentId,
          trigger_type: triggerType,
          priority,
          max_retries: maxRetries,
          payload: parsedPayload,
          status: "completed",
        });
      }
    }, 900);
  };

  return (
    <div
      id="agent-task-drawer-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="agent-task-drawer-content"
        className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 text-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden"
      >
        {/* Drawer Top Navigation Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">Agent 任务编排与治理抽屉</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Task Drawer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                渐进折叠面板 • SQL 动态过滤 • 人工审批流 • 双层执行 Trace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-run-agent-task"
              disabled={isExecuting}
              onClick={handleExecuteTask}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-md transition-all ${
                isExecuting
                  ? "bg-amber-600/70 cursor-not-allowed animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
              }`}
            >
              {isExecuting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>执行中...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>运行任务 (Run)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body with Progressive Accordion Panels */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* ============================================================ */}
          {/* PANEL 1: 任务调度与入参配置 (Dispatch & Inputs) */}
          {/* ============================================================ */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
            <div
              onClick={() => toggleSection("dispatch")}
              className="p-3.5 bg-slate-900/70 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors border-b border-slate-800/80"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <span className="font-bold text-slate-200">任务调度与入参载荷 (Task Dispatch & Inputs)</span>
                  <span className="text-slate-400 text-[11px] block">
                    配置执行 Agent、触发源、优先级及业务 Payload 入参
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] font-mono bg-slate-800 px-2 py-0.5 rounded">
                  优先级: {priority}
                </span>
                {expandedSections.dispatch ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>

            {expandedSections.dispatch && (
              <div className="p-4 space-y-3.5 bg-slate-950/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-medium">任务名称 (Task Name)</label>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-medium">目标 Agent (Target Agent)</label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      {availableAgents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.avatar || "🤖"} {ag.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-medium">触发源 (Trigger Type)</label>
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value as TaskTriggerType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="manual">手动调度 (Manual)</option>
                      <option value="webhook">Webhook 回调</option>
                      <option value="data_change">数据变更监听 (Data Change)</option>
                      <option value="cron">定时 Cron 任务</option>
                      <option value="workflow_event">工作流事件 (Workflow)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>执行优先级</span>
                      <span className="font-mono text-indigo-400 font-bold">{priority} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-medium">最大重试 (Max Retries)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Payload Editor */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      入参载荷快照 (Input Payload)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setPayloadJson(
                            JSON.stringify(
                              {
                                deal_id: "deal_sample_771",
                                customer_tier: "Enterprise",
                                budget: 320000,
                                request_type: "refund_audit",
                              },
                              null,
                              2
                            )
                          )
                        }
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        载入样本数据
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={payloadJson}
                    onChange={(e) => setPayloadJson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-amber-300 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* PANEL 2: SQL 动态数据检索过滤 (SQL Filter & Conditions) */}
          {/* ============================================================ */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
            <div
              onClick={() => toggleSection("sqlFilter")}
              className="p-3.5 bg-slate-900/70 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors border-b border-slate-800/80"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      SQL 动态数据检索过滤 (SQL Filter & Scope)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {sqlRules.length} Rules
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] block">
                    按 SQL 条件圈定任务操作数据范围，支持可视化规则构建与原生表达式
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSqlMode("visual");
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      sqlMode === "visual" ? "bg-cyan-600 text-white font-bold" : "text-slate-400"
                    }`}
                  >
                    可视化
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSqlMode("raw");
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      sqlMode === "raw" ? "bg-cyan-600 text-white font-bold" : "text-slate-400"
                    }`}
                  >
                    原生 SQL
                  </button>
                </div>
                {expandedSections.sqlFilter ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>

            {expandedSections.sqlFilter && (
              <div className="p-4 space-y-3 bg-slate-950/40">
                {/* Presets Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">快捷过滤预设:</span>
                    <button
                      onClick={() => handleApplyPresetFilter("high_value")}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-800"
                    >
                      💰 大额商机 (&gt;=10万)
                    </button>
                    <button
                      onClick={() => handleApplyPresetFilter("pending_review")}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-800"
                    >
                      ⏳ 待人工初审
                    </button>
                    <button
                      onClick={() => handleApplyPresetFilter("failed_retry")}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-800"
                    >
                      🔄 异常失败待重试
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">逻辑关系:</span>
                    <select
                      value={logicalOp}
                      onChange={(e) => setLogicalOp(e.target.value as "AND" | "OR")}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-cyan-300 font-mono"
                    >
                      <option value="AND">AND (同时满足)</option>
                      <option value="OR">OR (任一满足)</option>
                    </select>
                  </div>
                </div>

                {/* VISUAL SQL BUILDER */}
                {sqlMode === "visual" ? (
                  <div className="space-y-2">
                    {sqlRules.map((rule, idx) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 p-2 bg-slate-900/80 border border-slate-800 rounded-lg"
                      >
                        <span className="w-5 text-center font-mono text-[10px] text-slate-500">
                          {idx === 0 ? "IF" : logicalOp}
                        </span>

                        <input
                          type="text"
                          value={rule.field}
                          onChange={(e) => handleUpdateSqlRule(rule.id, { field: e.target.value })}
                          placeholder="字段列名 (e.g. budget)"
                          className="flex-1 min-w-[100px] bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                        />

                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            handleUpdateSqlRule(rule.id, {
                              operator: e.target.value as SqlFilterRule["operator"],
                            })
                          }
                          className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                        >
                          <option value="=">=</option>
                          <option value="!=">!=</option>
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                          <option value=">=">&gt;=</option>
                          <option value="<=">&lt;=</option>
                          <option value="LIKE">LIKE</option>
                          <option value="IN">IN</option>
                          <option value="IS NULL">IS NULL</option>
                          <option value="JSON_CONTAINS">JSON_CONTAINS</option>
                        </select>

                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => handleUpdateSqlRule(rule.id, { value: e.target.value })}
                          placeholder="比对值 (e.g. 50000)"
                          className="flex-1 min-w-[120px] bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                        />

                        <button
                          onClick={() => handleRemoveSqlRule(rule.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={handleAddSqlRule}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-300 rounded-lg text-xs font-medium w-full justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>添加 SQL 条件规则 (Add Condition)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 block font-mono">
                      原生 SQL WHERE 子句表达式 (Raw SQL Expression):
                    </label>
                    <textarea
                      rows={3}
                      value={rawSqlExpression}
                      onChange={(e) => setRawSqlExpression(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Generated SQL Statement Preview */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">
                    实时生成的 SQL 查询语句 (Live Preview):
                  </span>
                  <pre className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto">
                    {sqlMode === "visual" ? generateSqlPreview() : `SELECT * FROM dynamic_module_records\n${rawSqlExpression}`}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* PANEL 3: Human-in-the-Loop 审批流勾选与干预 (Approval Flow) */}
          {/* ============================================================ */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
            <div
              onClick={() => toggleSection("approval")}
              className="p-3.5 bg-slate-900/70 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors border-b border-slate-800/80"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      Human-in-the-Loop 审批流与安全干预
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        approvalStatus === "APPROVED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : approvalStatus === "REJECTED"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {approvalStatus}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] block">
                    高危操作熔断机制、策略清单勾选与人工审批签名
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[11px] text-slate-400">
                  {approvalPolicies.filter((p) => p.enabled).length} 项策略生效中
                </span>
                {expandedSections.approval ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>

            {expandedSections.approval && (
              <div className="p-4 space-y-3.5 bg-slate-950/40">
                {/* Policy Checklist */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    治理策略勾选清单 (Governance Policy Checklist):
                  </span>

                  <div className="grid grid-cols-1 gap-2">
                    {approvalPolicies.map((pol) => (
                      <div
                        key={pol.id}
                        onClick={() => handleTogglePolicy(pol.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                          pol.enabled
                            ? "bg-purple-950/20 border-purple-500/40 text-slate-200"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={pol.enabled}
                          onChange={() => {}}
                          className="mt-0.5 rounded accent-purple-500"
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-200">
                              {pol.name}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                pol.severity === "high"
                                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                                  : pol.severity === "medium"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {pol.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            {pol.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HITL Action Bar */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <span>人工审核控制台 (Approver Console)</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">审批角色:</span>
                      <select
                        value={approverRole}
                        onChange={(e) => setApproverRole(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                      >
                        <option value="安全审计主管 (SecOps Lead)">安全审计主管 (SecOps Lead)</option>
                        <option value="财务风控专员 (Finance Risk Lead)">财务风控专员 (Finance Risk Lead)</option>
                        <option value="系统超级管理员 (Super Admin)">系统超级管理员 (Super Admin)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">
                      审批意见与数字签名批注 (Approval Notes):
                    </label>
                    <textarea
                      rows={2}
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="输入审批核准依据或驳回原因..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setApprovalStatus("REJECTED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        approvalStatus === "REJECTED"
                          ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                          : "bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>驳回 (Reject)</span>
                    </button>

                    <button
                      onClick={() => setApprovalStatus("BYPASS")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        approvalStatus === "BYPASS"
                          ? "bg-slate-700 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>免审放行 (Bypass)</span>
                    </button>

                    <button
                      onClick={() => setApprovalStatus("APPROVED")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 text-white ${
                        approvalStatus === "APPROVED"
                          ? "bg-emerald-600 shadow-md shadow-emerald-950"
                          : "bg-emerald-700 hover:bg-emerald-600"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>核准通过 (Approve)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* PANEL 4: 实时执行遥测与双层日志 (Embedded TraceViewer) */}
          {/* ============================================================ */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden">
            <div
              onClick={() => toggleSection("trace")}
              className="p-3.5 bg-slate-900/70 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors border-b border-slate-800/80"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      实时执行遥测与双层日志 (Trace & Telemetry)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Dual-Layer Trace
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] block">
                    提供「小白摘要 (Summary)」与「专家 Raw Trace」实时日志观测
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                {expandedSections.trace ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>

            {expandedSections.trace && (
              <div className="p-3 bg-slate-950/40">
                <TraceViewer
                  task={activeTraceTask}
                  traceEvents={activeTraceTask?.traceEvents || []}
                  initialMode="summary"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
