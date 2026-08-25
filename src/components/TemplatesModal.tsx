import React from "react";
import { Workflow } from "../types/schemas.ts";
import { X, Layers, GitFork, ArrowRight, Check } from "lucide-react";

interface TemplatesModalProps {
  workflows: Workflow[];
  currentWorkflowId: string;
  onSelectWorkflow: (workflowId: string) => void;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  workflows,
  currentWorkflowId,
  onSelectWorkflow,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-sm text-white">工作流架构模板与项目预设</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {workflows.map((wf) => {
            const isCurrent = wf.id === currentWorkflowId;
            return (
              <div
                key={wf.id}
                onClick={() => {
                  onSelectWorkflow(wf.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-indigo-950/30 border-indigo-500/50 shadow-indigo-500/10 shadow-md"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white">{wf.name}</span>
                  </div>
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      <Check className="w-3 h-3" /> 当前加载
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-300 font-semibold">
                      <span>加载此工作流</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {wf.description}
                </p>

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                  <span>节点数: {wf.nodes.length}</span>
                  <span>连线数: {wf.edges.length}</span>
                  <span>变量数: {wf.variables.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
