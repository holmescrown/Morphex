import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Wrench,
  GitFork,
  Bot,
  Database,
  Layers,
  Activity,
  Table,
  Cpu,
  ShieldAlert,
  FileCode2,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  Play,
  Share2,
  Radio,
  Sliders,
  CheckCircle2,
  Workflow as WorkflowIcon,
  HardDrive,
  Code2,
  Shield,
  HelpCircle,
  LayoutDashboard,
} from "lucide-react";
import { useModeStore } from "../store/modeStore.ts";

export type ShellTab =
  // 业务模式 / 小白模式 (Business Mode)
  | "modules"
  | "agents"
  | "knowledge"
  | "tasks"
  // 专家模式专属菜单 (Expert Mode Only)
  | "workflows"
  | "skills"
  | "tools"
  | "fields"
  | "concurrency"
  | "telemetry"
  | "database";

export interface NavMenuItem {
  id: ShellTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  isExpertOnly?: boolean;
  badge?: string;
  category?: "business" | "expert";
}

// 专家专属 Tab 列表（用于严格路由守卫）
export const EXPERT_ONLY_TABS: ShellTab[] = [
  "workflows",
  "skills",
  "tools",
  "fields",
  "concurrency",
  "telemetry",
  "database",
];

export const NAV_MENU_ITEMS: NavMenuItem[] = [
  // =========================================================================
  // 1. 业务模式 / 小白模式基础菜单 (Standard Business Menu)
  // =========================================================================
  {
    id: "modules",
    label: "动态业务模块",
    shortLabel: "业务数据",
    icon: Table,
    description: "多维表格、工单看板与业务数据流",
    category: "business",
  },
  {
    id: "agents",
    label: "AI 员工",
    shortLabel: "AI 员工",
    icon: Bot,
    description: "预设卡片列表与一键启停配置",
    category: "business",
  },
  {
    id: "knowledge",
    label: "企业知识库",
    shortLabel: "知识库",
    icon: Database,
    description: "私有文档上传与语义知识检索",
    category: "business",
  },
  {
    id: "tasks",
    label: "任务执行队列",
    shortLabel: "执行队列",
    icon: ListTodo,
    description: "高层摘要进度与异步任务管理",
    category: "business",
  },

  // =========================================================================
  // 2. 专家模式专属菜单 (Expert Mode Only: 解锁底层编排与开发者工具)
  // =========================================================================
  {
    id: "workflows",
    label: "工作流编排画布",
    shortLabel: "编排画布",
    icon: GitFork,
    description: "DAG 节点连线可视化画布与逻辑编排",
    isExpertOnly: true,
    badge: "DAG",
    category: "expert",
  },
  {
    id: "skills",
    label: "MCP 技能注册表",
    shortLabel: "MCP 技能",
    icon: Cpu,
    description: "Model Context Protocol 与向量检索绑定",
    isExpertOnly: true,
    badge: "MCP",
    category: "expert",
  },
  {
    id: "tools",
    label: "原子工具库",
    shortLabel: "工具库",
    icon: Wrench,
    description: "JSON Schema 入参/出参与沙箱执行",
    isExpertOnly: true,
    badge: "Tools",
    category: "expert",
  },
  {
    id: "fields",
    label: "字段迁移与容错",
    shortLabel: "字段迁移",
    icon: Sliders,
    description: "is_hidden 软删除与 deprecated_keys 容错",
    isExpertOnly: true,
    badge: "Schema",
    category: "expert",
  },
  {
    id: "concurrency",
    label: "JSONB 乐观锁调试",
    shortLabel: "并发锁",
    icon: ShieldAlert,
    description: "patch_dynamic_record RPC 与并发冲突模拟",
    isExpertOnly: true,
    badge: "RPC",
    category: "expert",
  },
  {
    id: "telemetry",
    label: "全量 Trace 控制台",
    shortLabel: "Trace 审计",
    icon: Activity,
    description: "全链路追踪、Token 细粒度审计与遥测",
    isExpertOnly: true,
    badge: "Trace",
    category: "expert",
  },
  {
    id: "database",
    label: "底层 DDL 数据契约",
    shortLabel: "DDL 契约",
    icon: FileCode2,
    description: "Supabase PostgreSQL Schema 与 Zod 契约",
    isExpertOnly: true,
    badge: "DDL",
    category: "expert",
  },
];

interface AppShellProps {
  activeTab: ShellTab;
  setActiveTab: (tab: ShellTab) => void;
  children: React.ReactNode;
  selectedWorkflowName?: string;
  onQuickRun?: () => void;
  onOpenTemplates?: () => void;
  isExecuting?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  children,
  selectedWorkflowName,
  onQuickRun,
  onOpenTemplates,
  isExecuting,
}) => {
  const { isExpertMode, setExpertMode, toggleExpertMode } = useModeStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // =========================================================================
  // 严格路由守卫 (Route Guard):
  // 若处于业务模式 (isExpertMode === false)，且当前路由属于专家模式专属项，
  // 强制立即重定向至业务模式默认首页 ("modules" 动态业务模块)。
  // =========================================================================
  useEffect(() => {
    if (!isExpertMode && EXPERT_ONLY_TABS.includes(activeTab)) {
      console.warn(`[Route Guard] 业务模式拦截非法访问: ${activeTab} -> 重定向至 modules`);
      setActiveTab("modules");
    }
  }, [isExpertMode, activeTab, setActiveTab]);

  // 严格过滤菜单项：业务模式下 100% 隐藏专家级菜单
  const visibleBusinessItems = NAV_MENU_ITEMS.filter((item) => !item.isExpertOnly);
  const visibleExpertItems = NAV_MENU_ITEMS.filter((item) => item.isExpertOnly);

  const handleModeSwitch = (targetExpert: boolean) => {
    setExpertMode(targetExpert);
    if (!targetExpert && EXPERT_ONLY_TABS.includes(activeTab)) {
      setActiveTab("modules");
    }
  };

  return (
    <div
      id="app-shell-root"
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* =========================================================================
          1. 顶部栏 (Top Header with Sparkles <-> Wrench Dual Mode Switcher)
         ========================================================================= */}
      <header
        id="app-shell-topbar"
        className="h-14 bg-slate-900/95 backdrop-blur border-b border-slate-800/80 px-4 flex items-center justify-between z-30 shrink-0 shadow-md"
      >
        {/* Left: Brand Identity & Active Context */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-950/50">
            <WorkflowIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                No-Code Agent OS
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border ${
                    isExpertMode
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {isExpertMode ? "PRO · 专家模式" : "业务模式 (小白友好)"}
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px] md:max-w-xs">
              {isExpertMode
                ? selectedWorkflowName
                  ? `当前流: ${selectedWorkflowName}`
                  : "全功能开发与架构师控制台"
                : "直观业务看板 · AI 员工 · 知识库问答"}
            </p>
          </div>
        </div>

        {/* Center: Dual Mode Toggle Switcher */}
        <div className="flex items-center gap-3">
          <div
            id="mode-toggle-container"
            className="flex items-center p-1 bg-slate-950/90 border border-slate-800 rounded-xl shadow-inner relative"
          >
            {/* Business / Novice Mode Button (Sparkles) */}
            <button
              id="btn-mode-standard"
              onClick={() => handleModeSwitch(false)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isExpertMode
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-950/40 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="业务模式（小白模式）：隐藏底层 DAG 连线画布与 DDL/MCP 复杂配置，仅保留业务模块、AI 员工与知识库"
            >
              <Sparkles className={`w-3.5 h-3.5 ${!isExpertMode ? "text-slate-950" : "text-amber-400"}`} />
              <span>业务模式</span>
            </button>

            {/* Expert Mode Button (Wrench) */}
            <button
              id="btn-mode-expert"
              onClick={() => handleModeSwitch(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isExpertMode
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-950/50 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="专家模式：完整解锁工作流 DAG 连线画布、MCP 技能注册、JSONB 乐观锁调试与 DDL 契约"
            >
              <Wrench className={`w-3.5 h-3.5 ${isExpertMode ? "text-white" : "text-purple-400"}`} />
              <span>专家模式</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  isExpertMode ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                PRO
              </span>
            </button>
          </div>

          {/* Quick Mode Indicator / Helper Tag */}
          <div className="hidden lg:flex items-center text-[11px] text-slate-400">
            {!isExpertMode ? (
              <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                已精简复杂技术项
              </span>
            ) : (
              <span className="flex items-center gap-1 text-purple-300 font-medium">
                <Shield className="w-3 h-3 text-purple-400" />
                已解锁 11 个完整开发面板
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* 专家模式专属: 工作流模板库 */}
          {isExpertMode && onOpenTemplates && (
            <button
              id="shell-btn-templates"
              onClick={onOpenTemplates}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 rounded-lg transition-colors shadow-sm"
              title="打开预置工作流模板库"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>工作流模板</span>
            </button>
          )}

          {/* 专家模式专属: 快速测试运行 */}
          {isExpertMode && onQuickRun && (
            <button
              id="shell-btn-quick-run"
              disabled={isExecuting}
              onClick={onQuickRun}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-sm transition-all ${
                isExecuting
                  ? "bg-amber-600/80 cursor-not-allowed animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
              }`}
              title="触发当前工作流执行与 Trace 捕获"
            >
              {isExecuting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>执行中...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>运行流</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
          2. 主体区 (Sidebar + Dynamic Content Area)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          id="app-shell-sidebar"
          className={`bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-200 shrink-0 z-20 ${
            isSidebarCollapsed ? "w-16" : "w-60"
          }`}
        >
          {/* Top Menu List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {/* 1. 业务模式核心菜单 (小白友好) */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{isExpertMode ? "核心业务模块" : "业务功能中心"}</span>
                  {!isExpertMode && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                      标准
                    </span>
                  )}
                </div>
              )}

              {visibleBusinessItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    title={isSidebarCollapsed ? `${item.label} - ${item.description}` : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left group ${
                      isActive
                        ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-950/40"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-300"
                      }`}
                    />
                    {!isSidebarCollapsed && (
                      <div className="flex-1 truncate">
                        <div className="truncate font-semibold">{item.label}</div>
                        <div className="text-[10px] text-slate-400 truncate opacity-80">
                          {item.shortLabel}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 2. 专家模式专属菜单 (仅在 isExpertMode === true 时展示) */}
            {isExpertMode && (
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                {!isSidebarCollapsed && (
                  <div className="px-2 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-purple-400" />
                      专家与底层调试
                    </span>
                    <span className="px-1 py-0.2 text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                      DEV
                    </span>
                  </div>
                )}

                {visibleExpertItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-item-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      title={isSidebarCollapsed ? `${item.label} (专家)` : undefined}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left group ${
                        isActive
                          ? "bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/40"
                          : "text-purple-300/80 hover:text-purple-100 hover:bg-purple-950/40 border border-transparent hover:border-purple-800/30"
                      } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? "text-white" : "text-purple-400"
                        }`}
                      />
                      {!isSidebarCollapsed && (
                        <div className="flex-1 flex items-center justify-between truncate">
                          <div className="truncate font-semibold">{item.label}</div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                                isActive
                                  ? "bg-white/20 border-white/30 text-white"
                                  : "bg-purple-950/60 border-purple-800/50 text-purple-300"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Footer: Mode State summary & Collapse trigger */}
          <div className="p-2 border-t border-slate-800/80 space-y-2 bg-slate-900/80 shrink-0">
            {!isSidebarCollapsed && (
              <div
                onClick={toggleExpertMode}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isExpertMode
                    ? "bg-purple-950/40 border-purple-800/50 text-purple-200 hover:border-purple-600"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    {isExpertMode ? (
                      <Wrench className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {isExpertMode ? "专家开发模式" : "业务模式 (小白)"}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 hover:underline">
                    切换
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  {isExpertMode
                    ? "已解锁 DAG 画布、MCP 技能、JSONB 乐观锁等 7 个专家面板。"
                    : "已隐藏复杂 DAG 连线与 DDL，聚焦业务数据与 AI 员工。"}
                </p>
              </div>
            )}

            {/* Collapse / Expand Toggle Button */}
            <button
              id="sidebar-toggle-collapse"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>收起侧边栏</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main id="app-shell-main-content" className="flex-1 flex overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};

