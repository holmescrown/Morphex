import React, { useState } from "react";
import { ToolDefinition, ToolParameterProperty } from "../types/schemas.ts";
import {
  Wrench,
  Plus,
  Play,
  CheckCircle2,
  Code2,
  Globe,
  Sliders,
  Sparkles,
  Trash2,
  Layers,
  Zap,
} from "lucide-react";
import { PromptToToolModal, ToolModalTab } from "./PromptToToolModal.tsx";

interface ToolManagerProps {
  tools: ToolDefinition[];
  onUpdateTools: (tools: ToolDefinition[]) => void;
}

export const ToolManager: React.FC<ToolManagerProps> = ({ tools, onUpdateTools }) => {
  const [selectedToolId, setSelectedToolId] = useState<string>(tools[0]?.id || "");
  const selectedTool = tools.find((t) => t.id === selectedToolId) || tools[0];

  // Test Tool Execution State
  const [testArgs, setTestArgs] = useState<Record<string, string>>({});
  const [testOutput, setTestOutput] = useState<unknown | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 3-in-1 PromptToToolModal State
  const [isToolModalOpen, setIsToolModalOpen] = useState<boolean>(false);
  const [toolModalInitialTab, setToolModalInitialTab] = useState<ToolModalTab>("templates");

  const handleTestTool = async () => {
    if (!selectedTool) return;
    setIsTesting(true);
    setTestOutput(null);

    try {
      if (selectedTool.codeBody) {
        // Execute custom codeBody in safe client function
        const castedArgs: Record<string, unknown> = {};
        (Object.entries(selectedTool.parameters || {}) as [string, ToolParameterProperty][]).forEach(([k, prop]) => {
          const val = testArgs[k] !== undefined ? testArgs[k] : (prop.default !== undefined ? String(prop.default) : "");
          if (prop.type === "number") castedArgs[k] = Number(val) || 0;
          else if (prop.type === "boolean") castedArgs[k] = val === "true" || val === true;
          else castedArgs[k] = val;
        });

        const runner = new Function("args", selectedTool.codeBody);
        const res = runner(castedArgs);
        setTestOutput({
          status: "success",
          type: "local_sandbox_function",
          inputs: castedArgs,
          result: res,
          executedAt: new Date().toISOString(),
        });
      } else if (selectedTool.id === "calculator") {
        const expr = testArgs.expression || "100 * 1.25";
        const sanitized = expr.replace(/[^0-9+\-*/().%^ ]/g, "");
        const res = new Function(`return (${sanitized})`)();
        setTestOutput({ result: res });
      } else if (selectedTool.id === "json_formatter") {
        const raw = testArgs.input || '{"name": "Agent", "status": "active"}';
        setTestOutput({ formatted: JSON.stringify(JSON.parse(raw), null, 2) });
      } else {
        const resp = await fetch("/api/run-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolId: selectedTool.id,
            toolName: selectedTool.name,
            arguments: testArgs,
          }),
        });
        const data = await resp.json();
        setTestOutput(data.output || data);
      }
    } catch (err: unknown) {
      setTestOutput({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCreatedTool = (newTool: ToolDefinition) => {
    const updated = [...tools, newTool];
    onUpdateTools(updated);
    setSelectedToolId(newTool.id);
  };

  const handleDeleteTool = (toolId: string) => {
    const updated = tools.filter((t) => t.id !== toolId);
    onUpdateTools(updated);
    if (selectedToolId === toolId && updated.length > 0) {
      setSelectedToolId(updated[0].id);
    }
  };

  return (
    <div id="tool-manager-root" className="flex-1 flex h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Left Tools List */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-slate-200">原子工具箱 (Tools)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
              {tools.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-open-ai-tool"
              onClick={() => {
                setToolModalInitialTab("ai");
                setIsToolModalOpen(true);
              }}
              title="通过 AI 提示词生成工具"
              className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-open-create-tool"
              onClick={() => {
                setToolModalInitialTab("templates");
                setIsToolModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-950/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 新建工具
            </button>
          </div>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {tools.map((tool) => {
            const isSelected = selectedTool?.id === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => {
                  setSelectedToolId(tool.id);
                  setTestOutput(null);
                  setTestArgs({});
                }}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-orange-950/30 border-orange-500/50 text-orange-100 shadow-md shadow-orange-950/30"
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs truncate">{tool.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-orange-300 border border-slate-700 shrink-0">
                    {tool.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tool.description}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 font-mono">
                  <span>{tool.category || "General"}</span>
                  <span>{Object.keys(tool.parameters || {}).length} 参数</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tool Detail & Live Sandbox */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {selectedTool ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-400" />
                  <h2 className="font-bold text-sm text-white">{selectedTool.name}</h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-orange-300 border border-slate-700 rounded">
                    ID: {selectedTool.id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    [{selectedTool.category || "工具"}]
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTool.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setToolModalInitialTab("designer");
                    setIsToolModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Schema 设计器</span>
                </button>

                <button
                  onClick={() => handleDeleteTool(selectedTool.id)}
                  title="删除工具"
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content: Params & Test */}
            <div className="flex-1 flex overflow-hidden">
              {/* Parameters Schema Spec & Code Details */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    入参 Schema 规范 (Parameters: {Object.keys(selectedTool.parameters || {}).length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.entries(selectedTool.parameters || {}) as [string, ToolParameterProperty][]).map(
                    ([paramKey, prop]) => (
                      <div
                        key={paramKey}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-orange-300">{paramKey}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                              {prop.type}
                            </span>
                            {prop.required ? (
                              <span className="text-[10px] text-rose-400 font-semibold">必填</span>
                            ) : (
                              <span className="text-[10px] text-slate-500">选填</span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400">{prop.description}</p>
                        {prop.default !== undefined && (
                          <div className="text-[10px] font-mono text-slate-500">
                            默认: <span className="text-slate-300">{String(prop.default)}</span>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* Code Body Preview if exists */}
                {selectedTool.codeBody && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-purple-400" />
                      JavaScript 沙箱代码体
                    </span>
                    <pre className="p-3 bg-slate-950 text-purple-200 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-44">
                      {selectedTool.codeBody}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Sandbox Execution */}
              <div className="w-96 border-l border-slate-800 bg-slate-900/40 p-4 flex flex-col space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>独立运行沙箱 (Test Sandbox)</span>
                  </span>
                  <button
                    disabled={isTesting}
                    onClick={handleTestTool}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-950/40"
                  >
                    {isTesting ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>调用工具</span>
                  </button>
                </div>

                {/* Input Fields for Testing */}
                <div className="space-y-2 overflow-y-auto max-h-60">
                  {(Object.entries(selectedTool.parameters || {}) as [string, ToolParameterProperty][]).map(
                    ([paramKey, prop]) => (
                      <div key={paramKey} className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                          <span>{paramKey}</span>
                          <span className="text-[10px] text-slate-600 font-normal">({prop.type})</span>
                        </label>
                        <input
                          type="text"
                          value={testArgs[paramKey] !== undefined ? testArgs[paramKey] : (prop.default !== undefined ? String(prop.default) : "")}
                          onChange={(e) => setTestArgs({ ...testArgs, [paramKey]: e.target.value })}
                          placeholder={prop.description}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    )
                  )}
                </div>

                {/* Output Viewer */}
                <div className="flex-1 flex flex-col space-y-1 overflow-hidden">
                  <span className="text-[11px] font-semibold text-slate-400">调用结果 (Result Output):</span>
                  <pre className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-emerald-300 overflow-y-auto">
                    {testOutput ? JSON.stringify(testOutput, null, 2) : "// 点击上方「调用工具」查看沙箱输出"}
                  </pre>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            暂无可用的工具，请点击上方「新建工具」
          </div>
        )}
      </div>

      {/* 3-in-1 PromptToToolModal */}
      <PromptToToolModal
        isOpen={isToolModalOpen}
        initialTab={toolModalInitialTab}
        onClose={() => setIsToolModalOpen(false)}
        onSaveTool={handleSaveCreatedTool}
      />
    </div>
  );
};

