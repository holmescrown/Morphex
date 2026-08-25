import React, { useState } from "react";
import { ExecutionTask, TraceEvent, NodeExecutionResult } from "../types/schemas.ts";
import { TraceViewer } from "./TraceViewer.tsx";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Coins,
  Search,
  ChevronRight,
  Terminal,
  Filter,
} from "lucide-react";

interface ExecutionHistoryProps {
  executions: ExecutionTask[];
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ executions }) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<ExecutionTask | null>(executions[0] || null);

  const filteredTasks = executions.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        task.targetName.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="execution-history-root" className="flex-1 flex h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Left List of Executions */}
      <div className="w-[380px] border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>任务调用历史与遥测审计</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              共 {executions.length} 条
            </span>
          </div>

          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务或目标..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300"
            >
              <option value="all">全部状态</option>
              <option value="completed">已完成 (Completed)</option>
              <option value="failed">失败 (Failed)</option>
              <option value="running">运行中 (Running)</option>
            </select>
          </div>
        </div>

        {/* Task Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              无匹配的历史调用记录
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                  selectedTask?.id === task.id
                    ? "bg-indigo-950/30 border-indigo-500/50 text-white shadow-md shadow-indigo-950/30"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs truncate max-w-[220px]">
                    {task.targetName}
                  </span>
                  <div className="flex items-center gap-1">
                    {task.status === "completed" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {task.status === "failed" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {task.metrics.durationMs}ms
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Zap className="w-3 h-3" />
                    {task.metrics.tokenUsage.totalTokens} Tokens
                  </span>
                  <span className="text-slate-500">
                    {new Date(task.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Detail Inspection Panel with Dual-Layer TraceViewer */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {selectedTask ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-white">{selectedTask.targetName}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    ID: {selectedTask.id}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>触发方式: {selectedTask.triggeredBy}</span>
                  <span>开始时间: {new Date(selectedTask.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Metrics Pills */}
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedTask.metrics.durationMs}ms</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-amber-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{selectedTask.metrics.tokenUsage.totalTokens} Tokens</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-emerald-400">
                  <Coins className="w-3.5 h-3.5" />
                  <span>${selectedTask.metrics.costUsd.toFixed(5)}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Body embedding TraceViewer and details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Dual-Layer TraceViewer */}
              <TraceViewer
                task={selectedTask}
                traceEvents={selectedTask.traceEvents}
                nodeResults={selectedTask.nodeResults}
                initialMode="summary"
              />

              {/* Output Box */}
              <div className="space-y-1.5">
                <span className="font-bold text-xs text-slate-300">最终输出结果 (Task Output):</span>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedTask.output, null, 2)}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            请从左侧选择一条调用记录查看遥测详情
          </div>
        )}
      </div>
    </div>
  );
};
