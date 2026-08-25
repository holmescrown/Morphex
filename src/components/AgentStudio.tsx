import React, { useState } from "react";
import {
  Agent,
  ToolDefinition,
  KnowledgeBase,
  Workflow,
} from "../types/schemas.ts";
import {
  Bot,
  Send,
  Sparkles,
  Settings2,
  Wrench,
  Database,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  User,
  Power,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  Layers,
  Zap,
} from "lucide-react";
import { useModeStore } from "../store/modeStore.ts";

interface AgentStudioProps {
  agents: Agent[];
  tools: ToolDefinition[];
  knowledgeBases: KnowledgeBase[];
  workflows: Workflow[];
  onUpdateAgent: (updated: Agent) => void;
  onCreateAgent: () => void;
  onDeleteAgent: (agentId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  sources?: string[];
}

export const AgentStudio: React.FC<AgentStudioProps> = ({
  agents,
  tools,
  knowledgeBases,
  workflows,
  onUpdateAgent,
  onCreateAgent,
  onDeleteAgent,
}) => {
  const { isExpertMode } = useModeStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Live Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      sender: "agent",
      text: `你好！我是「${selectedAgent?.name || "AI 员工"}」。已成功加载。请随时向我发送测试指令！`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!selectedAgent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        暂无 AI 员工，请点击「新建员工」创建。
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage;
    setInputMessage("");

    const newMsg: ChatMessage = {
      id: "user_" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsSending(true);

    try {
      // Gather knowledge base context if any
      let knowledgeContext = "";
      // Call backend agent chat
      const response = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: selectedAgent.name,
          systemPrompt: selectedAgent.modelConfig.systemPrompt,
          model: selectedAgent.modelConfig.model,
          temperature: selectedAgent.modelConfig.temperature,
          message: userText,
          knowledgeContext,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      const agentReply: ChatMessage = {
        id: "agent_" + Date.now(),
        sender: "agent",
        text: data.reply || data.error || "未能获取回复",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, agentReply]);
    } catch (err: unknown) {
      const errReply: ChatMessage = {
        id: "agent_err_" + Date.now(),
        sender: "agent",
        text: "请求发生错误: " + (err instanceof Error ? err.message : String(err)),
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsSending(false);
    }
  };

  const updateAgentField = (partial: Partial<Agent>) => {
    onUpdateAgent({
      ...selectedAgent,
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div id="agent-studio-root" className="flex-1 flex h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* =========================================================================
          Left Panel: AI 员工预置卡片列表
         ========================================================================= */}
      <div className="w-72 border-r border-slate-800 bg-slate-900/70 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-indigo-400" />
              {isExpertMode ? "AI 员工智能体列表" : "AI 员工中心"}
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">
              共 {agents.length} 位 · {agents.filter((a) => a.isPublished !== false).length} 位已启用
            </div>
          </div>
          <button
            onClick={onCreateAgent}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" /> 新建员工
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {agents.map((agent) => {
            const isSelected = selectedAgent.id === agent.id;
            const isEnabled = agent.isPublished !== false;

            return (
              <div
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  setMessages([
                    {
                      id: "msg_init_" + agent.id,
                      sender: "agent",
                      text: `已切换至「${agent.name}」。已加载完成，请向我提问或下达业务指令！`,
                      timestamp: new Date().toLocaleTimeString(),
                    },
                  ]);
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-indigo-600/20 border-indigo-500/50 shadow-md shadow-indigo-950/30"
                    : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0 shadow-inner">
                      {agent.avatar || "🤖"}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {agent.category || "General"}
                      </div>
                    </div>
                  </div>

                  {/* 一键启用/停用快速开关 Badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateAgent({
                        ...agent,
                        isPublished: !isEnabled,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    title={isEnabled ? "点击停用此员工" : "点击一键启用此员工"}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                      isEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                    <span>{isEnabled ? "在岗" : "待命"}</span>
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {agent.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          Middle Panel: 双模自适应配置中心
          - 小白/业务模式: 仅展示业务卡片、一键开关、基础知识库挂载，隐藏 Prompt 和温度
          - 专家模式: 展示完整 Prompt、基座模型、Temperature、TopP、Raw Tool Schema
         ========================================================================= */}
      <div className="w-96 border-r border-slate-800 bg-slate-900/90 flex flex-col overflow-y-auto shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">
              {isExpertMode ? "AI 员工架构与参数设定" : "AI 员工职能档案"}
            </span>
          </div>
          <button
            onClick={() => onDeleteAgent(selectedAgent.id)}
            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
            title="删除此员工"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* 1. 小白模式专属友好提示条 */}
          {!isExpertMode && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>业务极简模式已生效</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                模型底层参数与人设工程已由系统最佳实践托管。直接设置职能并一键启用即可上岗。
              </p>
            </div>
          )}

          {/* 2. 员工身份: 名称与图标 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">员工名称与形象</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedAgent.avatar}
                onChange={(e) => updateAgentField({ avatar: e.target.value })}
                className="w-11 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                value={selectedAgent.name}
                onChange={(e) => updateAgentField({ name: e.target.value })}
                placeholder="例如：销售商机初筛助理"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-bold text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. 一键启停开关 (Prominent Toggle) */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Power className={`w-3.5 h-3.5 ${selectedAgent.isPublished !== false ? "text-emerald-400" : "text-slate-500"}`} />
                <span>在岗运行状态</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {selectedAgent.isPublished !== false ? "已处于在岗状态，可随时被工作流或业务触发" : "当前处于待命状态，暂停响应自动化任务"}
              </div>
            </div>

            <button
              onClick={() => updateAgentField({ isPublished: !(selectedAgent.isPublished !== false) })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                selectedAgent.isPublished !== false
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {selectedAgent.isPublished !== false ? "一键停用" : "一键启用"}
            </button>
          </div>

          {/* 4. 业务职能描述 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">业务职能描述</label>
            <textarea
              rows={2}
              value={selectedAgent.description}
              onChange={(e) => updateAgentField({ description: e.target.value })}
              placeholder="简述该员工负责的业务领域（如线索分类、发票审核、客诉接待等）..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* 5. 专家模式专属: 模型推理参数 (基座模型 / Temperature / TopP) */}
          {isExpertMode && (
            <div className="space-y-3 border-t border-purple-800/40 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> 模型推理参数 (PRO)
                </span>
                <span className="text-[10px] font-mono text-purple-300">Gemini SDK</span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400">基座大语言模型</label>
                <select
                  value={selectedAgent.modelConfig.model}
                  onChange={(e) =>
                    updateAgentField({
                      modelConfig: { ...selectedAgent.modelConfig, model: e.target.value },
                    })
                  }
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-purple-500 focus:outline-none font-mono text-xs"
                >
                  <option value="gemini-3.7-flash">gemini-3.7-flash (极速·多模态·推荐)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (深度复杂推理)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-400">
                    推理温度 (Temperature)
                  </label>
                  <span className="text-xs font-mono text-indigo-400 font-bold">
                    {selectedAgent.modelConfig.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedAgent.modelConfig.temperature}
                  onChange={(e) =>
                    updateAgentField({
                      modelConfig: {
                        ...selectedAgent.modelConfig,
                        temperature: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full mt-1.5 accent-indigo-500"
                />
              </div>
            </div>
          )}

          {/* 6. 专家模式专属: System Prompt 源码编辑框 */}
          {isExpertMode && (
            <div className="space-y-1.5 border-t border-purple-800/40 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> 系统人设 Prompt 源码
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedAgent.modelConfig.systemPrompt.length} chars
                </span>
              </div>
              <textarea
                rows={5}
                value={selectedAgent.modelConfig.systemPrompt}
                onChange={(e) =>
                  updateAgentField({
                    modelConfig: {
                      ...selectedAgent.modelConfig,
                      systemPrompt: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-slate-200 focus:border-purple-500 focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* 7. 业务能力 / 工具绑定 */}
          <div className="space-y-2 border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                {isExpertMode ? `绑定扩展工具 (${selectedAgent.tools.length})` : "业务工具授权"}
              </span>
            </div>

            <div className="space-y-1.5">
              {tools.map((tool) => {
                const isChecked = selectedAgent.tools.includes(tool.id);
                return (
                  <label
                    key={tool.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                      isChecked
                        ? "bg-orange-950/20 border-orange-500/40 text-orange-200"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{tool.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{tool.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updatedTools = e.target.checked
                          ? [...selectedAgent.tools, tool.id]
                          : selectedAgent.tools.filter((t) => t !== tool.id);
                        updateAgentField({ tools: updatedTools });
                      }}
                      className="accent-orange-500 w-4 h-4 rounded"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* 8. 企业知识库 RAG 挂载 */}
          <div className="space-y-2 border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3" />
                {isExpertMode
                  ? `挂载企业知识库 RAG (${selectedAgent.knowledgeBases.length})`
                  : "企业知识库关联"}
              </span>
            </div>

            <div className="space-y-1.5">
              {knowledgeBases.map((kb) => {
                const isChecked = selectedAgent.knowledgeBases.includes(kb.id);
                return (
                  <label
                    key={kb.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                      isChecked
                        ? "bg-cyan-950/20 border-cyan-500/40 text-cyan-200"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{kb.name}</div>
                      <div className="text-[10px] text-slate-400">{kb.documentsCount} 篇私有文档</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updatedKb = e.target.checked
                          ? [...selectedAgent.knowledgeBases, kb.id]
                          : selectedAgent.knowledgeBases.filter((k) => k !== kb.id);
                        updateAgentField({ knowledgeBases: updatedKb });
                      }}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Right Panel: 互动式测试对话台
         ========================================================================= */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Chat Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-base">
              {selectedAgent.avatar || "🤖"}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {selectedAgent.name}
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedAgent.isPublished !== false ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
                <span className="text-[10px] text-slate-400 font-normal">
                  ({selectedAgent.isPublished !== false ? "在线可用" : "待命状态"})
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isExpertMode ? `Model: ${selectedAgent.modelConfig.model} · Temp: ${selectedAgent.modelConfig.temperature}` : "直连大模型智能问答"}
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  id: "msg_reset_" + Date.now(),
                  sender: "agent",
                  text: `对话已重置。我是「${selectedAgent.name}」，有什么我可以协助您的？`,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ])
            }
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> 清空会话
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "agent" && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
                  {selectedAgent.avatar || "🤖"}
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap leading-relaxed"
                }`}
              >
                {msg.text}
                <div
                  className={`text-[9px] mt-1 font-mono text-right ${
                    msg.sender === "user" ? "text-indigo-200" : "text-slate-500"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs shrink-0">
                {selectedAgent.avatar || "🤖"}
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>AI 员工正在分析意图并检索知识库组织答复...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`向 ${selectedAgent.name} 发送业务测试指令... (按 Enter 发送)`}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <button
              disabled={isSending || !inputMessage.trim()}
              onClick={handleSendMessage}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-indigo-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>发送测试</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

