import React, { useState } from "react";
import {
  Workflow,
  ExecutionTask,
  TraceEvent,
  NodeExecutionResult,
} from "../types/schemas.ts";
import { TraceViewer } from "./TraceViewer.tsx";
import {
  X,
  Play,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Coins,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Terminal,
} from "lucide-react";

interface ExecutionDrawerProps {
  workflow: Workflow;
  executionTask: ExecutionTask | null;
  isExecuting: boolean;
  onExecute: (inputs: Record<string, unknown>) => void;
  onClose: () => void;
}

export const ExecutionDrawer: React.FC<ExecutionDrawerProps> = ({
  workflow,
  executionTask,
  isExecuting,
  onExecute,
  onClose,
}) => {
  // Input parameters state
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const startNode = workflow.nodes.find((n) => n.type === "start");
    if (startNode?.data.startConfig?.inputVariables) {
      startNode.data.startConfig.inputVariables.forEach((iv) => {
        initial[iv.name] = String(iv.defaultValue ?? "");
      });
    } else {
      workflow.variables.forEach((v) => {
        initial[v.name] = String(v.defaultValue ?? "");
      });
    }
    return initial;
  });

  const [activeTab, setActiveTab] = useState<"timeline" | "traces" | "output">("timeline");
  const [copied, setCopied] = useState(false);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const handleRun = () => {
    const parsedInputs: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(inputs)) {
      try {
        parsedInputs[k] = typeof v === "string" ? JSON.parse(v) : v;
      } catch {
        parsedInputs[k] = v;
      }
    }
    onExecute(parsedInputs);
  };

  const copyOutput = () => {
    if (!executionTask?.output) return;
    navigator.clipboard.writeText(JSON.stringify(executionTask.output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
      />

      <div
        id="execution-drawer-overlay"
        className="fixed inset-x-0 bottom-0 max-h-[90vh] h-[85vh] w-full rounded-t-2xl border-t border-slate-700 bg-slate-900 text-slate-200 z-50 shadow-2xl flex flex-col md:inset-y-0 md:bottom-auto md:right-0 md:left-auto md:w-[540px] md:h-full md:rounded-none md:border-t-0 md:border-l md:border-slate-800 animate-in slide-in-from-bottom md:slide-in-from-right duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2 md:hidden shrink-0" />

        {/* Drawer Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">工作流执行与实时遥测</h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[200px] sm:max-w-xs">
                Target: {workflow.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Input Parameters Box */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">入参配置 (Workflow Inputs)</span>
          <button
            id="btn-trigger-execution"
            disabled={isExecuting}
            onClick={handleRun}
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
                <span>立即启动执行 (Run)</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
          {Object.keys(inputs).length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">当前流程无需额外入参。</div>
          ) : (
            Object.entries(inputs).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">{key}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execution Metrics Bar */}
      {executionTask && (
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">状态:</span>
            {executionTask.status === "completed" && (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 已完成 (Completed)
              </span>
            )}
            {executionTask.status === "running" && (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold animate-pulse">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> 执行中 (Running)
              </span>
            )}
            {executionTask.status === "failed" && (
              <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                <XCircle className="w-3.5 h-3.5" /> 失败 (Failed)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {executionTask.metrics.durationMs}ms
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {executionTask.metrics.tokenUsage.totalTokens} Tokens
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Coins className="w-3 h-3" />
              ${executionTask.metrics.costUsd.toFixed(5)}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/20 px-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === "timeline"
              ? "border-indigo-500 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          节点时序图 (Timeline)
        </button>
        <button
          onClick={() => setActiveTab("traces")}
          className={`py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === "traces"
              ? "border-indigo-500 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          调用 Trace 日志 ({executionTask?.traceEvents.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={`py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === "output"
              ? "border-indigo-500 text-indigo-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          最终输出 (Output)
        </button>
      </div>

      {/* Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-4 text-xs space-y-3">
        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-2">
            {!executionTask ? (
              <div className="text-center py-12 text-slate-500">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>点击上方「立即启动执行」开始运行工作流</p>
              </div>
            ) : (
              Object.values(executionTask.nodeResults).map((result: NodeExecutionResult) => {
                const isExpanded = expandedNodeId === result.nodeId;
                return (
                  <div
                    key={result.nodeId}
                    className="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedNodeId(isExpanded ? null : result.nodeId)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/60"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="font-semibold text-slate-200">
                          {result.nodeName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {result.nodeType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {result.status === "completed" && (
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {result.durationMs}ms
                          </span>
                        )}
                        {result.status === "running" && (
                          <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3 h-3 animate-spin" /> Running
                          </span>
                        )}
                        {result.status === "failed" && (
                          <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        )}
                        {result.status === "skipped" && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Skipped
                          </span>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 border-t border-slate-800/80 bg-slate-950 font-mono text-[11px] space-y-2">
                        {result.error && (
                          <div className="p-2 rounded bg-rose-950/40 border border-rose-800/50 text-rose-300">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500 font-sans block mb-1">输入参数 (Input):</span>
                          <pre className="p-2 bg-slate-900 rounded text-slate-300 overflow-x-auto">
                            {JSON.stringify(result.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans block mb-1">输出结果 (Output):</span>
                          <pre className="p-2 bg-slate-900 rounded text-emerald-300 overflow-x-auto">
                            {JSON.stringify(result.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TRACES TAB */}
        {activeTab === "traces" && (
          <div className="space-y-2">
            <TraceViewer
              task={executionTask}
              traceEvents={executionTask?.traceEvents || []}
              nodeResults={executionTask?.nodeResults || {}}
              initialMode="summary"
            />
          </div>
        )}

        {/* OUTPUT TAB */}
        {activeTab === "output" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">结构化响应 (Output JSON)</span>
              <button
                onClick={copyOutput}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "已复制" : "复制结果"}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto max-h-96">
              {JSON.stringify(executionTask?.output || {}, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
