import React, { useState } from "react";
import {
  WorkflowNode,
  Workflow,
  ToolDefinition,
  KnowledgeBase,
  NodeExecutionResult,
} from "../types/schemas.ts";
import { executeNode } from "../lib/engine.ts";
import {
  X,
  Bot,
  Code2,
  GitBranch,
  Globe,
  Wrench,
  Database,
  Sliders,
  Play,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

interface NodeInspectorProps {
  node: WorkflowNode | null;
  workflow: Workflow;
  onUpdateNode: (updatedNode: WorkflowNode) => void;
  onClose: () => void;
  tools: ToolDefinition[];
  knowledgeBases: KnowledgeBase[];
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  workflow,
  onUpdateNode,
  onClose,
  tools,
  knowledgeBases,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<NodeExecutionResult | null>(null);

  if (!node) return null;

  const updateData = (partialData: Partial<WorkflowNode["data"]>) => {
    onUpdateNode({
      ...node,
      data: {
        ...node.data,
        ...partialData,
      },
    });
  };

  // Run single isolated test for this node
  const handleTestSingleNode = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Build mock execution context
      const initialVars: Record<string, unknown> = {};
      workflow.variables.forEach((v) => {
        initialVars[v.name] = v.defaultValue;
      });

      const toolMap: Record<string, ToolDefinition> = {};
      tools.forEach((t) => {
        toolMap[t.id] = t;
      });

      const kbMap: Record<string, KnowledgeBase> = {};
      knowledgeBases.forEach((kb) => {
        kbMap[kb.id] = kb;
      });

      const result = await executeNode(node, {
        variables: initialVars,
        nodeOutputs: {},
        nodeResults: {},
        traceEvents: [],
        tools: toolMap,
        knowledgeBases: kbMap,
        knowledgeDocs: [],
      });

      setTestResult(result);
    } catch (err: unknown) {
      console.error("Test node error:", err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <aside
      id="node-inspector-panel"
      className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 z-30 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {node.type} 节点配置
          </div>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => updateData({ label: e.target.value })}
            className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none text-white mt-0.5 w-full"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description Field */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/20">
        <label className="text-[11px] font-medium text-slate-400">节点说明</label>
        <input
          type="text"
          value={node.data.description || ""}
          onChange={(e) => updateData({ description: e.target.value })}
          placeholder="请输入节点职责或说明..."
          className="w-full text-xs bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none mt-1"
        />
      </div>

      {/* Config Form Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* START NODE */}
        {node.type === "start" && node.data.startConfig && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">入参定义 (Inputs)</span>
              <button
                onClick={() => {
                  const currentVars = node.data.startConfig?.inputVariables || [];
                  updateData({
                    startConfig: {
                      inputVariables: [
                        ...currentVars,
                        {
                          name: `var_${currentVars.length + 1}`,
                          type: "string",
                          required: true,
                          defaultValue: "",
                          description: "",
                        },
                      ],
                    },
                  });
                }}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="w-3 h-3" /> 添加入参
              </button>
            </div>

            {node.data.startConfig.inputVariables.map((iv, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={iv.name}
                    onChange={(e) => {
                      const updated = [...node.data.startConfig!.inputVariables];
                      updated[idx].name = e.target.value;
                      updateData({ startConfig: { inputVariables: updated } });
                    }}
                    placeholder="变量名称 (e.g. ticketId)"
                    className="bg-slate-800 px-2 py-1 rounded text-slate-100 font-mono text-xs w-28"
                  />
                  <select
                    value={iv.type}
                    onChange={(e) => {
                      const updated = [...node.data.startConfig!.inputVariables];
                      updated[idx].type = e.target.value as any;
                      updateData({ startConfig: { inputVariables: updated } });
                    }}
                    className="bg-slate-800 text-[11px] px-2 py-1 rounded text-slate-300"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="object">object</option>
                  </select>
                  <button
                    onClick={() => {
                      const updated = node.data.startConfig!.inputVariables.filter((_, i) => i !== idx);
                      updateData({ startConfig: { inputVariables: updated } });
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={String(iv.defaultValue ?? "")}
                  onChange={(e) => {
                    const updated = [...node.data.startConfig!.inputVariables];
                    updated[idx].defaultValue = e.target.value;
                    updateData({ startConfig: { inputVariables: updated } });
                  }}
                  placeholder="默认值 (Default Value)"
                  className="w-full bg-slate-800/80 px-2 py-1 rounded text-slate-300 text-xs"
                />
              </div>
            ))}
          </div>
        )}

        {/* LLM NODE */}
        {node.type === "llm" && node.data.llmConfig && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400">大语言模型 (Model)</label>
              <select
                value={node.data.llmConfig.model}
                onChange={(e) =>
                  updateData({
                    llmConfig: { ...node.data.llmConfig!, model: e.target.value },
                  })
                }
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="gemini-3.7-flash">gemini-3.7-flash (Default)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400">
                  Temperature ({node.data.llmConfig.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={node.data.llmConfig.temperature}
                  onChange={(e) =>
                    updateData({
                      llmConfig: { ...node.data.llmConfig!, temperature: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1 accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">返回格式</label>
                <select
                  value={node.data.llmConfig.responseFormat}
                  onChange={(e) =>
                    updateData({
                      llmConfig: {
                        ...node.data.llmConfig!,
                        responseFormat: e.target.value as "text" | "json",
                      },
                    })
                  }
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                >
                  <option value="text">纯文本 (Text)</option>
                  <option value="json">结构化 JSON</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">系统提示词 (System Prompt)</label>
              <textarea
                rows={4}
                value={node.data.llmConfig.systemPrompt}
                onChange={(e) =>
                  updateData({
                    llmConfig: { ...node.data.llmConfig!, systemPrompt: e.target.value },
                  })
                }
                placeholder="例如: 你是一个资深企业客服助手，负责解答用户疑问..."
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-400">用户提示词 (User Prompt)</label>
                <span className="text-[10px] text-indigo-400">支持 {"{{variables.name}}"} 插值</span>
              </div>
              <textarea
                rows={4}
                value={node.data.llmConfig.userPrompt}
                onChange={(e) =>
                  updateData({
                    llmConfig: { ...node.data.llmConfig!, userPrompt: e.target.value },
                  })
                }
                placeholder="例如: 请分析该工单: {{variables.ticketContent}}"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* CODE NODE */}
        {node.type === "code" && node.data.codeConfig && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400">沙箱代码 (JavaScript Function)</label>
              <div className="text-[10px] text-slate-500 mt-0.5">
                函数规范: 必须导出或定义 <code>main(inputs)</code>，返回对象
              </div>
              <textarea
                rows={8}
                value={node.data.codeConfig.code}
                onChange={(e) =>
                  updateData({
                    codeConfig: { ...node.data.codeConfig!, code: e.target.value },
                  })
                }
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-amber-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* CONDITION NODE */}
        {node.type === "condition" && node.data.conditionConfig && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-slate-400">逻辑聚合操作符</label>
              <select
                value={node.data.conditionConfig.logicalOperator}
                onChange={(e) =>
                  updateData({
                    conditionConfig: {
                      ...node.data.conditionConfig!,
                      logicalOperator: e.target.value as "and" | "or",
                    },
                  })
                }
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
              >
                <option value="and">AND (全部满足)</option>
                <option value="or">OR (任意满足)</option>
              </select>
            </div>

            <div className="space-y-2">
              {node.data.conditionConfig.conditions.map((c, idx) => (
                <div key={c.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-cyan-400">条件规则 #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = node.data.conditionConfig!.conditions.filter((_, i) => i !== idx);
                        updateData({ conditionConfig: { ...node.data.conditionConfig!, conditions: updated } });
                      }}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={c.leftOperand}
                    onChange={(e) => {
                      const updated = [...node.data.conditionConfig!.conditions];
                      updated[idx].leftOperand = e.target.value;
                      updateData({ conditionConfig: { ...node.data.conditionConfig!, conditions: updated } });
                    }}
                    placeholder="左侧变量: {{variables.tier}}"
                    className="w-full bg-slate-800 px-2 py-1 rounded text-xs text-slate-200 font-mono"
                  />
                  <select
                    value={c.operator}
                    onChange={(e) => {
                      const updated = [...node.data.conditionConfig!.conditions];
                      updated[idx].operator = e.target.value as any;
                      updateData({ conditionConfig: { ...node.data.conditionConfig!, conditions: updated } });
                    }}
                    className="w-full bg-slate-800 px-2 py-1 rounded text-xs text-slate-200"
                  >
                    <option value="equals">等于 (equals)</option>
                    <option value="not_equals">不等于 (not_equals)</option>
                    <option value="contains">包含 (contains)</option>
                    <option value="not_contains">不包含 (not_contains)</option>
                    <option value="greater_than">大于 (greater_than)</option>
                    <option value="less_than">小于 (less_than)</option>
                    <option value="is_empty">为空 (is_empty)</option>
                    <option value="is_not_empty">不为空 (is_not_empty)</option>
                  </select>
                  <input
                    type="text"
                    value={c.rightOperand}
                    onChange={(e) => {
                      const updated = [...node.data.conditionConfig!.conditions];
                      updated[idx].rightOperand = e.target.value;
                      updateData({ conditionConfig: { ...node.data.conditionConfig!, conditions: updated } });
                    }}
                    placeholder="右侧比较值: enterprise"
                    className="w-full bg-slate-800 px-2 py-1 rounded text-xs text-slate-200"
                  />
                </div>
              ))}

              <button
                onClick={() => {
                  const current = node.data.conditionConfig!.conditions;
                  updateData({
                    conditionConfig: {
                      ...node.data.conditionConfig!,
                      conditions: [
                        ...current,
                        {
                          id: `c_${current.length + 1}`,
                          leftOperand: "{{variables.tier}}",
                          operator: "equals",
                          rightOperand: "enterprise",
                          targetHandle: "true",
                        },
                      ],
                    },
                  });
                }}
                className="w-full py-1.5 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-lg text-cyan-400 hover:text-cyan-300 text-center text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> 添加判定规则
              </button>
            </div>
          </div>
        )}

        {/* HTTP REQUEST NODE */}
        {node.type === "http_request" && node.data.httpConfig && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={node.data.httpConfig.method}
                onChange={(e) =>
                  updateData({
                    httpConfig: { ...node.data.httpConfig!, method: e.target.value as any },
                  })
                }
                className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 font-bold text-blue-400"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <input
                type="text"
                value={node.data.httpConfig.url}
                onChange={(e) =>
                  updateData({
                    httpConfig: { ...node.data.httpConfig!, url: e.target.value },
                  })
                }
                placeholder="https://api.example.com/v1/data"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200"
              />
            </div>
          </div>
        )}

        {/* RETRIEVAL RAG NODE */}
        {node.type === "retrieval" && node.data.retrievalConfig && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400">选择挂载的知识库</label>
              <select
                value={node.data.retrievalConfig.knowledgeBaseId}
                onChange={(e) =>
                  updateData({
                    retrievalConfig: {
                      ...node.data.retrievalConfig!,
                      knowledgeBaseId: e.target.value,
                    },
                  })
                }
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name} ({kb.documentsCount} 篇文档)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">检索 Query 模板</label>
              <input
                type="text"
                value={node.data.retrievalConfig.queryTemplate}
                onChange={(e) =>
                  updateData({
                    retrievalConfig: {
                      ...node.data.retrievalConfig!,
                      queryTemplate: e.target.value,
                    },
                  })
                }
                placeholder="{{variables.ticketTitle}}"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400">Top-K 匹配条数</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={node.data.retrievalConfig.topK}
                  onChange={(e) =>
                    updateData({
                      retrievalConfig: {
                        ...node.data.retrievalConfig!,
                        topK: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">相似度阈值</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={node.data.retrievalConfig.scoreThreshold}
                  onChange={(e) =>
                    updateData({
                      retrievalConfig: {
                        ...node.data.retrievalConfig!,
                        scoreThreshold: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* TOOL NODE */}
        {node.type === "tool" && node.data.toolConfig && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400">选择绑定工具</label>
              <select
                value={node.data.toolConfig.toolId}
                onChange={(e) => {
                  const selectedTool = tools.find((t) => t.id === e.target.value);
                  updateData({
                    toolConfig: {
                      ...node.data.toolConfig!,
                      toolId: e.target.value,
                      toolName: selectedTool?.name || e.target.value,
                    },
                  });
                }}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                {tools.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* END NODE */}
        {node.type === "end" && node.data.endConfig && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">输出变量定义 (Outputs)</span>
              <button
                onClick={() => {
                  const currentOutputs = node.data.endConfig?.outputVariables || [];
                  updateData({
                    endConfig: {
                      outputVariables: [
                        ...currentOutputs,
                        {
                          name: `out_${currentOutputs.length + 1}`,
                          expression: "{{nodes.llm_1.output.result}}",
                          description: "",
                        },
                      ],
                    },
                  });
                }}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="w-3 h-3" /> 添加输出
              </button>
            </div>

            {node.data.endConfig.outputVariables.map((ov, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={ov.name}
                    onChange={(e) => {
                      const updated = [...node.data.endConfig!.outputVariables];
                      updated[idx].name = e.target.value;
                      updateData({ endConfig: { outputVariables: updated } });
                    }}
                    placeholder="输出变量名"
                    className="bg-slate-800 px-2 py-1 rounded text-slate-100 font-mono text-xs w-32"
                  />
                  <button
                    onClick={() => {
                      const updated = node.data.endConfig!.outputVariables.filter((_, i) => i !== idx);
                      updateData({ endConfig: { outputVariables: updated } });
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={ov.expression}
                  onChange={(e) => {
                    const updated = [...node.data.endConfig!.outputVariables];
                    updated[idx].expression = e.target.value;
                    updateData({ endConfig: { outputVariables: updated } });
                  }}
                  placeholder="表达式: {{nodes.node_reply_llm.output.result}}"
                  className="w-full bg-slate-800/80 px-2 py-1 rounded text-slate-300 font-mono text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Test Action */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
        <button
          id="btn-test-single-node"
          disabled={isTesting}
          onClick={handleTestSingleNode}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold rounded-lg flex items-center justify-center gap-2 border border-slate-700 text-xs transition-colors"
        >
          {isTesting ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>正在单独测试节点...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
              <span>单独测试此节点 (Run Single)</span>
            </>
          )}
        </button>

        {testResult && (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className={testResult.status === "completed" ? "text-emerald-400" : "text-rose-400"}>
                状态: {testResult.status.toUpperCase()} ({testResult.durationMs}ms)
              </span>
            </div>
            <div className="max-h-28 overflow-y-auto font-mono text-[10px] text-slate-400 p-1 bg-slate-900 rounded">
              {JSON.stringify(testResult.output, null, 2)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
