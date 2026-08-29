import React, { useState } from "react";
import {
  Cpu,
  Plug,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Play,
  Terminal,
  RefreshCw,
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  GitBranch,
  FileCode,
  MessageSquare,
  Radio,
  Sliders,
} from "lucide-react";
import { useCollabStore } from "../store/collabStore.ts";

export interface McpConnector {
  id: string;
  name: string;
  category: "DevOps & 代码" | "数据与分析" | "设计与协作" | "通讯与办公" | "AI & 计算";
  iconUrl: string;
  iconBg: string;
  description: string;
  serverUrl: string;
  protocolVersion: string;
  status: "connected" | "disconnected" | "connecting";
  authType: "OAuth 2.0" | "API Key" | "Bearer Token" | "Webhook Secret";
  toolsExported: Array<{
    name: string;
    description: string;
    parametersCount: number;
  }>;
  latencyMs: number;
  lastPing: string;
  isPopular?: boolean;
}

const MCP_PRESETS: McpConnector[] = [
  {
    id: "mcp_github",
    name: "GitHub DevOps Connector",
    category: "DevOps & 代码",
    iconUrl: "🐙",
    iconBg: "bg-slate-800",
    description: "接入 GitHub Repositories、Pull Requests、Issues 以及 Actions CI/CD 流水线，支持双向代码评审与自动化发布。",
    serverUrl: "https://mcp.github.internal/v2/rpc",
    protocolVersion: "JSON-RPC 2.0 (MCP Draft)",
    status: "connected",
    authType: "OAuth 2.0",
    toolsExported: [
      { name: "get_pull_request_diff", description: "提取指定 PR 的结构化补丁与改动文件列表", parametersCount: 2 },
      { name: "create_review_comment", description: "在 PR 指定代码行发表带有评审建议的评论", parametersCount: 4 },
      { name: "trigger_workflow_dispatch", description: "触发特定 GitHub Actions 自动化构建任务", parametersCount: 3 },
    ],
    latencyMs: 42,
    lastPing: "刚刚",
    isPopular: true,
  },
  {
    id: "mcp_notion",
    name: "Notion Knowledge Syncer",
    category: "设计与协作",
    iconUrl: "📓",
    iconBg: "bg-amber-950/40",
    description: "实时检索与双向同步 Notion Database、企业 Wiki 文档和产品需求 PRD 页面。",
    serverUrl: "https://mcp.notion.so/rpc",
    protocolVersion: "JSON-RPC 2.0 (MCP Draft)",
    status: "connected",
    authType: "Bearer Token",
    toolsExported: [
      { name: "query_database_pages", description: "基于过滤条件检索 Notion 数据库结构化条目", parametersCount: 3 },
      { name: "append_block_children", description: "向 Notion 页面末尾追加 Markdown/富文本排版块", parametersCount: 2 },
    ],
    latencyMs: 68,
    lastPing: "1 分钟前",
    isPopular: true,
  },
  {
    id: "mcp_clickhouse",
    name: "ClickHouse & Postgres OLAP",
    category: "数据与分析",
    iconUrl: "⚡",
    iconBg: "bg-cyan-950/40",
    description: "连接高性能列式分析数据库，支持毫秒级海量用户行为事件聚合与指标查询。",
    serverUrl: "https://olap.mcp.cluster/jsonrpc",
    protocolVersion: "JSON-RPC 2.0 (MCP Draft)",
    status: "disconnected",
    authType: "API Key",
    toolsExported: [
      { name: "execute_readonly_sql", description: "安全执行经 AST 语法校验的只读 SQL 分析语句", parametersCount: 2 },
      { name: "get_table_schema_metadata", description: "获取指定数据表的元数据与字段类型定义", parametersCount: 1 },
    ],
    latencyMs: 15,
    lastPing: "未连接",
    isPopular: true,
  },
  {
    id: "mcp_slack",
    name: "Slack & Lark Enterprise Hub",
    category: "通讯与办公",
    iconUrl: "💬",
    iconBg: "bg-purple-950/40",
    description: "接入飞书/企微/Slack 频道与群聊机器人，支持交互式卡片通知、审批回传与即时对话唤醒。",
    serverUrl: "https://mcp.messaging.corp/v1",
    protocolVersion: "JSON-RPC 2.0 (MCP Draft)",
    status: "connected",
    authType: "Webhook Secret",
    toolsExported: [
      { name: "send_interactive_card", description: "向团队群组发送包含操作按钮的富媒体卡片", parametersCount: 4 },
      { name: "listen_channel_mentions", description: "监听频道中 @AI 员工的对话流并自动触发任务", parametersCount: 2 },
    ],
    latencyMs: 35,
    lastPing: "3 分钟前",
    isPopular: true,
  },
  {
    id: "mcp_figma",
    name: "Figma Design Tokens Connector",
    category: "设计与协作",
    iconUrl: "🎨",
    iconBg: "bg-rose-950/40",
    description: "同步 Figma 设计系统变量、色彩规范与画板元数据，实现设计与前端代码组件库无缝对齐。",
    serverUrl: "https://mcp.figma.io/rpc",
    protocolVersion: "JSON-RPC 2.0 (MCP Draft)",
    status: "disconnected",
    authType: "OAuth 2.0",
    toolsExported: [
      { name: "get_file_styles_and_tokens", description: "提取设计稿中的 Design Tokens 与颜色变量", parametersCount: 2 },
      { name: "export_frame_image_svg", description: "将指定 Frame 切图导出为矢量 SVG 或图片", parametersCount: 3 },
    ],
    latencyMs: 120,
    lastPing: "未连接",
    isPopular: false,
  },
  {
    id: "mcp_jira",
    name: "Jira & Linear Sprint Bridge",
    category: "DevOps & 代码",
    iconUrl: "🎯",
    iconBg: "bg-blue-950/40",
    description: "自动化管理 Sprint 迭代卡片、敏捷故事点预估与代码提交关联。",
    serverUrl: "https://mcp.atlassian.net/rpc",
    protocolVersion: "JSON-RPC 2.0 (MCP Draft)",
    status: "disconnected",
    authType: "OAuth 2.0",
    toolsExported: [
      { name: "create_sprint_issue", description: "根据 Agent 分析结果自动创建 Jira 敏捷工单", parametersCount: 5 },
      { name: "update_issue_status", description: "更新工单流转状态 (In Progress -> Review -> Done)", parametersCount: 2 },
    ],
    latencyMs: 85,
    lastPing: "未连接",
    isPopular: false,
  },
];

export const McpMarketplaceView: React.FC = () => {
  const [connectors, setConnectors] = useState<McpConnector[]>(MCP_PRESETS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [testingConnectorId, setTestingConnectorId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const { addMessage } = useCollabStore();

  const categories = [
    { id: "all", label: "全部生态" },
    { id: "DevOps & 代码", label: "DevOps & 代码" },
    { id: "设计与协作", label: "设计与协作" },
    { id: "数据与分析", label: "数据与分析" },
    { id: "通讯与办公", label: "通讯与办公" },
  ];

  const filteredConnectors = connectors.filter((conn) => {
    if (selectedCategory !== "all" && conn.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !conn.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !conn.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleToggleConnect = (connectorId: string) => {
    setConnectors((prev) =>
      prev.map((conn) => {
        if (conn.id === connectorId) {
          const nextStatus = conn.status === "connected" ? "disconnected" : "connected";
          if (nextStatus === "connected") {
            addMessage(`⚡ 团队成员已成功连接【${conn.name}】MCP 服务端！`, {
              targetType: "mcp",
              targetId: conn.id,
              targetTitle: conn.name,
            });
          }
          return {
            ...conn,
            status: nextStatus,
            lastPing: nextStatus === "connected" ? "刚刚" : "未连接",
          };
        }
        return conn;
      })
    );
  };

  const handleRunJsonRpcPing = (connector: McpConnector) => {
    setTestingConnectorId(connector.id);
    setTimeout(() => {
      setTestResult((prev) => ({
        ...prev,
        [connector.id]: `[JSON-RPC 2.0 OK] Server capabilities returned: ${connector.toolsExported.length} tools registered. Round-trip: ${connector.latencyMs}ms.`,
      }));
      setTestingConnectorId(null);
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 text-slate-100 font-sans">
      {/* 1. Header Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
            <Plug className="w-3.5 h-3.5" />
            <span>Model Context Protocol (MCP) 官方标准连接市场</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            一键直连全球开发者与企业生态连接器
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            基于开放的 JSON-RPC 2.0 协议标准，无需编写冗长胶水代码。将 GitHub、Notion、ClickHouse、Slack 及自研服务直接化为 AI 员工的原子执行能力。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
            <div className="text-xl font-bold text-white font-mono">
              {connectors.filter((c) => c.status === "connected").length} / {connectors.length}
            </div>
            <div className="text-[10px] text-slate-400">已活跃连接</div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索 MCP 连接器、协议或导出工具名称..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950/40"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConnectors.map((connector) => {
          const isConnected = connector.status === "connected";
          const isTesting = testingConnectorId === connector.id;
          const resultLog = testResult[connector.id];

          return (
            <div
              key={connector.id}
              className={`group bg-slate-900/80 hover:bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-md ${
                isConnected
                  ? "border-cyan-500/40 hover:border-cyan-400/80 hover:shadow-cyan-950/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-4">
                {/* Header: Icon, Name & Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-md ${connector.iconBg}`}
                    >
                      {connector.iconUrl}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        {connector.name}
                        {connector.isPopular && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            常用
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{connector.category}</span>
                        <span>·</span>
                        <span>{connector.authType}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${
                      isConnected
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                      }`}
                    />
                    {isConnected ? "已就绪" : "待连接"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {connector.description}
                </p>

                {/* Server Endpoint Bar */}
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between truncate">
                  <span className="truncate">{connector.serverUrl}</span>
                  <span className="text-[10px] text-cyan-400 shrink-0 ml-2">
                    {isConnected ? `${connector.latencyMs}ms` : "OFFLINE"}
                  </span>
                </div>

                {/* Tools Exported List */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>导出的 MCP 工具函数 ({connector.toolsExported.length})</span>
                    <span className="font-mono text-[9px] text-slate-500">JSON-RPC 2.0</span>
                  </div>
                  <div className="space-y-1">
                    {connector.toolsExported.map((tool, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-200 truncate">
                            {tool.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {tool.parametersCount} 参数
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Output Log if any */}
                {resultLog && (
                  <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[10px] text-cyan-200 font-mono leading-tight">
                    {resultLog}
                  </div>
                )}
              </div>

              {/* Bottom: Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleRunJsonRpcPing(connector)}
                  disabled={!isConnected || isTesting}
                  className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin" : ""}`} />
                  <span>{isTesting ? "探测中..." : "RPC 握手测试"}</span>
                </button>

                <button
                  onClick={() => handleToggleConnect(connector.id)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    isConnected
                      ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/40"
                  }`}
                >
                  <Plug className="w-3.5 h-3.5" />
                  <span>{isConnected ? "断开连接" : "一键直连"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
