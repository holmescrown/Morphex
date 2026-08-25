import React, { useState } from "react";
import {
  ListTodo,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Webhook,
  Database,
  Calendar,
  Terminal,
  Activity,
  Layers,
  Sliders,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { AutomationTask, TaskTriggerType, TaskStatus } from "../types/database.ts";
import { AgentTaskDrawer } from "./AgentTaskDrawer.tsx";
import { TraceViewer } from "./TraceViewer.tsx";
import { ExecutionTask } from "../types/schemas.ts";

export const AutomationTasksView: React.FC = () => {
  const [tasks, setTasks] = useState<AutomationTask[]>([
    {
      id: "task_01",
      workspace_id: "ws-default",
      agent_id: "agent_sales",
      name: "销售商机评分与智能分类",
      trigger_type: "webhook",
      trigger_config: {
        source_ip: "10.0.4.12",
        webhook_secret: "whsec_live_9921a8c",
      },
      status: "completed",
      payload: {
        deal_id: "deal_9821",
        customer_tier: "Enterprise",
        budget: 250000,
      },
      result: {
        score: 95,
        assigned_rep: "Sarah Lee",
        priority: "High",
      },
      priority: 8,
      retry_count: 0,
      max_retries: 3,
      error_message: null,
      started_at: new Date(Date.now() - 120000).toISOString(),
      finished_at: new Date(Date.now() - 95000).toISOString(),
      created_at: new Date(Date.now() - 150000).toISOString(),
      updated_at: new Date(Date.now() - 95000).toISOString(),
    },
    {
      id: "task_02",
      workspace_id: "ws-default",
      agent_id: "agent_analyst",
      name: "客户表动态记录数据变更监听 (data_change)",
      trigger_type: "data_change",
      trigger_config: {
        watched_module_id: "mod_leads",
        watched_events: ["insert", "update"],
      },
      status: "running",
      payload: {
        record_id: "rec-001",
        changed_fields: ["deal_amount", "deal_stage"],
      },
      result: null,
      priority: 5,
      retry_count: 0,
      max_retries: 3,
      error_message: null,
      started_at: new Date(Date.now() - 15000).toISOString(),
      finished_at: null,
      created_at: new Date(Date.now() - 30000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "task_03",
      workspace_id: "ws-default",
      agent_id: "agent_guard",
      name: "每日合规性审计与数据脱敏 (cron)",
      trigger_type: "cron",
      trigger_config: {
        cron_expression: "0 2 * * *",
      },
      status: "pending",
      payload: {
        scope: "global_workspace",
      },
      result: null,
      priority: 3,
      retry_count: 0,
      max_retries: 3,
      error_message: null,
      started_at: null,
      finished_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<AutomationTask | null>(tasks[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<AutomationTask | null>(null);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            已完成
          </span>
        );
      case "running":
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            运行中
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            失败
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3" />
            排队中
          </span>
        );
    }
  };

  const getTriggerIcon = (type: TaskTriggerType) => {
    switch (type) {
      case "webhook":
        return <Webhook className="w-3.5 h-3.5 text-purple-400" />;
      case "data_change":
        return <Database className="w-3.5 h-3.5 text-cyan-400" />;
      case "cron":
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Play className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const openDrawerForTask = (taskToOpen?: AutomationTask) => {
    setDrawerTask(taskToOpen || null);
    setIsDrawerOpen(true);
  };

  // Convert selected automation task to ExecutionTask format for TraceViewer
  const convertToExecutionTask = (t: AutomationTask): ExecutionTask => {
    return {
      id: t.id,
      targetId: t.agent_id || "agent_default",
      targetType: "agent",
      targetName: t.name,
      status: t.status === "completed" ? "completed" : t.status === "failed" ? "failed" : "running",
      input: t.payload,
      output: t.result || {},
      nodeResults: {},
      traceEvents: [
        {
          id: `tr_${t.id}_1`,
          timestamp: Date.now() - 320,
          eventType: "task_start",
          message: `收到 ${t.trigger_type} 触发信号，初始化任务上下文`,
        },
        {
          id: `tr_${t.id}_2`,
          timestamp: Date.now() - 210,
          eventType: "condition_eval",
          nodeName: "SQL Filter & Scope",
          message: "SQL 范围检查通过，圈定操作数据记录集",
        },
        {
          id: `tr_${t.id}_3`,
          timestamp: Date.now() - 130,
          eventType: "llm_call",
          nodeName: "Gemini 3.7 Flash",
          message: "完成意图解析与决策推荐",
          details: { tokens: 490, cost_usd: 0.000098 },
        },
        {
          id: `tr_${t.id}_4`,
          timestamp: Date.now() - 20,
          eventType: t.status === "failed" ? "task_error" : "task_complete",
          message: t.status === "failed" ? (t.error_message || "任务执行失败") : "任务执行成功，已完成安全合规脱敏",
        },
      ],
      metrics: {
        durationMs: 320,
        tokenUsage: {
          promptTokens: 350,
          completionTokens: 140,
          totalTokens: 490,
        },
        costUsd: 0.000098,
      },
      triggeredBy: t.trigger_type === "manual" ? "manual" : "webhook",
      createdAt: t.created_at as string,
    };
  };

  return (
    <div className="flex-1 flex h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              自动化任务队列
            </h2>
          </div>

          <button
            id="btn-new-task-drawer"
            onClick={() => openDrawerForTask()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>新建编排</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {tasks.map((task) => {
            const isSelected = selectedTask?.id === task.id;
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 border-indigo-500/50 shadow-md shadow-indigo-950/40"
                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                    {getTriggerIcon(task.trigger_type)}
                    <span>{task.trigger_type}</span>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
                <h3 className="text-xs font-semibold text-white truncate">{task.name}</h3>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-mono">
                  <span>优先级 P{task.priority}</span>
                  <span>{new Date(task.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Task Details & State Machine */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {selectedTask ? (
          <>
            {/* Header Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-indigo-400">
                      ID: {selectedTask.id}
                    </span>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                  <h1 className="text-base font-bold text-white">{selectedTask.name}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDrawerForTask(selectedTask)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 rounded-xl shadow-sm transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>打开任务编排抽屉 (Drawer)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTask({
                        ...selectedTask,
                        status: "running",
                        started_at: new Date().toISOString(),
                      });
                      setTimeout(() => {
                        setSelectedTask({
                          ...selectedTask,
                          status: "completed",
                          finished_at: new Date().toISOString(),
                        });
                      }, 1000);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>手动触发执行</span>
                  </button>
                </div>
              </div>

              {/* Grid Props */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">触发源</span>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    {getTriggerIcon(selectedTask.trigger_type)}
                    <span>{selectedTask.trigger_type}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">重试次数</span>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5 font-mono">
                    {selectedTask.retry_count} / {selectedTask.max_retries}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">分配 Agent</span>
                  <div className="text-xs font-semibold text-indigo-300 font-mono mt-0.5">
                    {selectedTask.agent_id || "未绑定"}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">优先级</span>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5 font-mono">
                    Priority {selectedTask.priority} / 10
                  </div>
                </div>
              </div>
            </div>

            {/* TraceViewer Embedded Section */}
            <div className="space-y-2">
              <TraceViewer
                task={convertToExecutionTask(selectedTask)}
                initialMode="summary"
              />
            </div>

            {/* Payload & Result JSON */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    任务输入载荷 (Input Payload)
                  </span>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-56">
                  {JSON.stringify(selectedTask.payload, null, 2)}
                </pre>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    执行结果 (Result Snapshot)
                  </span>
                </div>
                <pre className="p-3 bg-slate-950 text-cyan-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-56">
                  {selectedTask.result
                    ? JSON.stringify(selectedTask.result, null, 2)
                    : "// 任务就绪或正在执行中..."}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            请在左侧选择一个任务查看详情
          </div>
        )}
      </div>

      {/* Progressive Collapsible AgentTaskDrawer */}
      <AgentTaskDrawer
        task={drawerTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRunTask={(newConfig) => {
          if (drawerTask) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === drawerTask.id
                  ? { ...t, ...newConfig, updated_at: new Date().toISOString() }
                  : t
              )
            );
          } else {
            const created: AutomationTask = {
              id: `task_${Date.now().toString(36)}`,
              workspace_id: "ws-default",
              agent_id: (newConfig.agent_id as string) || "agent_sales",
              name: newConfig.name || "新自动化任务",
              trigger_type: newConfig.trigger_type || "manual",
              trigger_config: {},
              status: "completed",
              payload: newConfig.payload || {},
              result: { auto_result: "OK", score: 98 },
              priority: newConfig.priority || 7,
              retry_count: 0,
              max_retries: newConfig.max_retries || 3,
              error_message: null,
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setTasks((prev) => [created, ...prev]);
            setSelectedTask(created);
          }
        }}
      />
    </div>
  );
};
