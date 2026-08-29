import React, { useState } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Users,
  Radio,
  Play,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bookmark,
  Share2,
  Bot,
  GitFork,
  Cpu,
  CornerDownRight,
  AtSign,
  Layers,
} from "lucide-react";
import { useCollabStore } from "../store/collabStore.ts";

interface WorkspaceChatDrawerProps {
  onNavigateToTarget?: (targetType: string, targetId: string) => void;
}

export const WorkspaceChatDrawer: React.FC<WorkspaceChatDrawerProps> = ({
  onNavigateToTarget,
}) => {
  const {
    isChatDrawerOpen,
    setChatDrawerOpen,
    activeMembers,
    messages,
    addMessage,
    comments,
    addComment,
    sharedRuns,
    currentUser,
  } = useCollabStore();

  const [activeTab, setActiveTab] = useState<"chat" | "comments" | "runs">("chat");
  const [inputText, setInputText] = useState("");
  const [selectedTag, setSelectedTag] = useState<{
    targetType: "agent" | "workflow" | "mcp" | "field";
    targetId: string;
    targetTitle: string;
  } | null>(null);

  // New comment draft state
  const [commentText, setCommentText] = useState("");
  const [commentTargetType, setCommentTargetType] = useState<"prompt" | "agent" | "workflow" | "mcp">("prompt");
  const [commentTargetTitle, setCommentTargetTitle] = useState("DevOps 代码审查助手 Prompt");

  if (!isChatDrawerOpen) return null;

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    addMessage(inputText.trim(), selectedTag || undefined);
    setInputText("");
    setSelectedTag(null);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment({
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: commentText.trim(),
      targetType: commentTargetType,
      targetTitle: commentTargetTitle,
    });
    setCommentText("");
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        id="collab-drawer-backdrop"
        onClick={() => setChatDrawerOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
      />

      {/* Responsive Drawer / Bottom Sheet */}
      <aside
        id="workspace-collab-drawer"
        className="fixed inset-x-0 bottom-0 max-h-[88vh] h-[82vh] w-full rounded-t-2xl border-t border-slate-700/80 md:inset-y-0 md:bottom-auto md:right-0 md:left-auto md:w-96 md:h-full md:rounded-none md:border-t-0 md:border-l md:border-slate-800 bg-slate-900/98 backdrop-blur-xl shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out"
      >
        {/* Mobile Pull Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-700/80 hover:bg-slate-600 rounded-full mx-auto my-2 md:hidden shrink-0 cursor-grab" />

        {/* 1. Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>团队协同工作台</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {activeMembers.filter((m) => m.status === "online").length} 人在线协同编辑中
              </div>
            </div>
          </div>

          <button
            id="btn-close-collab-drawer"
            onClick={() => setChatDrawerOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="收起协同面板"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      {/* 2. Active Collaborators Presence Bar */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Radio className="w-3 h-3 text-emerald-400" />
          席位:
        </span>
        {activeMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0 text-[11px]"
            title={`${member.name} (${member.role}) · 正在: ${member.currentLocation || "在线"}`}
          >
            <span className="text-xs">{member.avatar}</span>
            <span className="font-medium text-slate-200 truncate max-w-[70px]">
              {member.name.split(" ")[0]}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                member.status === "online"
                  ? "bg-emerald-400"
                  : member.status === "idle"
                  ? "bg-amber-400"
                  : "bg-slate-500"
              }`}
            />
          </div>
        ))}
      </div>

      {/* 3. Tab Switcher */}
      <div className="flex border-b border-slate-800 text-xs font-semibold bg-slate-950/20">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "chat"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>实时协同 ({messages.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "comments"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>打点评论 ({comments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("runs")}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === "runs"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>联调测试 ({sharedRuns.length})</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ======================= CHAT TAB ======================= */}
        {activeTab === "chat" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">跨领域协作交流通道</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  支持与 DevOps 工程师、设计专家与业务负责人实时对齐 Agent 人设与 MCP 技能连接。
                </p>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 text-xs ${
                  msg.senderId === currentUser.id ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  <span>{msg.senderAvatar}</span>
                  <span className="font-semibold text-slate-300">{msg.senderName}</span>
                  <span className="text-slate-500">· {msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed shadow-sm ${
                    msg.senderId === currentUser.id
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  {/* Attached target tag */}
                  {msg.annotation && (
                    <div
                      onClick={() =>
                        onNavigateToTarget &&
                        onNavigateToTarget(msg.annotation!.targetType, msg.annotation!.targetId)
                      }
                      className="mb-1.5 px-2 py-0.5 rounded-md bg-black/20 hover:bg-black/30 border border-white/10 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {msg.annotation.targetType === "agent" && <Bot className="w-2.5 h-2.5" />}
                      {msg.annotation.targetType === "workflow" && <GitFork className="w-2.5 h-2.5" />}
                      {msg.annotation.targetType === "mcp" && <Cpu className="w-2.5 h-2.5" />}
                      <span className="truncate">@{msg.annotation.targetTitle}</span>
                    </div>
                  )}
                  <div>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================= COMMENTS TAB ======================= */}
        {activeTab === "comments" && (
          <div className="space-y-3.5">
            {/* Create new contextual annotation */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  新建配置级打点评审
                </span>
                <span className="text-[10px] text-slate-400">Contextual Note</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <select
                  value={commentTargetType}
                  onChange={(e) => setCommentTargetType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-medium"
                >
                  <option value="prompt">System Prompt</option>
                  <option value="agent">AI 员工架构</option>
                  <option value="mcp">MCP 连接器</option>
                  <option value="workflow">工作流节点</option>
                </select>
                <input
                  type="text"
                  value={commentTargetTitle}
                  onChange={(e) => setCommentTargetTitle(e.target.value)}
                  placeholder="目标标识..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-[11px]"
                />
              </div>

              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="填写代码级优化建议、提示词调整或参数说明..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />

              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
              >
                <Send className="w-3 h-3" /> 发布打点评审
              </button>
            </div>

            {/* List of comments */}
            {comments.map((cmt) => (
              <div
                key={cmt.id}
                className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span>{cmt.authorAvatar}</span>
                    <span className="font-bold text-slate-200">{cmt.authorName}</span>
                    <span className="text-[10px] text-slate-500">· {cmt.timestamp}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                    {cmt.targetTitle}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{cmt.content}</p>

                {cmt.replies && cmt.replies.length > 0 && (
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
                    {cmt.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="pl-3 border-l-2 border-indigo-500/40 text-[11px] text-slate-400 flex items-start gap-1.5"
                      >
                        <CornerDownRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-300">
                            {rep.authorName}:
                          </span>{" "}
                          <span>{rep.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ======================= SHARED RUNS TAB ======================= */}
        {activeTab === "runs" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-200 flex items-start gap-2">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-semibold text-white">多人共享测试流 (Multiplayer Run)</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  团队成员发起的 Agent/工作流沙箱测试将在此处同步广播，便于联合排查 Prompt 与 Token 瓶颈。
                </p>
              </div>
            </div>

            {sharedRuns.map((run) => (
              <div
                key={run.id}
                className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>{run.initiatorAvatar}</span>
                    <span className="font-bold text-white">{run.initiatorName}</span>
                    <span className="text-[10px] text-slate-500">{run.timestamp}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                      run.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : run.status === "running"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {run.status === "completed" ? "执行成功" : run.status}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                  <Play className="w-3 h-3 text-indigo-400" />
                  <span>{run.targetName}</span>
                </div>

                <div className="p-2 bg-slate-950 rounded-lg text-[11px] text-slate-400 font-mono truncate">
                  Prompt: {run.inputPrompt}
                </div>

                {run.outputPreview && (
                  <div className="p-2 bg-indigo-950/40 border border-indigo-800/40 rounded-lg text-[11px] text-slate-200 leading-relaxed">
                    {run.outputPreview}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                  <span>Tokens: {run.tokensUsed || 0}</span>
                  <span>耗时: {run.durationMs || 0}ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Chat Input Bar */}
      {activeTab === "chat" && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
          {/* Tag selector quick buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-slate-500 flex items-center gap-0.5 shrink-0">
              <AtSign className="w-2.5 h-2.5" /> 关联:
            </span>
            <button
              onClick={() =>
                setSelectedTag({
                  targetType: "agent",
                  targetId: "agent_devops",
                  targetTitle: "DevOps 审查员",
                })
              }
              className={`px-2 py-0.5 rounded-full border transition-all shrink-0 ${
                selectedTag?.targetId === "agent_devops"
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              DevOps 审查员
            </button>
            <button
              onClick={() =>
                setSelectedTag({
                  targetType: "workflow",
                  targetId: "wf_pr_review",
                  targetTitle: "PR 自动审查流",
                })
              }
              className={`px-2 py-0.5 rounded-full border transition-all shrink-0 ${
                selectedTag?.targetId === "wf_pr_review"
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              PR 自动审查流
            </button>
            <button
              onClick={() =>
                setSelectedTag({
                  targetType: "mcp",
                  targetId: "mcp_github",
                  targetTitle: "GitHub MCP",
                })
              }
              className={`px-2 py-0.5 rounded-full border transition-all shrink-0 ${
                selectedTag?.targetId === "mcp_github"
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              GitHub MCP
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder="向团队发起协同交流或 @引用 Agent..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-all shadow-md shadow-indigo-950/40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
    </>
  );
};
