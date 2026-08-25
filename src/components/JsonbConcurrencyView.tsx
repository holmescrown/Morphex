import React, { useState } from "react";
import {
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Terminal,
  Zap,
  Lock,
} from "lucide-react";
import { patchDynamicRecord, ConcurrencyConflictError } from "../services/recordService.ts";
import { DynamicRecord } from "../types/database.ts";

export const JsonbConcurrencyView: React.FC = () => {
  // 模拟当前记录状态
  const [currentRecord, setCurrentRecord] = useState<DynamicRecord>({
    id: "rec_live_0918",
    module_id: "mod_leads",
    workspace_id: "ws-default",
    data: {
      company_name: "云端智能股份有限公司",
      deal_amount: 320000,
      deal_stage: "方案报价",
      notes: "已发送第一阶段架构设计方案",
    },
    version: 3, // 当前数据库真实版本
    created_by: "agent_sales",
    updated_by: "agent_analyst",
    is_deleted: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Client A 与 Client B 的并发测试状态
  const [expectedVersionA, setExpectedVersionA] = useState<number>(3);
  const [patchDataA, setPatchDataA] = useState<string>(
    JSON.stringify({ deal_amount: 450000, notes: "Client A 修改：预算已增加" }, null, 2)
  );

  const [expectedVersionB, setExpectedVersionB] = useState<number>(3);
  const [patchDataB, setPatchDataB] = useState<string>(
    JSON.stringify({ deal_stage: "赢单成交", notes: "Client B 修改：已确认赢单" }, null, 2)
  );

  const [logs, setLogs] = useState<
    Array<{ id: string; time: string; source: string; status: "success" | "conflict" | "info"; msg: string }>
  >([
    {
      id: "log_init",
      time: new Date().toLocaleTimeString(),
      source: "SYSTEM",
      status: "info",
      msg: "数据库记录初始化完毕，当前版本为 v3",
    },
  ]);

  const addLog = (source: string, status: "success" | "conflict" | "info", msg: string) => {
    setLogs((prev) => [
      {
        id: "l_" + Math.random().toString(36).substring(2, 7),
        time: new Date().toLocaleTimeString(),
        source,
        status,
        msg,
      },
      ...prev,
    ]);
  };

  // 模拟 Client 执行 patch_dynamic_record RPC
  const executePatch = async (
    clientName: string,
    expectedVersion: number,
    patchJsonStr: string
  ) => {
    addLog(clientName, "info", `发起 patch_dynamic_record 调用，预期版本 v${expectedVersion}...`);

    try {
      const parsedPatch = JSON.parse(patchJsonStr);

      // 模拟原子更新与版本校验
      if (expectedVersion !== currentRecord.version) {
        throw new ConcurrencyConflictError(
          currentRecord.id,
          expectedVersion,
          currentRecord.version,
          `RPC 执行被拦截 (Version Mismatch): 期望版本为 v${expectedVersion}，数据库当前实际版本为 v${currentRecord.version}`
        );
      }

      // 模拟成功原子更新
      const nextVersion = currentRecord.version + 1;
      const updatedRecord: DynamicRecord = {
        ...currentRecord,
        data: {
          ...currentRecord.data,
          ...parsedPatch,
        },
        version: nextVersion,
        updated_by: clientName,
        updated_at: new Date().toISOString(),
      };

      setCurrentRecord(updatedRecord);
      addLog(
        clientName,
        "success",
        `RPC 更新成功！JSONB 数据已合并，数据库版本自动升级为 v${nextVersion}`
      );
    } catch (err: unknown) {
      if (err instanceof ConcurrencyConflictError) {
        addLog(clientName, "conflict", `【并发冲突已拦截】${err.message}`);
      } else {
        addLog(clientName, "conflict", `更新失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              JSONB 并发冲突与乐观锁调试器
              <span className="text-xs font-mono px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                patch_dynamic_record RPC
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              模拟两个客户端同时基于历史版本写数据时的冲突拦截机制，杜绝并发脏写。
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentRecord((prev) => ({ ...prev, version: 1 }));
            setExpectedVersionA(1);
            setExpectedVersionB(1);
            addLog("SYSTEM", "info", "已重置记录版本为 v1");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置沙箱状态</span>
        </button>
      </div>

      {/* Database State Display */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              数据库当前真实记录 (Single Source of Truth)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Record ID: {currentRecord.id}</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg">
              Version: v{currentRecord.version}
            </span>
          </div>
        </div>

        <pre className="p-3 bg-slate-950 text-purple-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800">
          {JSON.stringify(currentRecord, null, 2)}
        </pre>
      </div>

      {/* Dual Client Concurrent Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client A */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              客户端 A (Client A - 销售代表)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">期待版本:</span>
              <input
                type="number"
                value={expectedVersionA}
                onChange={(e) => setExpectedVersionA(Number(e.target.value))}
                className="w-14 px-2 py-0.5 bg-slate-950 text-indigo-300 border border-slate-700 rounded text-xs font-mono"
              />
            </div>
          </div>

          <textarea
            value={patchDataA}
            onChange={(e) => setPatchDataA(e.target.value)}
            rows={5}
            className="w-full p-2.5 bg-slate-950 text-indigo-200 font-mono text-xs rounded-xl border border-slate-800 resize-none focus:outline-none"
          />

          <button
            onClick={() => executePatch("Client A", expectedVersionA, patchDataA)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>执行 Patch RPC (提交 A 修改)</span>
          </button>
        </div>

        {/* Client B */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              客户端 B (Client B - AI 自动化分析师)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">期待版本:</span>
              <input
                type="number"
                value={expectedVersionB}
                onChange={(e) => setExpectedVersionB(Number(e.target.value))}
                className="w-14 px-2 py-0.5 bg-slate-950 text-cyan-300 border border-slate-700 rounded text-xs font-mono"
              />
            </div>
          </div>

          <textarea
            value={patchDataB}
            onChange={(e) => setPatchDataB(e.target.value)}
            rows={5}
            className="w-full p-2.5 bg-slate-950 text-cyan-200 font-mono text-xs rounded-xl border border-slate-800 resize-none focus:outline-none"
          />

          <button
            onClick={() => executePatch("Client B", expectedVersionB, patchDataB)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>执行 Patch RPC (提交 B 修改)</span>
          </button>
        </div>
      </div>

      {/* Execution Trace Logs */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            RPC 调用与并发审计日志
          </h3>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                log.status === "conflict"
                  ? "bg-rose-950/40 border-rose-800/50 text-rose-200"
                  : log.status === "success"
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-200"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              <span className="text-slate-500 shrink-0">{log.time}</span>
              <span className="font-bold shrink-0">[{log.source}]</span>
              <span className="flex-1">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
