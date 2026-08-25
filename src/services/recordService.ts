import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase.ts";
import {
  DynamicRecord,
  DynamicRecordSchema,
  DynamicField,
  TaskLog,
  TaskLogSchema,
  TokenUsage,
} from "../types/database.ts";

/**
 * ============================================================================
 * 1. 错误类型定义与乐观锁并发冲突异常
 * ============================================================================
 */

export class ConcurrencyConflictError extends Error {
  public readonly recordId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion?: number;

  constructor(recordId: string, expectedVersion: number, actualVersion?: number, message?: string) {
    super(
      message ||
        `并发冲突: 记录 ${recordId} 的期望版本为 ${expectedVersion}，但已被其他操作更新为版本 ${actualVersion ?? "未知"}`
    );
    this.name = "ConcurrencyConflictError";
    this.recordId = recordId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

export interface PatchDynamicRecordParams {
  recordId: string;
  expectedVersion: number;
  patchData: Record<string, unknown>;
  updatedBy?: string | null;
}

export interface PatchDynamicRecordResult {
  success: boolean;
  record: DynamicRecord;
  version: number;
}

/**
 * ============================================================================
 * 2. 封装原子更新 RPC (patch_dynamic_record)
 *    支持 JSONB 深度合并与基于 version 乐观并发锁机制
 * ============================================================================
 */
export async function patchDynamicRecord(
  params: PatchDynamicRecordParams
): Promise<PatchDynamicRecordResult> {
  const { recordId, expectedVersion, patchData, updatedBy = null } = params;

  try {
    // 优先调用 Supabase Postgres RPC 函数 patch_dynamic_record
    const { data, error } = await supabase.rpc("patch_dynamic_record", {
      p_record_id: recordId,
      p_expected_version: expectedVersion,
      p_patch_data: patchData,
      p_updated_by: updatedBy,
    });

    if (error) {
      // 捕获 Postgres 自定义异常 (例如 SQLSTATE 'P0001' 或特定 conflict 信息)
      if (
        error.message?.includes("conflict") ||
        error.message?.includes("version mismatch") ||
        error.code === "P0001"
      ) {
        throw new ConcurrencyConflictError(recordId, expectedVersion, undefined, error.message);
      }

      // 如果 RPC 函数未在服务端部署，自动降级为标准 SQL 条件原子更新
      console.warn("RPC patch_dynamic_record not available, falling back to conditional query update:", error.message);
      return await fallbackPatchDynamicRecord(params);
    }

    const parsed = DynamicRecordSchema.parse(data);
    return {
      success: true,
      record: parsed,
      version: parsed.version,
    };
  } catch (err: unknown) {
    if (err instanceof ConcurrencyConflictError) {
      throw err;
    }
    // 尝试降级处理
    return await fallbackPatchDynamicRecord(params);
  }
}

/**
 * 降级原子更新逻辑（使用 Supabase 条件过滤 .eq('version', expectedVersion) 确保无脏写）
 */
async function fallbackPatchDynamicRecord(
  params: PatchDynamicRecordParams
): Promise<PatchDynamicRecordResult> {
  const { recordId, expectedVersion, patchData, updatedBy } = params;

  // 1. 查询当前记录现有 JSONB 数据与版本
  const { data: currentRecord, error: fetchErr } = await supabase
    .from("dynamic_records")
    .select("*")
    .eq("id", recordId)
    .single();

  if (fetchErr || !currentRecord) {
    throw new Error(`找不到记录: ${recordId}, ${fetchErr?.message ?? ""}`);
  }

  const currentVersion = currentRecord.version;
  if (currentVersion !== expectedVersion) {
    throw new ConcurrencyConflictError(recordId, expectedVersion, currentVersion);
  }

  // 2. JSONB 深度合并
  const mergedData = {
    ...(currentRecord.data || {}),
    ...patchData,
  };

  const nextVersion = currentVersion + 1;

  // 3. 带乐观锁条件的更新
  const { data: updatedRecord, error: updateErr } = await supabase
    .from("dynamic_records")
    .update({
      data: mergedData,
      version: nextVersion,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .eq("version", expectedVersion) // 乐观锁核心条件
    .select()
    .single();

  if (updateErr || !updatedRecord) {
    throw new ConcurrencyConflictError(
      recordId,
      expectedVersion,
      undefined,
      updateErr?.message || "更新失败，该记录可能刚刚已被其他人修改"
    );
  }

  const parsed = DynamicRecordSchema.parse(updatedRecord);
  return {
    success: true,
    record: parsed,
    version: parsed.version,
  };
}

/**
 * ============================================================================
 * 3. 动态字段容错解析函数 getFieldValue
 *    规则：
 *    1. 优先读取 field.field_key 当前最新键名
 *    2. 若值为 undefined 或 null，依序遍历 field.deprecated_keys 兜底历史旧键名
 *    3. 若均不存在，返回 field.default_value
 * ============================================================================
 */
export function getFieldValue<T = unknown>(
  recordData: Record<string, unknown> | null | undefined,
  field: DynamicField | { field_key: string; deprecated_keys?: string[]; default_value?: unknown }
): T | undefined {
  if (!recordData || typeof recordData !== "object") {
    return (field.default_value as T) ?? undefined;
  }

  // 1. 优先检查当前主键名
  const currentKey = field.field_key;
  if (Object.prototype.hasOwnProperty.call(recordData, currentKey)) {
    const val = recordData[currentKey];
    if (val !== undefined && val !== null) {
      return val as T;
    }
  }

  // 2. 兜底遍历历史废弃键名 (deprecated_keys)
  const deprecatedKeys = field.deprecated_keys || [];
  for (const oldKey of deprecatedKeys) {
    if (oldKey && Object.prototype.hasOwnProperty.call(recordData, oldKey)) {
      const val = recordData[oldKey];
      if (val !== undefined && val !== null) {
        return val as T;
      }
    }
  }

  // 3. 默认值兜底
  if (field.default_value !== undefined && field.default_value !== null) {
    return field.default_value as T;
  }

  return undefined;
}

/**
 * 辅助工具：平滑迁移 Record 数据，将 deprecated_keys 中的历史字段值自动规范化写入当前 canonical field_key
 */
export function normalizeRecordData(
  recordData: Record<string, unknown>,
  fields: DynamicField[]
): {
  normalized: Record<string, unknown>;
  migratedKeysCount: number;
} {
  const result: Record<string, unknown> = { ...recordData };
  let migratedKeysCount = 0;

  for (const field of fields) {
    const canonicalKey = field.field_key;
    const hasCurrentKey =
      Object.prototype.hasOwnProperty.call(result, canonicalKey) &&
      result[canonicalKey] !== undefined &&
      result[canonicalKey] !== null;

    if (!hasCurrentKey && field.deprecated_keys?.length) {
      for (const oldKey of field.deprecated_keys) {
        if (
          Object.prototype.hasOwnProperty.call(result, oldKey) &&
          result[oldKey] !== undefined &&
          result[oldKey] !== null
        ) {
          // 迁移旧值到新键名
          result[canonicalKey] = result[oldKey];
          migratedKeysCount++;
          break;
        }
      }
    }
  }

  return { normalized: result, migratedKeysCount };
}

/**
 * ============================================================================
 * 4. Realtime 订阅 Hook: dynamic_records
 *    监听指定 module 的记录新增 (INSERT)、修改 (UPDATE)、删除 (DELETE)
 * ============================================================================
 */
export interface UseDynamicRecordsRealtimeOptions {
  workspaceId?: string;
  autoFetchInitial?: boolean;
  onRecordChange?: (event: "INSERT" | "UPDATE" | "DELETE", record: DynamicRecord) => void;
}

export function useDynamicRecordsRealtime(
  moduleId: string | null | undefined,
  options: UseDynamicRecordsRealtimeOptions = {}
) {
  const { workspaceId, autoFetchInitial = true, onRecordChange } = options;
  const [records, setRecords] = useState<DynamicRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const callbackRef = useRef(onRecordChange);
  callbackRef.current = onRecordChange;

  // 1. 初始化拉取数据
  const fetchRecords = useCallback(async () => {
    if (!moduleId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from("dynamic_records")
        .select("*")
        .eq("module_id", moduleId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const parsedRecords = (data || []).map((item) => DynamicRecordSchema.parse(item));
      setRecords(parsedRecords);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "获取记录列表失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [moduleId, workspaceId]);

  useEffect(() => {
    if (autoFetchInitial) {
      fetchRecords();
    }
  }, [fetchRecords, autoFetchInitial]);

  // 2. Supabase Realtime 频道监听
  useEffect(() => {
    if (!moduleId) return;

    const channelName = `dynamic_records_module_${moduleId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dynamic_records",
          filter: `module_id=eq.${moduleId}`,
        },
        (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";

          if (eventType === "INSERT") {
            try {
              const newRec = DynamicRecordSchema.parse(payload.new);
              if (!newRec.is_deleted) {
                setRecords((prev) => {
                  if (prev.some((r) => r.id === newRec.id)) return prev;
                  return [newRec, ...prev];
                });
                callbackRef.current?.("INSERT", newRec);
              }
            } catch (e) {
              console.error("解析 Realtime INSERT record 失败:", e);
            }
          } else if (eventType === "UPDATE") {
            try {
              const updatedRec = DynamicRecordSchema.parse(payload.new);
              setRecords((prev) => {
                if (updatedRec.is_deleted) {
                  return prev.filter((r) => r.id !== updatedRec.id);
                }
                const index = prev.findIndex((r) => r.id === updatedRec.id);
                if (index === -1) {
                  return [updatedRec, ...prev];
                }
                const next = [...prev];
                next[index] = updatedRec;
                return next;
              });
              callbackRef.current?.("UPDATE", updatedRec);
            } catch (e) {
              console.error("解析 Realtime UPDATE record 失败:", e);
            }
          } else if (eventType === "DELETE") {
            const oldId = (payload.old as { id?: string })?.id;
            if (oldId) {
              setRecords((prev) => prev.filter((r) => r.id !== oldId));
              callbackRef.current?.(
                "DELETE",
                payload.old as unknown as DynamicRecord
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [moduleId]);

  return {
    records,
    setRecords,
    loading,
    error,
    refetch: fetchRecords,
  };
}

/**
 * ============================================================================
 * 5. Realtime 订阅 Hook: task_logs (Trace 审计日志流)
 *    监听指定 task 的流式日志、计算实时累加 Token 消耗与成本
 * ============================================================================
 */
export interface UseTaskLogsRealtimeOptions {
  autoFetchInitial?: boolean;
  onNewLog?: (log: TaskLog) => void;
}

export function useTaskLogsRealtime(
  taskId: string | null | undefined,
  options: UseTaskLogsRealtimeOptions = {}
) {
  const { autoFetchInitial = true, onNewLog } = options;
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const onNewLogRef = useRef(onNewLog);
  onNewLogRef.current = onNewLog;

  // 1. 初始化拉取日志
  const fetchLogs = useCallback(async () => {
    if (!taskId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from("task_logs")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (fetchErr) throw fetchErr;

      const parsedLogs = (data || []).map((l) => TaskLogSchema.parse(l));
      setLogs(parsedLogs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "获取任务日志失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (autoFetchInitial) {
      fetchLogs();
    }
  }, [fetchLogs, autoFetchInitial]);

  // 2. 实时日志订阅
  useEffect(() => {
    if (!taskId) return;

    const channelName = `task_logs_${taskId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_logs",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          try {
            const newLog = TaskLogSchema.parse(payload.new);
            setLogs((prev) => {
              if (prev.some((l) => l.id === newLog.id)) return prev;
              return [...prev, newLog];
            });
            onNewLogRef.current?.(newLog);
          } catch (e) {
            console.error("解析 Realtime TaskLog 失败:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  // 3. 计算聚合 Token 消耗与成本
  const aggregatedTokenUsage: TokenUsage = logs.reduce(
    (acc, log) => {
      if (log.token_usage) {
        acc.prompt_tokens += log.token_usage.prompt_tokens || 0;
        acc.completion_tokens += log.token_usage.completion_tokens || 0;
        acc.total_tokens += log.token_usage.total_tokens || 0;
        acc.cost_usd += log.token_usage.cost_usd || 0;
      }
      return acc;
    },
    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost_usd: 0 }
  );

  return {
    logs,
    loading,
    error,
    aggregatedTokenUsage,
    refetch: fetchLogs,
  };
}
