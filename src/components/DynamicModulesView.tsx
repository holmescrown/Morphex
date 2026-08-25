import React, { useState } from "react";
import {
  Table,
  Plus,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Database,
  History,
  ShieldCheck,
} from "lucide-react";
import { DynamicModule, DynamicField, DynamicRecord } from "../types/database.ts";
import { getFieldValue } from "../services/recordService.ts";

export const DynamicModulesView: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>("mod_leads");

  // 模拟动态模块定义
  const modules: DynamicModule[] = [
    {
      id: "mod_leads",
      workspace_id: "ws-default",
      name: "销售商机与客户线索",
      slug: "leads",
      type: "table",
      icon: "Table",
      description: "跨部门销售机会流转与线索动态记录表",
      config: {
        form_submit_button_text: "提交线索",
        form_success_message: "线索已成功入库！",
        default_sort_order: "desc",
        visible_column_ids: [],
        page_size: 20,
      },
      order: 1,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mod_tickets",
      workspace_id: "ws-default",
      name: "客户工单与技术支持",
      slug: "tickets",
      type: "kanban",
      icon: "ListTodo",
      description: "工单状态流转与自动派单追踪",
      config: {
        kanban_group_field_id: "status",
        form_submit_button_text: "提交工单",
        form_success_message: "工单已提交给 AI 助手处理",
        default_sort_order: "desc",
        visible_column_ids: [],
        page_size: 20,
      },
      order: 2,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 模拟字段（包含 deprecated_keys 与 is_hidden）
  const fields: DynamicField[] = [
    {
      id: "f_title",
      module_id: "mod_leads",
      name: "客户/企业名称",
      field_key: "company_name",
      field_type: "text",
      is_required: true,
      is_unique: false,
      is_primary: true,
      is_hidden: false,
      deprecated_keys: ["client_name", "corp_title"], // 历史废弃键名
      default_value: "未知客户",
      validation_rules: null,
      options: null,
      field_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_amount",
      module_id: "mod_leads",
      name: "预计商机金额 (¥)",
      field_key: "deal_amount",
      field_type: "number",
      is_required: false,
      is_unique: false,
      is_primary: false,
      is_hidden: false,
      deprecated_keys: ["budget", "estimated_revenue"],
      default_value: 0,
      validation_rules: { min: 0 },
      options: null,
      field_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_stage",
      module_id: "mod_leads",
      name: "商机阶段",
      field_key: "deal_stage",
      field_type: "select",
      is_required: true,
      is_unique: false,
      is_primary: false,
      is_hidden: false,
      deprecated_keys: ["status", "pipeline_stage"],
      default_value: "初次接触",
      validation_rules: null,
      options: [
        { label: "初次接触", value: "lead", color: "blue" },
        { label: "需求对接", value: "discovery", color: "purple" },
        { label: "方案报价", value: "proposal", color: "amber" },
        { label: "赢单成交", value: "won", color: "emerald" },
      ],
      field_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_contact",
      module_id: "mod_leads",
      name: "联系人邮箱",
      field_key: "contact_email",
      field_type: "text",
      is_required: false,
      is_unique: false,
      is_primary: false,
      is_hidden: false,
      deprecated_keys: ["email", "mail_addr"],
      default_value: null,
      validation_rules: null,
      options: null,
      field_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_internal_score",
      module_id: "mod_leads",
      name: "内部 AI 潜客打分 (已隐藏/软删除)",
      field_key: "ai_score",
      field_type: "number",
      is_required: false,
      is_unique: false,
      is_primary: false,
      is_hidden: true, // 软删除/隐藏字段
      deprecated_keys: ["score_v1"],
      default_value: null,
      validation_rules: null,
      options: null,
      field_order: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 模拟动态 JSONB 记录（演示数据容错解析与版本乐观锁）
  const [records] = useState<DynamicRecord[]>([
    {
      id: "rec-001",
      module_id: "mod_leads",
      workspace_id: "ws-default",
      data: {
        company_name: "未来数智科技（上海）有限公司",
        deal_amount: 188000,
        deal_stage: "方案报价",
        contact_email: "contact@futuretech.ai",
      },
      version: 4,
      created_by: "agent_sales",
      updated_by: "agent_analyst",
      is_deleted: false,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "rec-002",
      module_id: "mod_leads",
      workspace_id: "ws-default",
      // 演示：该旧记录存放在 deprecated_keys 中（例如 client_name 与 budget）
      data: {
        client_name: "云端智造集团 (历史格式数据)",
        budget: 520000,
        status: "需求对接",
        mail_addr: "procurement@cloudcorp.cn",
      },
      version: 1,
      created_by: "system_import",
      updated_by: null,
      is_deleted: false,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ]);

  const activeModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const activeFields = fields.filter((f) => f.module_id === activeModule.id && !f.is_hidden);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Module Navigation & Sub Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {activeModule.name}
              <span className="text-xs font-normal text-slate-400 font-mono">
                slug: /{activeModule.slug}
              </span>
            </h2>
            <p className="text-xs text-slate-400">{activeModule.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Module Selector Pill */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModuleId(m.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  selectedModuleId === m.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>新建记录</span>
          </button>
        </div>
      </div>

      {/* Main Records Table Area */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">记录 ID</th>
                  {activeFields.map((f) => (
                    <th key={f.id} className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>{f.name}</span>
                        <span className="text-[9px] text-slate-500 font-normal">
                          ({f.field_key})
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center">乐观锁版本</th>
                  <th className="py-3 px-4">创建/更新者</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-slate-300">{rec.id}</span>
                      </div>
                    </td>

                    {/* Dynamic Field Values with getFieldValue fallback */}
                    {activeFields.map((f) => {
                      const value = getFieldValue(rec.data, f);
                      const isDeprecatedFallback =
                        !Object.prototype.hasOwnProperty.call(rec.data, f.field_key) &&
                        value !== undefined;

                      return (
                        <td key={f.id} className="py-3.5 px-4 text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">
                              {value !== undefined && value !== null
                                ? String(value)
                                : "—"}
                            </span>
                            {isDeprecatedFallback && (
                              <span
                                title="通过 deprecated_keys 容错自动回溯解析"
                                className="px-1 py-0.2 text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded"
                              >
                                兼容旧键
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Version Column */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md">
                        v{rec.version}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <div>{rec.updated_by || rec.created_by || "system"}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Banner: JSONB Concurrency & Schema Migration */}
        <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h4 className="text-xs font-bold text-indigo-200">
                JSONB 动态字段容错机制已激活 (getFieldValue)
              </h4>
              <p className="text-[11px] text-slate-400">
                支持无锁平滑字段键名迁移（例如 client_name 自动映射到 company_name），保障数据高可用。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
