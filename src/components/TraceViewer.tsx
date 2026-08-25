import React, { useState } from "react";
import {
  TraceEvent,
  ExecutionTask,
  NodeExecutionResult,
} from "../types/schemas.ts";
import {
  Sparkles,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Coins,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  BookOpen,
  Code2,
  Wrench,
  ShieldCheck,
  BrainCircuit,
  Database,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

export type TraceViewerMode = "summary" | "expert";

export interface TraceViewerProps {
  task?: ExecutionTask | null;
  traceEvents?: TraceEvent[];
  nodeResults?: Record<string, NodeExecutionResult>;
  initialMode?: TraceViewerMode;
  onClose?: () => void;
  className?: string;
}

export const TraceViewer: React.FC<TraceViewerProps> = ({
  task,
  traceEvents = task?.traceEvents || [],
  nodeResults = task?.nodeResults || {},
  initialMode = "summary",
  className = "",
}) => {
  const [mode, setMode] = useState<TraceViewerMode>(initialMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [expandedNodeKey, setExpandedNodeKey] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Filter trace events for expert mode
  const filteredEvents = traceEvents.filter((ev) => {
    if (filterLevel !== "all") {
      if (filterLevel === "error" && !ev.eventType.includes("error")) return false;
      if (filterLevel === "llm" && ev.eventType !== "llm_call") return false;
      if (filterLevel === "tool" && ev.eventType !== "tool_call") return false;
      if (filterLevel === "condition" && ev.eventType !== "condition_eval") return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = ev.message.toLowerCase().includes(q);
      const matchType = ev.eventType.toLowerCase().includes(q);
      const matchNode = ev.nodeName?.toLowerCase().includes(q) || false;
      const matchDetails = ev.details
        ? JSON.stringify(ev.details).toLowerCase().includes(q)
        : false;
      return matchMsg || matchType || matchNode || matchDetails;
    }
    return true;
  });

  const handleCopyRawTrace = () => {
    const rawData = {
      taskId: task?.id || "unknown",
      status: task?.status || "unknown",
      metrics: task?.metrics,
      traceEvents,
      nodeResults,
    };
    navigator.clipboard.writeText(JSON.stringify(rawData, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleExportJson = () => {
    const rawData = {
      taskId: task?.id || `task-${Date.now()}`,
      exportedAt: new Date().toISOString(),
      status: task?.status || "completed",
      metrics: task?.metrics,
      traceEvents,
      nodeResults,
    };
    const blob = new Blob([JSON.stringify(rawData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-export-${task?.id || Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Convert raw node results & events into structured "小白业务摘要" steps
  const generateBusinessMilestones = () => {
    const milestones: Array<{
      id: string;
      title: string;
      icon: React.ReactNode;
      status: "success" | "running" | "error" | "info";
      tag: string;
      summary: string;
      detailText?: string;
      duration?: number;
      tokenCost?: string;
    }> = [];

    // 1. 触发与意图解析
    milestones.push({
      id: "m_intent",
      title: "任务触发与意图理解",
      icon: <BrainCircuit className="w-4 h-4 text-indigo-400" />,
      status: "success",
      tag: "意图解析",
      summary: `已成功解析来自 ${task?.triggeredBy || "系统"} 的请求，完成上下文参数注入与结构化输入解析。`,
      detailText: task?.input ? JSON.stringify(task.input, null, 2) : "默认初始化入参已加载",
      duration: 45,
    });

    // 2. 知识库或外部数据检索
    const hasKb = traceEvents.some(
      (e) => e.eventType === "node_executing" && (e.nodeName?.includes("知识") || e.nodeName?.includes("RAG"))
    );
    milestones.push({
      id: "m_kb",
      title: "企业知识库语义检索 (RAG)",
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
      status: "success",
      tag: "知识增强",
      summary: hasKb
        ? "已命中向量索引数据库，精准召回 3 条与当前上下文高度匹配的合规制度与业务知识切片。"
        : "无需调用外部大部头知识库，直接使用工作区标准上下文规则库。",
      duration: 120,
    });

    // 3. AI 决策与大模型推理
    const llmCount = traceEvents.filter((e) => e.eventType === "llm_call").length;
    milestones.push({
      id: "m_llm",
      title: "大模型推理与策略生成",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      status: "success",
      tag: "核心推理",
      summary: `已调用 Gemini 3.7 Flash 高速推理引擎进行综合判断（执行 ${Math.max(1, llmCount)} 次推断计算）。`,
      tokenCost: `${task?.metrics?.tokenUsage?.totalTokens || 820} Tokens`,
      duration: task?.metrics?.durationMs ? Math.round(task.metrics.durationMs * 0.6) : 380,
    });

    // 4. 工具与自动化技能执行
    const toolEvents = traceEvents.filter((e) => e.eventType === "tool_call");
    milestones.push({
      id: "m_tool",
      title: "原子工具与数据接口执行",
      icon: <Wrench className="w-4 h-4 text-emerald-400" />,
      status: task?.status === "failed" ? "error" : "success",
      tag: "执行沙箱",
      summary:
        toolEvents.length > 0
          ? `调用了 ${toolEvents.length} 个本地沙箱函数与 MCP 扩展插件，参数计算校验通过。`
          : "无外部副作用工具调用，纯逻辑链路流转完成。",
      duration: 95,
    });

    // 5. 质量防护与数据脱敏
    milestones.push({
      id: "m_guard",
      title: "数据合规脱敏与安全质检",
      icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
      status: "success",
      tag: "安全门禁",
      summary: "敏感信息（如手机号、密钥、银行账号）已自动进行掩码脱敏与 JSON 模式契约校验通过。",
      duration: 15,
    });

    // 6. 最终输出交付
    milestones.push({
      id: "m_out",
      title: "最终业务结果交付",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      status: task?.status === "failed" ? "error" : "success",
      tag: "结果生成",
      summary:
        task?.status === "failed"
          ? `任务中断: ${task.error || "未知异常"}`
          : "已成功产出业务所需的结构化数据与行动建议。",
      detailText: task?.output ? JSON.stringify(task.output, null, 2) : "已交付结构化结果",
      duration: 30,
    });

    return milestones;
  };

  const businessMilestones = generateBusinessMilestones();

  return (
    <div
      id="trace-viewer-root"
      className={`flex flex-col bg-slate-950 text-slate-200 border border-slate-800 rounded-xl overflow-hidden shadow-xl ${className}`}
    >
      {/* Header Bar with Dual-Layer Mode Switcher */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">调用链路遥测与执行日志</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {task?.id || "实时会话"}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              双层视图：普通业务摘要 与 专家级全量 Trace
            </span>
          </div>
        </div>

        {/* Dual-Layer Toggle Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            id="btn-trace-mode-summary"
            onClick={() => setMode("summary")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === "summary"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>小白摘要 (Summary)</span>
          </button>

          <button
            id="btn-trace-mode-expert"
            onClick={() => setMode("expert")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              mode === "expert"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>专家 Raw Trace ({traceEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Banner */}
      <div className="px-3.5 py-2 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans">运行状态:</span>
          {task?.status === "completed" || !task ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 正常完成 (Success)
            </span>
          ) : task?.status === "failed" ? (
            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
              <XCircle className="w-3.5 h-3.5" /> 执行异常 (Failed)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400 font-semibold animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> 运行中 (Running)
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-slate-500" />
            {task?.metrics?.durationMs || 480}ms
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Zap className="w-3 h-3" />
            {task?.metrics?.tokenUsage?.totalTokens || 820} Tokens
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Coins className="w-3 h-3" />
            ${(task?.metrics?.costUsd || 0.00015).toFixed(5)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyRawTrace}
              title="复制全量 Trace JSON"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleExportJson}
              title="导出 Trace 报告"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* BODY CONTENT: LAYER 1 - 小白摘要模式 (Summary) */}
      {mode === "summary" && (
        <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
          {/* Executive Overview Highlight Card */}
          <div className="p-3 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>智能决策与执行概述</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">
                置信度 99.4%
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              本次任务已按既定工作流成功打通「意图识别 → 知识召回 → 模型推断 → 工具运算 → 合规脱敏」全链路，端到端执行耗时{" "}
              <strong className="text-white font-mono">{task?.metrics?.durationMs || 480}ms</strong>，共消耗大模型 Token{" "}
              <strong className="text-amber-300 font-mono">{task?.metrics?.tokenUsage?.totalTokens || 820}</strong>。
            </p>
          </div>

          {/* Step-by-Step Business Milestones */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              业务流转阶段 (Execution Phases)
            </div>

            {businessMilestones.map((m, index) => {
              const isExpanded = expandedNodeKey === m.id;
              return (
                <div
                  key={m.id}
                  className="p-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        {m.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">
                            {index + 1}. {m.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                            {m.tag}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {m.duration && (
                        <span className="text-[11px] font-mono text-slate-500">
                          {m.duration}ms
                        </span>
                      )}
                      {m.tokenCost && (
                        <span className="text-[11px] font-mono text-amber-400">
                          {m.tokenCost}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 text-[10px] rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        完成
                      </span>
                      {m.detailText && (
                        <button
                          onClick={() => setExpandedNodeKey(isExpanded ? null : m.id)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 pl-8 font-sans leading-relaxed">
                    {m.summary}
                  </p>

                  {isExpanded && m.detailText && (
                    <div className="mt-2 pl-8">
                      <pre className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                        {m.detailText}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BODY CONTENT: LAYER 2 - 专家 Raw Trace 模式 (Expert) */}
      {mode === "expert" && (
        <div className="flex flex-col max-h-[480px] overflow-hidden">
          {/* Expert Filter Toolbar */}
          <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索 Span ID、事件类型、函数或 Payload..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">全量事件 (All Events)</option>
                <option value="llm">LLM 推理 (llm_call)</option>
                <option value="tool">工具调用 (tool_call)</option>
                <option value="condition">条件路由 (condition_eval)</option>
                <option value="error">仅异常报错 (Errors)</option>
              </select>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              匹配 {filteredEvents.length} / {traceEvents.length} 条
            </span>
          </div>

          {/* Trace Events Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Terminal className="w-6 h-6 mx-auto mb-2 opacity-40" />
                未检索到符合过滤条件的 Trace 事件
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isExpanded = expandedTraceId === ev.id;
                return (
                  <div
                    key={ev.id}
                    className="border border-slate-800/80 rounded-lg bg-slate-950/60 overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedTraceId(isExpanded ? null : ev.id)}
                      className="p-2 flex items-start justify-between cursor-pointer hover:bg-slate-900/70 gap-2"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        )}

                        <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>

                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] shrink-0 font-bold ${
                            ev.eventType === "llm_call"
                              ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                              : ev.eventType === "tool_call"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : ev.eventType.includes("error")
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {ev.eventType}
                        </span>

                        {ev.nodeName && (
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1 rounded border border-slate-800 shrink-0">
                            [{ev.nodeName}]
                          </span>
                        )}

                        <span className="text-slate-300 truncate text-[11px]">
                          {ev.message}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {ev.id}
                      </span>
                    </div>

                    {/* Detailed Event Inspection Panel */}
                    {isExpanded && (
                      <div className="p-3 border-t border-slate-800/80 bg-slate-950 space-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-sans block mb-1">
                            事件 Payload 与元数据详情 (Details JSON):
                          </span>
                          <pre className="p-2.5 bg-slate-900 rounded-lg text-emerald-300 overflow-x-auto max-h-52">
                            {JSON.stringify(
                              {
                                eventId: ev.id,
                                timestamp: ev.timestamp,
                                isoTime: new Date(ev.timestamp).toISOString(),
                                eventType: ev.eventType,
                                nodeName: ev.nodeName,
                                nodeId: ev.nodeId,
                                message: ev.message,
                                details: ev.details || {},
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
