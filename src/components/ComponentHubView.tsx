import React, { useState } from "react";
import {
  Sparkles,
  GitFork,
  Heart,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  Star,
  ExternalLink,
  Code2,
  Bot,
  Cpu,
  Layers,
  Zap,
  ArrowRight,
  TrendingUp,
  Tag,
} from "lucide-react";
import { useCollabStore } from "../store/collabStore.ts";

export interface HubAsset {
  id: string;
  type: "agent" | "workflow" | "mcp";
  title: string;
  domain: "DevOps & 代码" | "设计与产品" | "运营与新媒体" | "财务与合规" | "通用效率";
  description: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  stars: number;
  forks: number;
  tags: string[];
  features: string[];
  lastUpdated: string;
  isOfficial?: boolean;
}

const HUB_ASSETS: HubAsset[] = [
  {
    id: "hub_devops_pr_reviewer",
    type: "workflow",
    domain: "DevOps & 代码",
    title: "DevOps 代码规范与 PR 自动审查流",
    description: "自动连接 GitHub Webhook 触发，拉取 PR Diff、执行代码安全漏洞扫描并直接在 PR 中生成建议评论。",
    author: {
      name: "Alex (Staff Eng)",
      avatar: "👨‍💻",
      role: "DevOps Architect",
    },
    stars: 128,
    forks: 43,
    tags: ["GitHub MCP", "Code Review", "Gemini 3.7", "CI/CD"],
    features: ["自动解析 AST 与 Diff", "OWASP 漏洞检测", "直接回写 GitHub Issue 评论"],
    lastUpdated: "2 小时前",
    isOfficial: true,
  },
  {
    id: "hub_agent_finance_auditor",
    type: "agent",
    domain: "财务与合规",
    title: "财务精算与合规审计 Agent",
    description: "具备结构化发票解析、高风险资金流转拦截与多币种实时汇率校验能力的专业合规审查助手。",
    author: {
      name: "David Kim",
      avatar: "🧑‍🔬",
      role: "Financial Analyst",
    },
    stars: 94,
    forks: 31,
    tags: ["Financial", "Audit Log", "JSONB Concurrency", "Rules Engine"],
    features: ["发票 OCR 与三单匹配", "大额支付风控预警", "自动触发审批工作流"],
    lastUpdated: "4 小时前",
    isOfficial: true,
  },
  {
    id: "hub_mcp_notion_syncer",
    type: "mcp",
    domain: "设计与产品",
    title: "Notion & Figma 跨平台产品知识同步器",
    description: "基于标准 MCP 协议，一键连接 Notion 知识库和 Figma 设计稿变量，打通 PRD 到组件库的实时映射。",
    author: {
      name: "Sarah Chen",
      avatar: "👩‍💼",
      role: "Design Lead",
    },
    stars: 87,
    forks: 29,
    tags: ["Notion MCP", "Figma", "JSON-RPC 2.0", "Product Spec"],
    features: ["双向双工通信", "Figma Tokens 自动导出", "PRD 版本变更追踪"],
    lastUpdated: "1 天前",
    isOfficial: false,
  },
  {
    id: "hub_agent_content_strategist",
    type: "agent",
    domain: "运营与新媒体",
    title: "多渠道新媒体全案策划与文案生成器",
    description: "适配公众号、小红书、推特与即刻多平台调性，自动提炼产品亮点并批量生成差异化宣发排版内容。",
    author: {
      name: "Elena Rostova",
      avatar: "🚀",
      role: "Growth Hacker",
    },
    stars: 156,
    forks: 67,
    tags: ["Multi-Platform", "Copywriting", "Gemini 3.1", "Prompt Engineering"],
    features: ["爆款标题打分预测", "小红书 Emoji 智能排版", "自动生成多渠道配图 Prompt"],
    lastUpdated: "2 天前",
    isOfficial: true,
  },
  {
    id: "hub_workflow_incident_commander",
    type: "workflow",
    domain: "DevOps & 代码",
    title: "SRE 线上故障应急联动与复盘报告流",
    description: "对接 Sentry / Datadog 报警，自动生成 Incident 战备群、抓取调用堆栈并通知值班工程师。",
    author: {
      name: "Cloud Ops Guild",
      avatar: "⚡",
      role: "Infrastructure Team",
    },
    stars: 112,
    forks: 38,
    tags: ["SRE", "Alerting", "Slack Webhook", "Postmortem"],
    features: ["全链路日志聚合", "自动起草复盘 Postmortem", "一键调度值班 Agent"],
    lastUpdated: "3 天前",
    isOfficial: false,
  },
  {
    id: "hub_agent_research_analyst",
    type: "agent",
    domain: "通用效率",
    title: "深度行业调研与竞品追踪分析师",
    description: "具备学术论文、财报与科技新闻多源整合能力，一键输出结构化行业研报与 SWOT 对比矩阵。",
    author: {
      name: "AI Lab",
      avatar: "🧠",
      role: "Research Scientist",
    },
    stars: 204,
    forks: 82,
    tags: ["Deep Research", "SWOT", "Markdown Report", "RAG"],
    features: ["多文档交叉验证", "自动生成引用脚注", "导出高质量 PDF/Markdown"],
    lastUpdated: "4 天前",
    isOfficial: true,
  },
];

interface ComponentHubViewProps {
  onForkAsset?: (asset: HubAsset) => void;
}

export const ComponentHubView: React.FC<ComponentHubViewProps> = ({ onForkAsset }) => {
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [forkedAssets, setForkedAssets] = useState<Record<string, boolean>>({});
  const [likedAssets, setLikedAssets] = useState<Record<string, number>>({});
  const { addMessage } = useCollabStore();

  const domains = [
    { id: "all", label: "全部领域" },
    { id: "DevOps & 代码", label: "DevOps & 代码" },
    { id: "设计与产品", label: "设计与产品" },
    { id: "运营与新媒体", label: "运营与新媒体" },
    { id: "财务与合规", label: "财务与合规" },
    { id: "通用效率", label: "通用效率" },
  ];

  const types = [
    { id: "all", label: "所有组件", icon: Layers },
    { id: "agent", label: "AI 员工 (Agent)", icon: Bot },
    { id: "workflow", label: "工作流 (Workflow)", icon: GitFork },
    { id: "mcp", label: "MCP 技能连接器", icon: Cpu },
  ];

  const filteredAssets = HUB_ASSETS.filter((asset) => {
    if (selectedDomain !== "all" && asset.domain !== selectedDomain) return false;
    if (selectedType !== "all" && asset.type !== selectedType) return false;
    if (
      searchQuery &&
      !asset.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !asset.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const handleFork = (asset: HubAsset) => {
    setForkedAssets((prev) => ({ ...prev, [asset.id]: true }));
    if (onForkAsset) onForkAsset(asset);
    
    // Broadcast fork event to team chat
    addMessage(`🚀 我刚刚从资产广场一键 Fork 了【${asset.title}】到本工作区！`, {
      targetType: asset.type,
      targetId: asset.id,
      targetTitle: asset.title,
    });
  };

  const handleToggleLike = (assetId: string, currentStars: number) => {
    setLikedAssets((prev) => ({
      ...prev,
      [assetId]: (prev[assetId] !== undefined ? prev[assetId] : currentStars) + (prev[assetId] ? -1 : 1),
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 text-slate-100 font-sans">
      {/* 1. Universal Hub Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Universal AI Studio · 跨领域公共资产广场</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            汇聚研发、设计、运营与财务的全域 AI 资产
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            告别单一垂直死板流程。团队成员可随时共享调优后的 AI 员工、编排好的 DAG 工作流与 MCP 协议连接器，一键 Fork 并投入生产协同。
          </p>

          {/* Quick Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>42+ 预置通用组件</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
              <span>1,280+ 社区 Fork 次数</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>双工 JSON-RPC 2.0 驱动</span>
            </div>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索跨领域 Agent、工作流名称、标签或 MCP 连接器..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
        </div>

        {/* Component Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {types.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Domain Category Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> 领域过滤:
        </span>
        {domains.map((dom) => (
          <button
            key={dom.id}
            onClick={() => setSelectedDomain(dom.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all shrink-0 ${
              selectedDomain === dom.id
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {dom.label}
          </button>
        ))}
      </div>

      {/* 3. Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.map((asset) => {
          const isForked = forkedAssets[asset.id];
          const starCount =
            likedAssets[asset.id] !== undefined ? likedAssets[asset.id] : asset.stars;

          return (
            <div
              key={asset.id}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20"
            >
              <div className="space-y-3.5">
                {/* Header: Type Badge & Domain */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold flex items-center gap-1 border ${
                      asset.type === "agent"
                        ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                        : asset.type === "workflow"
                        ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {asset.type === "agent" && <Bot className="w-3 h-3" />}
                    {asset.type === "workflow" && <GitFork className="w-3 h-3" />}
                    {asset.type === "mcp" && <Cpu className="w-3 h-3" />}
                    <span>{asset.type.toUpperCase()}</span>
                  </span>

                  <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    {asset.domain}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                    {asset.title}
                    {asset.isOfficial && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        精选
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                    {asset.description}
                  </p>
                </div>

                {/* Key Features */}
                <div className="space-y-1 py-1">
                  {asset.features.slice(0, 2).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom: Author & Action Bar */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{asset.author.avatar}</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 truncate max-w-[90px]">
                      {asset.author.name}
                    </div>
                    <div className="text-[10px] text-slate-500">{asset.lastUpdated}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleLike(asset.id, asset.stars)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-colors"
                    title="点赞"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        likedAssets[asset.id] ? "text-rose-500 fill-rose-500" : "text-slate-400"
                      }`}
                    />
                    <span className="font-mono text-[11px]">{starCount}</span>
                  </button>

                  <button
                    onClick={() => handleFork(asset)}
                    disabled={isForked}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-md ${
                      isForked
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50"
                    }`}
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>{isForked ? "已克隆" : "一键 Fork"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
