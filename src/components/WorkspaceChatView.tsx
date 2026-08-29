// MODIFIED: Added WorkspaceChatView for In-Tool Community & Team Chat
import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Code2,
  FileText,
  Bot,
  Sparkles,
  Search,
  Users,
  Paperclip,
  Smile,
  Hash,
  Share2,
  CheckCircle2,
  Copy,
  ChevronRight,
  Pin,
  Flame,
  ThumbsUp,
  Bookmark,
  TrendingUp,
  Terminal,
  Zap,
} from "lucide-react";
import { useCollabStore, WorkspaceChatMessage } from "../store/collabStore.ts";

interface Channel {
  id: string;
  name: string;
  topic: string;
  icon: string;
  unreadCount?: number;
  isPopular?: boolean;
}

const CHANNELS: Channel[] = [
  {
    id: "general",
    name: "全员通用交流",
    topic: "团队日常协同、业务需求同步与跨部门通知",
    icon: "🌐",
    isPopular: true,
  },
  {
    id: "agent_debug",
    name: "AI员工与Agent调试",
    topic: "Prompt 调优、大模型幻觉规避与沙箱联调反馈",
    icon: "🤖",
    unreadCount: 3,
    isPopular: true,
  },
  {
    id: "sop_sharing",
    name: "SOP流程与业务心得",
    topic: "外贸履约、DevOps 自动化与金融审计标准化 SOP 沉淀",
    icon: "📋",
  },
  {
    id: "mcp_dev",
    name: "MCP连接器与开发技术",
    topic: "Model Context Protocol 工具注册、JSON-RPC 2.0 与 API 扩展",
    icon: "⚡",
    unreadCount: 1,
  },
  {
    id: "alerts_approvals",
    name: "实时告警与待批阅",
    topic: "系统异常拦截、风控阈值超限与人工确认审批单",
    icon: "🚨",
  },
];

const SOP_TEMPLATES = [
  {
    title: "外贸客户意向跟进与报价 SOP",
    content: `【外贸跟进 SOP】
1. 收到海外询盘 15 分钟内：通过互动分析员提取 MOQ、交期与目标港口。
2. 2 小时内：行销策略分析员根据大宗商品波动给出梯次 FOB 报价。
3. 24 小时后：自动触发跟进专员推送本地化语言催办样品确认邮件。`,
  },
  {
    title: "DevOps PR 代码审查门禁 SOP",
    content: `【DevOps 代码审查 SOP】
1. PR 创建时：触发 AST 语法树检查与敏感 API Key 熵值扫描。
2. 发现潜在异步锁竞争时：自动在对应代码行标记 Block 警告。
3. 测试覆盖率 > 85% 且无高危 CVE 漏洞时，安全门禁自动放行。`,
  },
];

const CODE_TEMPLATES = [
  {
    title: "JSONB 乐观并发锁 SQL 片段",
    code: `SELECT patch_dynamic_record(
  p_table_name => 'crm_customers',
  p_record_id  => 'rec_1001',
  p_patch      => '{"intent_score": 92, "status": "已确认"}'::jsonb,
  p_expected_version => 4
);`,
  },
  {
    title: "MCP 工具协议定义 Tool Schema",
    code: `{
  "name": "currency_converter",
  "description": "实时汇率换算与差额核算",
  "inputSchema": {
    "type": "object",
    "properties": {
      "amount": { "type": "number" },
      "from": { "type": "string" },
      "to": { "type": "string" }
    },
    "required": ["amount", "from", "to"]
  }
}`,
  },
];

export const WorkspaceChatView: React.FC = () => {
  const { messages, addMessage, activeMembers, currentUser } = useCollabStore();
  const [selectedChannelId, setSelectedChannelId] = useState<string>("general");
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSopModal, setShowSopModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentChannel = CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    addMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertTemplate = (text: string) => {
    setInputText((prev) => (prev ? `${prev}\n\n${text}` : text));
    setShowSopModal(false);
    setShowCodeModal(false);
  };

  const filteredMessages = messages.filter((m) =>
    searchQuery
      ? m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="flex-1 flex h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* =========================================================================
          1. Left Sidebar: Channels & Online Presence (Hidden on mobile)
         ========================================================================= */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex-col justify-between hidden md:flex shrink-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-white">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>即时协同交流中心</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Community
              </span>
            </div>

            {/* Channel Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="搜索讨论内容或发言人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-2 py-1">
              交流频道 · CHANNELS
            </div>
            {CHANNELS.map((ch) => {
              const isSelected = ch.id === selectedChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm">{ch.icon}</span>
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.unreadCount && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                      {ch.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Team Presence */}
            <div className="pt-4 mt-4 border-t border-slate-800/80">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-2 py-1 flex items-center justify-between">
                <span>在线成员 · ({activeMembers.length})</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1 mt-1">
                {activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800/40 text-slate-300"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shrink-0">
                      {member.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {member.currentLocation || member.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. Main Chat Area
         ========================================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Channel Header Bar */}
        <div className="h-14 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">{currentChannel.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white truncate">
                  #{currentChannel.name}
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 hidden sm:inline-block">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {currentChannel.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSopModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
              title="插入 SOP 流程标准心得"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">SOP 心得模板</span>
              <span className="sm:hidden">SOP</span>
            </button>

            <button
              onClick={() => setShowCodeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
              title="插入代码片段"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">代码片段</span>
              <span className="sm:hidden">代码</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Welcome Channel Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentChannel.icon}</span>
              <h3 className="font-bold text-sm text-white">
                欢迎来到 #{currentChannel.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              这里是针对当前业务工作空间团队成员与 Agent 运行时的即时交流阵地。支持 SOP 经验沉淀、Agent 调试排障与代码片段一键分享。
            </p>
          </div>

          {/* Render Messages */}
          {filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const containsCode = msg.text.includes("```") || msg.text.includes("SELECT") || msg.text.includes("function");

            return (
              <div
                key={msg.id}
                className={`flex gap-3 group animate-in fade-in duration-150 ${
                  isMe ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base shadow-sm shrink-0">
                  {msg.senderAvatar}
                </div>

                {/* Bubble Container */}
                <div
                  className={`max-w-xl space-y-1.5 ${
                    isMe ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  {/* Sender Header */}
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="font-bold text-white">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                      {msg.senderRole}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Attached Target Annotation (if any) */}
                  {msg.annotation && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        msg.annotation.targetType === "agent"
                          ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/60"
                          : "bg-cyan-950/60 text-cyan-300 border-cyan-800/60"
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{msg.annotation.targetTitle}</span>
                    </div>
                  )}

                  {/* Message Bubble Body */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md whitespace-pre-wrap ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-xs"
                        : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Quick Reactions Bar */}
                  <div
                    className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <button
                      onClick={() => handleCopyCode(msg.id, msg.text)}
                      className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 border border-slate-800 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>复制</span>
                        </>
                      )}
                    </button>
                    <button className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 border border-slate-800 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>赞同</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur shrink-0">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl focus-within:border-indigo-500 transition-colors shadow-inner space-y-2">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`在 #${currentChannel.name} 发送讨论、代码片段或 @AI角色 (Enter 发送, Shift + Enter 换行)...`}
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <button
                  onClick={() => setShowSopModal(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors"
                  title="插入 SOP 经验"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCodeModal(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                  title="插入 Code"
                >
                  <Code2 className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-600 hidden sm:inline">
                  | Markdown 支持
                </span>
              </div>

              <button
                disabled={!inputText.trim()}
                onClick={handleSend}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-md shadow-indigo-950/50 transition-all"
              >
                <span>发送</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          3. SOP Templates Modal
         ========================================================================= */}
      {showSopModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>选择 SOP 流程与业务心得模板</span>
              </div>
              <button
                onClick={() => setShowSopModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {SOP_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => handleInsertTemplate(tmpl.content)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="font-bold text-xs text-amber-300">{tmpl.title}</div>
                  <pre className="text-[11px] text-slate-400 font-sans whitespace-pre-wrap line-clamp-3">
                    {tmpl.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. Code Snippets Modal
         ========================================================================= */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>选择代码片段模板</span>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {CODE_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => handleInsertTemplate(`\`\`\`sql\n${tmpl.code}\n\`\`\``)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="font-bold text-xs text-cyan-300">{tmpl.title}</div>
                  <pre className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto">
                    {tmpl.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
