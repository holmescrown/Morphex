import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  EyeOff,
  History,
} from "lucide-react";
import { getFieldValue, normalizeRecordData } from "../services/recordService.ts";
import { DynamicField } from "../types/database.ts";

export const FieldMigrationView: React.FC = () => {
  // 测试字段定义
  const testFields: DynamicField[] = [
    {
      id: "f_comp",
      module_id: "mod_demo",
      name: "企业/客户法定名称",
      field_key: "company_name",
      field_type: "text",
      is_required: true,
      is_unique: false,
      is_primary: true,
      is_hidden: false,
      deprecated_keys: ["corp_name", "client_title", "legacy_customer_name"],
      default_value: "默认企业",
      validation_rules: null,
      options: null,
      field_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_budget",
      module_id: "mod_demo",
      name: "采购预算金额 (¥)",
      field_key: "deal_amount",
      field_type: "number",
      is_required: false,
      is_unique: false,
      is_primary: false,
      is_hidden: false,
      deprecated_keys: ["budget", "estimated_cost", "total_price"],
      default_value: 0,
      validation_rules: null,
      options: null,
      field_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_archived_field",
      module_id: "mod_demo",
      name: "旧版财务税号 (已软删除/隐藏)",
      field_key: "tax_id_legacy",
      field_type: "text",
      is_required: false,
      is_unique: false,
      is_primary: false,
      is_hidden: true, // 软删除
      deprecated_keys: [],
      default_value: null,
      validation_rules: null,
      options: null,
      field_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 原始旧版 JSONB 数据 (模拟数据库中历史遗留格式)
  const initialRawJson = {
    corp_name: "未来智造集团（历史 corp_name 键）",
    estimated_cost: 360000,
    tax_id_legacy: "91310000XXXXXXXX",
    remark: "历史老系统通过 webhook 导入的数据",
  };

  const [rawInputJson, setRawInputJson] = useState<string>(
    JSON.stringify(initialRawJson, null, 2)
  );

  const [parsedResult, setParsedResult] = useState<Record<string, unknown> | null>(null);
  const [migrationStats, setMigrationStats] = useState<{ migratedKeysCount: number } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleTestParsing = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(rawInputJson);

      // 使用 getFieldValue 解析每一个字段
      const extracted: Record<string, unknown> = {};
      testFields.forEach((field) => {
        extracted[field.field_key] = getFieldValue(parsed, field);
      });

      // 使用 normalizeRecordData 进行平滑迁移
      const { normalized, migratedKeysCount } = normalizeRecordData(parsed, testFields);

      setParsedResult(normalized);
      setMigrationStats({ migratedKeysCount });
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : "JSON 格式解析失败");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              动态字段迁移与容错解析沙箱
              <span className="text-xs font-mono font-normal px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                getFieldValue
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              测试 <code className="text-purple-300 font-mono">is_hidden</code> 软删除与{" "}
              <code className="text-purple-300 font-mono">deprecated_keys</code>{" "}
              多级历史键名无损兜底。
            </p>
          </div>
        </div>

        <button
          onClick={handleTestParsing}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md shadow-purple-950/50 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>执行容错提取与规范化迁移</span>
        </button>
      </div>

      {/* Field Schema Definition Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            当前激活字段规范 (Schema)
          </h3>
          <span className="text-xs text-slate-400">含 1 个软删除字段与多个历史旧键映射</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">字段名称</th>
                <th className="py-2.5 px-3">Canonical Key</th>
                <th className="py-2.5 px-3">类型</th>
                <th className="py-2.5 px-3">历史容错键名 (deprecated_keys)</th>
                <th className="py-2.5 px-3">软删除状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {testFields.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-medium text-slate-200">{f.name}</td>
                  <td className="py-2.5 px-3 font-mono text-purple-300">{f.field_key}</td>
                  <td className="py-2.5 px-3 text-slate-400">{f.field_type}</td>
                  <td className="py-2.5 px-3">
                    {f.deprecated_keys && f.deprecated_keys.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {f.deprecated_keys.map((k) => (
                          <span
                            key={k}
                            className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-800 text-amber-300 border border-amber-500/20 rounded"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono">无</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {f.is_hidden ? (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded flex items-center gap-1 w-fit">
                        <EyeOff className="w-3 h-3" />
                        已软删除 (is_hidden=true)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        正常展示
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive JSON Input vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Payload */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-400" />
              历史遗留 Raw JSONB 载荷 (输入)
            </span>
            <button
              onClick={() => setRawInputJson(JSON.stringify(initialRawJson, null, 2))}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              重置用例
            </button>
          </div>

          <textarea
            value={rawInputJson}
            onChange={(e) => setRawInputJson(e.target.value)}
            rows={10}
            className="w-full p-3 bg-slate-950 text-amber-300 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500/50 resize-none"
          />

          {jsonError && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}
        </div>

        {/* Right: Output Payload */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              自动规范化后 JSONB 数据 (输出)
            </span>
            {migrationStats && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                已自动迁移 {migrationStats.migratedKeysCount} 个键名
              </span>
            )}
          </div>

          <pre className="h-[220px] p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-auto border border-slate-800">
            {parsedResult
              ? JSON.stringify(parsedResult, null, 2)
              : '// 点击上方 "执行容错提取与规范化迁移" 查看结果'}
          </pre>
        </div>
      </div>
    </div>
  );
};
