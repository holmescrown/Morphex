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
  LayoutGrid,
  Code2,
  Cpu,
  Zap,
  Kanban,
  FileSpreadsheet,
} from "lucide-react";
import { DynamicModule, DynamicField, DynamicRecord } from "../types/database.ts";
import { getFieldValue } from "../services/recordService.ts";

export const DynamicModulesView: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>("mod_devops");

  // 跨领域通用业务空间模块 (Universal Dynamic Workspaces)
  const modules: DynamicModule[] = [
    {
      id: "mod_devops",
      workspace_id: "ws-default",
      name: "研发 DevOps 与代码审查 (DevOps)",
      slug: "devops_reviews",
      type: "table",
      icon: "Code2",
      description: "PR 审查记录、CI/CD 自动化流水线事件与代码漏洞检测动态流",
      config: {
        form_submit_button_text: "提交代码审查任务",
        form_success_message: "代码审查任务已触发 AI 员工执行！",
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
      id: "mod_design",
      workspace_id: "ws-default",
      name: "设计系统与项目敏捷看板 (Design & Sprint)",
      slug: "design_sprints",
      type: "kanban",
      icon: "ListTodo",
      description: "跨平台 Figma 设计稿评审、UI 规范同步与敏捷故事流转",
      config: {
        kanban_group_field_id: "status",
        form_submit_button_text: "新建需求卡片",
        form_success_message: "需求卡片已进入敏捷排期池",
        default_sort_order: "desc",
        visible_column_ids: [],
        page_size: 20,
      },
      order: 2,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "mod_finance",
      workspace_id: "ws-default",
      name: "财务精算与合规审计日志 (Finance)",
      slug: "finance_audits",
      type: "table",
      icon: "ShieldCheck",
      description: "发票三单校验、高风险交易预警与多币种汇率审计流水",
      config: {
        form_submit_button_text: "提交合规审计单",
        form_success_message: "审计记录已持久化并执行 JSONB 乐观锁校验",
        default_sort_order: "desc",
        visible_column_ids: [],
        page_size: 20,
      },
      order: 3,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 研发模块字段
  const fields: DynamicField[] = [
    {
      id: "f_title",
      module_id: "mod_devops",
      name: "Pull Request / 审查任务",
      field_key: "pr_title",
      field_type: "text",
      is_required: true,
      is_unique: false,
      is_primary: true,
      is_hidden: false,
      deprecated_keys: ["task_title", "title"], // 历史废弃键名兼容
      default_value: "PR #",
      validation_rules: null,
      options: null,
      field_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_repo",
      module_id: "mod_devops",
      name: "代码仓库 / 分支",
      field_key: "repository_branch",
      field_type: "text",
      is_required: true,
      is_unique: false,
      is_primary: false,
      is_hidden: false,
      deprecated_keys: ["repo_name", "git_ref"],
      default_value: "org/main",
      validation_rules: null,
      options: null,
      field_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_status",
      module_id: "mod_devops",
      name: "审查状态",
      field_key: "review_status",
      field_type: "select",
      is_required: true,
      is_unique: false,
      is_primary: false,
      is_hidden: false,
      deprecated_keys: ["status", "state"],
      default_value: "AI 审查通过",
      validation_rules: null,
      options: [
        { label: "待自动触发", value: "待自动触发", color: "blue" },
        { label: "AI 审查中", value: "AI 审查中", color: "amber" },
        { label: "AI 审查通过", value: "AI 审查通过", color: "emerald" },
        { label: "发现潜在漏洞", value: "发现潜在漏洞", color: "rose" },
      ],
      field_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_score",
      module_id: "mod_devops",
      name: "代码质量分 (100分制)",
      field_key: "quality_score",
      field_type: "number",
      is_required: false,
      is_unique: false,
      is_primary: false,
      is_hidden: false,
      deprecated_keys: ["score", "rating"],
      default_value: 95,
      validation_rules: { min: 0, max: 100 },
      options: null,
      field_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "f_deprecated_old",
      module_id: "mod_devops",
      name: "历史老版标记 (已软删除/隐藏)",
      field_key: "legacy_flag",
      field_type: "text",
      is_required: false,
      is_unique: false,
      is_primary: false,
      is_hidden: true, // 软隐藏
      deprecated_keys: ["old_tag"],
      default_value: null,
      validation_rules: null,
      options: null,
      field_order: 99,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 研发记录模拟（包含乐观锁版本号）
  const records: DynamicRecord[] = [
    {
      id: "rec_1",
      module_id: "mod_devops",
      workspace_id: "ws-default",
      data: {
        pr_title: "feat(engine): 支持沙箱超时熔断与 AsyncFunction 隔离执行",
        repository_branch: "ai-studio/core-engine:main",
        review_status: "AI 审查通过",
        quality_score: 98,
      },
      version: 3,
      created_by: "Alex (Staff Eng)",
      updated_by: "DevOps Reviewer Agent",
      is_deleted: false,
      created_at: "2026-08-28 09:12:00",
      updated_at: "2026-08-28 09:12:45",
    },
    {
      id: "rec_2",
      module_id: "mod_devops",
      workspace_id: "ws-default",
      data: {
        // 使用旧键名触发 deprecated_keys 容错
        title: "fix(mcp): 修复 GitHub Connector 双工握手连接超时重试",
        repo_name: "ai-studio/connectors:feat-mcp",
        status: "AI 审查中",
        score: 89,
      },
      version: 1,
      created_by: "David Kim",
      updated_by: "Alex",
      is_deleted: false,
      created_at: "2026-08-28 08:30:00",
      updated_at: "2026-08-28 08:30:00",
    },
    {
      id: "rec_3",
      module_id: "mod_devops",
      workspace_id: "ws-default",
      data: {
        pr_title: "security(auth): 升级 MCP OAuth2 Scope 严格鉴权",
        repository_branch: "ai-studio/security:patch-v2",
        review_status: "发现潜在漏洞",
        quality_score: 74,
      },
      version: 2,
      created_by: "Sarah Chen",
      updated_by: "DevOps Reviewer Agent",
      is_deleted: false,
      created_at: "2026-08-28 07:15:00",
      updated_at: "2026-08-28 07:16:30",
    },
  ];

  const currentModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const activeFields = fields.filter((f) => !f.is_hidden);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2 truncate">
              <span>跨领域业务空间</span>
              <span className="text-[9px] sm:text-[10px] font-mono font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                Workspaces
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden xs:block">
              DevOps 审查、敏捷看板、财务审计多维数据流
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-950/50 transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">新建业务记录</span>
            <span className="sm:hidden">新建</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace Modules Tabs */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModuleId(m.id)}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
              selectedModuleId === m.id
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {m.id === "mod_devops" && <Code2 className="w-3.5 h-3.5 text-cyan-400" />}
            {m.id === "mod_design" && <Kanban className="w-3.5 h-3.5 text-amber-400" />}
            {m.id === "mod_finance" && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="whitespace-nowrap">{m.name}</span>
          </button>
        ))}
      </div>

      {/* 3. Main Data Table (Desktop) & Card List (Mobile) with Dynamic Schema */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Module Description Banner */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="space-y-1 min-w-0">
            <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
              <span>{currentModule.name}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                slug: {currentModule.slug}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-xs">{currentModule.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-[11px] text-indigo-300/80 font-mono">
              活跃字段: {activeFields.length} 项 (已隐藏 1 项废弃字段)
            </span>
          </div>
        </div>

        {/* 3A. Mobile Touch Card Stream (< 768px) */}
        <div className="block md:hidden space-y-3">
          {records.map((record, index) => {
            const statusField = activeFields.find((f) => f.field_type === "select");
            const statusValue = statusField ? String(getFieldValue(record.data, statusField) || "--") : null;
            const primaryField = activeFields.find((f) => f.is_primary) || activeFields[0];
            const primaryValue = primaryField ? String(getFieldValue(record.data, primaryField) || "未命名记录") : `记录 #${index + 1}`;
            const otherFields = activeFields.filter((f) => f.id !== primaryField?.id && f.id !== statusField?.id);

            return (
              <div
                key={record.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-md hover:border-slate-700 transition-colors"
              >
                {/* Card Top: Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1">
                      <span>#{index + 1}</span>
                      <span>·</span>
                      <span className="text-purple-300 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/40">
                        v{record.version} 乐观锁
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-xs leading-snug line-clamp-2">
                      {primaryValue}
                    </h3>
                  </div>

                  {statusValue && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                        statusValue === "AI 审查通过"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : statusValue === "AI 审查中"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                          : statusValue === "发现潜在漏洞"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {statusValue}
                    </span>
                  )}
                </div>

                {/* Card Body: Dynamic Key-Values */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/60 bg-slate-950/40 -mx-3.5 -mb-1 px-3.5 py-2.5 rounded-b-xl">
                  {otherFields.map((field) => {
                    const value = getFieldValue(record.data, field);
                    const isScore = field.field_key === "quality_score";

                    return (
                      <div key={field.id} className="min-w-0">
                        <span className="text-[10px] text-slate-400 block truncate">{field.name}:</span>
                        {isScore ? (
                          <span className="font-mono font-bold text-indigo-300 text-xs">
                            {String(value || "--")} 分
                          </span>
                        ) : (
                          <span className="text-slate-200 font-medium truncate block">
                            {String(value || "--")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block truncate">更新者:</span>
                    <span className="text-slate-300 text-[10px] truncate block font-mono">
                      {record.updated_by || record.created_by || "System"}
                    </span>
                  </div>
                </div>

                {/* Card Action Row */}
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>{record.updated_at || record.created_at}</span>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors">
                    <Edit2 className="w-3 h-3" />
                    <span>编辑</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3B. Desktop Dynamic Records Table (>= 768px) */}
        <div className="hidden md:block bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                {activeFields.map((field) => (
                  <th key={field.id} className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-1 text-slate-200">
                      <span>{field.name}</span>
                      {field.deprecated_keys && field.deprecated_keys.length > 0 && (
                        <span
                          className="text-[9px] text-indigo-400 font-normal px-1 rounded bg-indigo-950/60 border border-indigo-800/40"
                          title={`兼容旧键名: ${field.deprecated_keys.join(", ")}`}
                        >
                          容错
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-slate-400 font-mono w-24">锁版本 (v)</th>
                <th className="py-3 px-4 text-slate-400 font-mono w-36">更新者</th>
                <th className="py-3 px-4 text-right w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {records.map((record, index) => (
                <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                    {index + 1}
                  </td>
                  {activeFields.map((field) => {
                    const value = getFieldValue(record.data, field);
                    const isSelect = field.field_type === "select";

                    return (
                      <td key={field.id} className="py-3 px-4">
                        {isSelect ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              value === "AI 审查通过"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : value === "AI 审查中"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                                : value === "发现潜在漏洞"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {String(value || "--")}
                          </span>
                        ) : field.field_key === "quality_score" ? (
                          <span className="font-mono font-bold text-indigo-300">
                            {String(value || "--")} 分
                          </span>
                        ) : (
                          <span className="text-slate-200 font-medium">{String(value || "--")}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 font-mono text-[11px] text-purple-300">
                    <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/40">
                      v{record.version}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-400 truncate max-w-[130px]">
                    {record.updated_by || record.created_by || "System"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="编辑记录"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
