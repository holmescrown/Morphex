// MODIFIED: Restructured AppShell with CubeLV-style AI Company Workspace Navigation & Integrated Chat
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
  MessageSquare,
  Plug,
  Boxes,
  Users,
  Compass,
  Calendar,
  Clock,
  Inbox,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Search,
  FolderTree,
  ChevronDown,
  Building2,
  Briefcase,
  Bookmark,
  Globe,
} from "lucide-react";
import { useModeStore } from "../store/modeStore.ts";
import { useCollabStore } from "../store/collabStore.ts";

export type ShellTab =
  // 顶部快捷切换
  | "files_data"
  | "chat"
  | "search"
  // 1. AI 公司 (AI Company Space)
  | "architecture" // 系统架构图画布 (System Flow Canvas)
  | "approvals"    // 待批阅
  | "trade_company" // 外贸公司
  | "devops_dept"  // 研发工程部
  | "finance_dept" // 金融投资部
  // 2. 行事历 & 待办 (Calendar & Tasks)
  | "calendar"
  | "today"
  | "assigned"
  | "inbox"
  | "followups"
  // 3. 笔记 (Notes & Strategy)
  | "quick_notes"
  | "shared_notes"
  | "interaction_reports"
  | "marketing_strategies"
  // 4. 卡片 / 数据库 (Cards & Database)
  | "customers"
  | "quotes"
  | "products"
  | "pi_management"
  | "production_orders"
  | "payments"
  | "modules"      // 跨领域业务空间
  | "agents"       // AI 员工团队
  | "hub"          // 公共资产广场
  | "mcp_market"   // MCP 市场
  | "public_apis"   // Public APIs 清洗与聚合
  | "knowledge"    // 企业知识库
  | "tasks"        // 任务队列
  // 5. 专家模式专属菜单 (Expert Mode Only)
  | "workflows"
  | "skills"
  | "tools"
  | "fields"
  | "concurrency"
  | "telemetry"
  | "database";

export interface NavSection {
  title: string;
  badge?: string;
  isExpertOnly?: boolean;
  items: {
    id: ShellTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[];
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

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "AI 公司 · 核心空间",
    items: [
      { id: "architecture", label: "架构图 (Flow Canvas)", icon: Layers, badge: "核心", badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
      { id: "approvals", label: "待批阅", icon: ShieldCheck, badge: "3", badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
      { id: "trade_company", label: "外贸出海公司", icon: Briefcase },
      { id: "devops_dept", label: "研发工程部", icon: Code2 },
      { id: "finance_dept", label: "金融投资部", icon: TrendingUp },
    ],
  },
  {
    title: "行事历 & 待办",
    items: [
      { id: "calendar", label: "行事历", icon: Calendar },
      { id: "today", label: "今天", icon: Clock, badge: "7", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
      { id: "assigned", label: "被指派", icon: Users },
      { id: "inbox", label: "收件匣", icon: Inbox, badge: "New", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
      { id: "followups", label: "跟进任务", icon: CheckCircle2 },
    ],
  },
  {
    title: "团队笔记",
    items: [
      { id: "quick_notes", label: "随手记", icon: FileText },
      { id: "shared_notes", label: "共享笔记", icon: Share2 },
      { id: "interaction_reports", label: "客户互动报告", icon: Sparkles, badge: "AI" },
      { id: "marketing_strategies", label: "行销策略", icon: TrendingUp },
    ],
  },
  {
    title: "卡片 / 数据库",
    items: [
      { id: "customers", label: "客户档案库", icon: Users },
      { id: "quotes", label: "报价追踪", icon: DollarSign },
      { id: "products", label: "产品目录", icon: Building2 },
      { id: "pi_management", label: "PI 管理", icon: FileText },
      { id: "production_orders", label: "生产订单", icon: Building2 },
      { id: "payments", label: "收款管理", icon: DollarSign },
      { id: "modules", label: "跨领域业务空间", icon: Table },
      { id: "agents", label: "AI 员工团队", icon: Bot },
      { id: "hub", label: "公共资产广场", icon: Compass, badge: "Hub" },
      { id: "mcp_market", label: "MCP 连接生态", icon: Plug, badge: "Eco" },
      { id: "public_apis", label: "公共 API 清洗与聚合", icon: Globe, badge: "Aggregator", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
      { id: "knowledge", label: "企业知识库", icon: Database },
      { id: "tasks", label: "协同任务队列", icon: ListTodo },
    ],
  },
  {
    title: "专家与底层调试",
    badge: "PRO",
    isExpertOnly: true,
    items: [
      { id: "workflows", label: "工作流编排画布", icon: GitFork, badge: "DAG" },
      { id: "skills", label: "MCP 技能注册表", icon: Cpu, badge: "MCP" },
      { id: "tools", label: "原子工具库", icon: Wrench, badge: "Tools" },
      { id: "fields", label: "字段迁移与容错", icon: Sliders, badge: "Schema" },
      { id: "concurrency", label: "JSONB 乐观锁调试", icon: ShieldAlert, badge: "RPC" },
      { id: "telemetry", label: "全量 Trace 控制台", icon: Activity, badge: "Trace" },
      { id: "database", label: "底层 DDL 数据契约", icon: FileCode2, badge: "DDL" },
    ],
  },
];

// 协同模式 (Standard / !isExpertMode) 核心高频入口与折叠分组
export interface CollabGroupSection {
  id: string;
  title: string;
  defaultOpen?: boolean;
  items: {
    id: ShellTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const COLLAB_CORE_ITEMS: {
  id: ShellTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}[] = [
  { id: "architecture", label: "架构图 (Flow Canvas)", icon: Layers, badge: "核心", badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
  { id: "approvals", label: "待我审批", icon: ShieldCheck, badge: "3", badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  { id: "chat", label: "协同聊天", icon: MessageSquare, badge: "AI", badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
];

export const COLLAB_GROUP_SECTIONS: CollabGroupSection[] = [
  {
    id: "daily_collab",
    title: "日常协作 & 待办",
    defaultOpen: true,
    items: [
      { id: "today", label: "今天", icon: Clock, badge: "7", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
      { id: "calendar", label: "行事历", icon: Calendar },
      { id: "inbox", label: "收件匣", icon: Inbox, badge: "New", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
      { id: "assigned", label: "被指派", icon: Users },
      { id: "followups", label: "跟进任务", icon: CheckCircle2 },
      { id: "quick_notes", label: "随手记", icon: FileText },
      { id: "shared_notes", label: "共享笔记", icon: Share2 },
      { id: "interaction_reports", label: "客户互动报告", icon: Sparkles, badge: "AI" },
      { id: "marketing_strategies", label: "行销策略", icon: TrendingUp },
    ],
  },
  {
    id: "business_data",
    title: "业务数据 & 资产",
    defaultOpen: true,
    items: [
      { id: "trade_company", label: "外贸出海公司", icon: Briefcase },
      { id: "devops_dept", label: "研发工程部", icon: Code2 },
      { id: "finance_dept", label: "金融投资部", icon: TrendingUp },
      { id: "customers", label: "客户档案库", icon: Users },
      { id: "quotes", label: "报价追踪", icon: DollarSign },
      { id: "products", label: "产品目录", icon: Building2 },
      { id: "pi_management", label: "PI 管理", icon: FileText },
      { id: "production_orders", label: "生产订单", icon: Building2 },
      { id: "payments", label: "收款管理", icon: DollarSign },
      { id: "modules", label: "跨领域业务空间", icon: Table },
      { id: "agents", label: "AI 员工团队", icon: Bot },
      { id: "hub", label: "公共资产广场", icon: Compass, badge: "Hub" },
      { id: "mcp_market", label: "MCP 连接生态", icon: Plug, badge: "Eco" },
      { id: "public_apis", label: "公共 API 清洗与聚合", icon: Globe, badge: "Aggregator", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
      { id: "knowledge", label: "企业知识库", icon: Database },
      { id: "tasks", label: "协同任务队列", icon: ListTodo },
    ],
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
  const { isChatDrawerOpen, toggleChatDrawer, activeMembers, messages } = useCollabStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Progressive Folding Accordion State in Collab Mode
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    daily_collab: false,
    business_data: false,
  });

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Route Guard
  useEffect(() => {
    if (!isExpertMode && EXPERT_ONLY_TABS.includes(activeTab)) {
      console.warn(`[Route Guard] 业务模式拦截: ${activeTab} -> 重定向至 architecture`);
      setActiveTab("architecture");
    }
  }, [isExpertMode, activeTab, setActiveTab]);

  // Keyboard shortcut Ctrl+K for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleModeSwitch = (targetExpert: boolean) => {
    setExpertMode(targetExpert);
    if (!targetExpert && EXPERT_ONLY_TABS.includes(activeTab)) {
      setActiveTab("architecture");
    }
  };

  return (
    <div
      id="app-shell-root"
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* =========================================================================
          1. 顶部栏 (Topbar: Brand + Mode Switcher + Presence + Quick Actions)
         ========================================================================= */}
      <header
        id="app-shell-topbar"
        className="h-14 bg-slate-900/95 backdrop-blur border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 shadow-md gap-2"
      >
        {/* Left: Brand Identity & Active Space Context */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-950/50 shrink-0">
            <WorkflowIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                Universal AI Studio
                <span
                  className={`px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono font-semibold rounded border shrink-0 ${
                    isExpertMode
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  }`}
                >
                  {isExpertMode ? "PRO · 专家" : "协同架构"}
                </span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate max-w-[150px] sm:max-w-xs hidden xs:block">
              {isExpertMode
                ? selectedWorkflowName
                  ? `当前流: ${selectedWorkflowName}`
                  : "DAG 编排与底层契约"
                : "AI 公司架构图 · 协同即时交流 · 多维数据库"}
            </p>
          </div>
        </div>

        {/* Center: Dual Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            id="mode-toggle-container"
            className="flex items-center p-0.5 sm:p-1 bg-slate-950/90 border border-slate-800 rounded-xl shadow-inner relative"
          >
            <button
              id="btn-mode-standard"
              onClick={() => handleModeSwitch(false)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isExpertMode
                  ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold shadow-md shadow-indigo-950/40 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="协同工作空间模式：展示系统架构图画布、团队即时交流与多维业务卡片"
            >
              <Sparkles className={`w-3.5 h-3.5 ${!isExpertMode ? "text-white" : "text-indigo-400"}`} />
              <span className="hidden sm:inline">AI 公司工作空间</span>
              <span className="sm:hidden">工作空间</span>
            </button>

            <button
              id="btn-mode-expert"
              onClick={() => handleModeSwitch(true)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isExpertMode
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-950/50 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
              title="专家模式：解锁工作流 DAG 画布、MCP 注册表、JSONB 乐观锁与 DDL 契约"
            >
              <Wrench className={`w-3.5 h-3.5 ${isExpertMode ? "text-white" : "text-purple-400"}`} />
              <span className="hidden sm:inline">专家开发模式</span>
              <span className="sm:hidden">专家</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  isExpertMode ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                PRO
              </span>
            </button>
          </div>
        </div>

        {/* Right: Presence Avatars + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Chat View Direct Entry */}
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all shadow-sm ${
              activeTab === "chat"
                ? "bg-indigo-600 text-white border-indigo-400"
                : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700/80"
            }`}
            title="进入内置即时交流中心"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">协同聊天</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-500/40 text-indigo-200">
                {messages.length}
              </span>
            )}
          </button>

          {/* Real-time Presence Avatars */}
          <div
            onClick={toggleChatDrawer}
            className="flex items-center -space-x-2 cursor-pointer hover:opacity-90 transition-opacity p-0.5 sm:p-1 bg-slate-950/60 rounded-xl border border-slate-800"
            title="点击打开团队协同抽屉"
          >
            {activeMembers.slice(0, 2).map((m) => (
              <div
                key={m.id}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs shadow-sm"
                title={`${m.name} (${m.role})`}
              >
                {m.avatar}
              </div>
            ))}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              +{activeMembers.length}
            </div>
          </div>

          {/* Expert Mode Quick Run */}
          {isExpertMode && onQuickRun && (
            <button
              id="shell-btn-quick-run"
              disabled={isExecuting}
              onClick={onQuickRun}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-xl shadow-sm transition-all ${
                isExecuting
                  ? "bg-amber-600/80 cursor-not-allowed animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
              }`}
              title="触发当前工作流执行"
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
          2. 主体区 (CubeLV-Style Sidebar + Main View)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar Navigation */}
        <aside
          id="app-shell-sidebar"
          className={`hidden md:flex bg-slate-900 border-r border-slate-800/80 flex-col justify-between transition-all duration-200 shrink-0 z-20 ${
            isSidebarCollapsed ? "w-16" : "w-60"
          }`}
        >
          {/* Top Quick Bar: 资料 / 聊天 / 搜索 */}
          <div className="p-2 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
            {!isSidebarCollapsed ? (
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => setActiveTab("modules")}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                    activeTab === "modules" || activeTab === "customers"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="资料与数据空间"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>资料</span>
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                    activeTab === "chat"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="即时交流中心"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>聊天</span>
                </button>
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                  title="全局搜索 (Ctrl+K)"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>搜索</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className="p-2 rounded-xl bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                  title="进入聊天"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Grouped Navigation Sections (Dual-Mode: Progressive Folding for Collab vs Full for Expert) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {!isExpertMode ? (
              <>
                {/* 1. Standard Mode: Top 3 Core High-Frequency Entries (常驻核心入口) */}
                <div className="space-y-1">
                  {!isSidebarCollapsed && (
                    <div className="px-2 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="truncate">核心工作区</span>
                      <span className="px-1 py-0.2 text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                        高频
                      </span>
                    </div>
                  )}

                  {COLLAB_CORE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left group ${
                          isActive
                            ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-950/40"
                            : "text-slate-200 hover:text-white hover:bg-slate-800/70"
                        } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? "text-white" : "text-indigo-400 group-hover:text-indigo-300"
                          }`}
                        />
                        {!isSidebarCollapsed && (
                          <div className="flex-1 flex items-center justify-between truncate">
                            <span className="truncate font-semibold">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                  item.badgeColor ||
                                  (isActive
                                    ? "bg-white/20 text-white border-white/30"
                                    : "bg-slate-800 text-slate-300 border-slate-700")
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

                {/* 2. Standard Mode: Progressive Collapsible Sections */}
                {COLLAB_GROUP_SECTIONS.map((group) => {
                  const isCollapsed = !!collapsedGroups[group.id];
                  const hasActiveChild = group.items.some((item) => item.id === activeTab);

                  return (
                    <div
                      key={group.id}
                      className="border border-slate-800/80 rounded-xl bg-slate-950/30 overflow-hidden"
                    >
                      {/* Accordion Header */}
                      {!isSidebarCollapsed ? (
                        <button
                          onClick={() => toggleGroupCollapse(group.id)}
                          className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[10px] font-bold tracking-wider uppercase truncate ${
                                hasActiveChild ? "text-indigo-300 font-semibold" : "text-slate-400 group-hover:text-slate-200"
                              }`}
                            >
                              {group.title}
                            </span>
                            <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {group.items.length}
                            </span>
                          </div>

                          <div className="flex items-center text-slate-500 group-hover:text-slate-300">
                            {isCollapsed ? (
                              <ChevronRight className="w-3 h-3 transition-transform" />
                            ) : (
                              <ChevronDown className="w-3 h-3 transition-transform" />
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="h-px bg-slate-800 my-1" />
                      )}

                      {/* Items in group (if not collapsed or in collapsed sidebar icon mode) */}
                      {(!isCollapsed || isSidebarCollapsed) && (
                        <div className="p-1 space-y-0.5">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                title={isSidebarCollapsed ? item.label : undefined}
                                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left group ${
                                  isActive
                                    ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-950/40"
                                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
                              >
                                <Icon
                                  className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-300"
                                  }`}
                                />
                                {!isSidebarCollapsed && (
                                  <div className="flex-1 flex items-center justify-between truncate">
                                    <span className="truncate">{item.label}</span>
                                    {item.badge && (
                                      <span
                                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                          item.badgeColor ||
                                          (isActive
                                            ? "bg-white/20 text-white border-white/30"
                                            : "bg-slate-800 text-slate-300 border-slate-700")
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
                  );
                })}
              </>
            ) : (
              /* Expert Mode: Full Detailed Multi-Section Flat Navigation */
              NAV_SECTIONS.map((section, sIdx) => {
                if (section.isExpertOnly && !isExpertMode) return null;

                return (
                  <div key={sIdx} className="space-y-1">
                    {!isSidebarCollapsed && (
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span className="truncate">{section.title}</span>
                        {section.badge && (
                          <span className="px-1 py-0.2 text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                            {section.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          title={isSidebarCollapsed ? item.label : undefined}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left group ${
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
                            <div className="flex-1 flex items-center justify-between truncate">
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                    item.badgeColor ||
                                    (isActive
                                      ? "bg-white/20 text-white border-white/30"
                                      : "bg-slate-800 text-slate-300 border-slate-700")
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
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2 border-t border-slate-800/80 bg-slate-900/80 shrink-0">
            <button
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

        {/* Main Content Area */}
        <main
          id="app-shell-main-content"
          className="flex-1 flex overflow-hidden relative pb-16 md:pb-0"
        >
          {children}
        </main>

        {/* =========================================================================
            3. Mobile Bottom TabBar (< 768px)
           ========================================================================= */}
        <nav
          id="mobile-bottom-tabbar"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-2 py-1.5 shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Tab 1: 架构图 */}
          <button
            onClick={() => setActiveTab("architecture")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "architecture"
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeTab === "architecture"
                  ? "bg-indigo-600/20 border border-indigo-500/40"
                  : "bg-transparent"
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-none">架构图</span>
          </button>

          {/* Tab 2: 聊天 */}
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "chat"
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeTab === "chat"
                  ? "bg-indigo-600/20 border border-indigo-500/40"
                  : "bg-transparent"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-none">聊天</span>
          </button>

          {/* Tab 3: 业务空间 / 卡片 */}
          <button
            onClick={() => setActiveTab("modules")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "modules" || activeTab === "customers"
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeTab === "modules"
                  ? "bg-indigo-600/20 border border-indigo-500/40"
                  : "bg-transparent"
              }`}
            >
              <Table className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-none">业务卡片</span>
          </button>

          {/* Tab 4: AI 员工 */}
          <button
            onClick={() => setActiveTab("agents")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === "agents"
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeTab === "agents"
                  ? "bg-indigo-600/20 border border-indigo-500/40"
                  : "bg-transparent"
              }`}
            >
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-none">AI员工</span>
          </button>

          {/* Tab 5: 协同抽屉 */}
          <button
            onClick={toggleChatDrawer}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              isChatDrawerOpen
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                isChatDrawerOpen
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-indigo-400"
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-none">协同抽屉</span>
          </button>
        </nav>
      </div>

      {/* =========================================================================
          4. Global Search Modal (Ctrl+K)
         ========================================================================= */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-slate-800 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-indigo-400" />
              <input
                type="text"
                autoFocus
                placeholder="搜索 AI员工、SOP流程、客户档案、MCP 连接器或数据库卡片..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                ESC 关闭
              </span>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-1 text-xs">
              <div className="text-[10px] font-bold text-slate-500 px-2 py-1 uppercase">
                快捷直达
              </div>
              <button
                onClick={() => {
                  setActiveTab("architecture");
                  setIsSearchModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>系统架构图画布 (System Flow Canvas)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">AI 公司</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("chat");
                  setIsSearchModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>即时协同交流中心 (Workspace Chat)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">聊天</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("approvals");
                  setIsSearchModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>待批阅清单 (Human Approvals)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">待办</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("public_apis");
                  setIsSearchModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>公共 API 清洗与垂直聚合引擎 (Public APIs)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">API 引擎</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("customers");
                  setIsSearchModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>全球客户档案库 (CRM)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">卡片/数据库</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
