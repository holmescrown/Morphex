import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Database,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
  Bot,
} from "lucide-react";

export type QuickStartScenarioId = "lead_scoring" | "finance_hitl" | "rag_qa";

export interface QuickStartWizardProps {
  onSelectScenario: (scenarioId: QuickStartScenarioId) => void;
  className?: string;
  defaultExpanded?: boolean;
}

const STORAGE_KEY = "flow_quickstart_wizard_dismissed";

export const QuickStartWizard: React.FC<QuickStartWizardProps> = ({
  onSelectScenario,
  className = "",
  defaultExpanded = true,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeHoverId, setActiveHoverId] = useState<QuickStartScenarioId | null>(null);

  // Read dismissed preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore local storage error in sandboxed environment
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore local storage error
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    setIsExpanded(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore local storage error
    }
  };

  // If user explicitly dismissed the banner, show an unobtrusive recovery button
  if (isDismissed) {
    return (
      <div className={`flex items-center justify-end px-4 py-1.5 ${className}`}>
        <button
          onClick={handleRestore}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm group"
          title="重新打开 30秒新手向导体验"
        >
          <Sparkles className="w-3 h-3 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span>新手引导与场景体验</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="quick-start-wizard-card"
      className={`bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Header bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-950/50 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                30 秒极简上手向导 · 推荐场景体验
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 hidden sm:inline-block">
                快速上手
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden md:block">
              一键体验 AI 员工全链路自主协同、风控拦截与知识库问答
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
            title={isExpanded ? "收起向导卡片" : "展开向导卡片"}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">收起向导</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">展开向导</span>
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="不再提示向导 (可在设置中恢复)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Body: 3 Scenario Cards */}
      {isExpanded && (
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60">
          {/* Scenario Card 1: 商机与询盘自动评分 */}
          <div
            onMouseEnter={() => setActiveHoverId("lead_scoring")}
            onMouseLeave={() => setActiveHoverId(null)}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 shadow-sm hover:shadow-cyan-950/30 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  商机运营 · 自动流转
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  商机与询盘自动评分
                </h3>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                询盘涌入时，AI 员工自主提取预算与采购意向，毫秒级评分并精准分派专属销售。
              </p>

              {/* Badges / Highlights */}
              <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-mono text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                  ⚡ 95分自动判定
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                  👤 分派至 Sarah
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectScenario("lead_scoring")}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/40 transition-all group-hover:translate-x-0.5"
            >
              <span>立即体验商机评分</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario Card 2: 财务合规与资金审批拦截 */}
          <div
            onMouseEnter={() => setActiveHoverId("finance_hitl")}
            onMouseLeave={() => setActiveHoverId(null)}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 shadow-sm hover:shadow-amber-950/30 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  风控审计 · 人机协同 (HITL)
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  财务合规与资金审批拦截
                </h3>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                触发大额资金流向或关键单据变更时，自动暂停流水线并向审批人发起二次合规确认。
              </p>

              {/* Badges / Highlights */}
              <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-mono text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                  🛡️ &gt;¥50,000 大额拦截
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                  🔐 审计存证
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectScenario("finance_hitl")}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-950/40 transition-all group-hover:translate-x-0.5"
            >
              <span>查看审批拦截抽屉</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scenario Card 3: 企业知识库 RAG 问答 */}
          <div
            onMouseEnter={() => setActiveHoverId("rag_qa")}
            onMouseLeave={() => setActiveHoverId(null)}
            className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/50 shadow-sm hover:shadow-indigo-950/30 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  知识工程 · 混合检索
                </span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  企业知识库 RAG 问答
                </h3>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                加载《外贸出口合规与退税手册》，让 AI 员工基于真实规章进行高精度的业务咨询与条款查验。
              </p>

              {/* Badges / Highlights */}
              <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-mono text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                  📚 合规与退税知识库
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                  🔍 语义精准召回
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectScenario("rag_qa")}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/40 transition-all group-hover:translate-x-0.5"
            >
              <span>进入知识库问答</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
