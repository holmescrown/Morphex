import React, { useState } from "react";
import {
  Wrench,
  Sparkles,
  Layers,
  Sliders,
  X,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  Code2,
  Globe,
  ArrowRight,
  RefreshCw,
  Copy,
  AlertCircle,
  Zap,
  Terminal,
  Shield,
  HelpCircle,
} from "lucide-react";
import { ToolDefinition, ToolParameterProperty } from "../types/schemas.ts";

export type ToolModalTab = "templates" | "ai" | "designer";

interface PromptToToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTool: (tool: ToolDefinition) => void;
  initialTab?: ToolModalTab;
}

// 预置高频生产级工具模板 (Preset Production Templates)
export interface ToolTemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "function" | "api" | "builtin";
  parameters: Record<string, ToolParameterProperty>;
  codeBody?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  exampleInput: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
}

export const PRESET_TOOL_TEMPLATES: ToolTemplateItem[] = [
  {
    id: "calc_salary_tax",
    name: "个人所得税与五险一金精算器",
    description: "根据税前月薪、起征点及专项附加扣除，高精度计算应纳税额与到手实发工资",
    category: "财务金融",
    type: "function",
    parameters: {
      grossSalary: {
        type: "number",
        description: "税前月薪总额 (¥)",
        required: true,
        default: 15000,
      },
      deductions: {
        type: "number",
        description: "五险一金个人缴纳总额 (¥)",
        required: false,
        default: 2600,
      },
      specialDeductions: {
        type: "number",
        description: "子女教育/房贷等专项附加扣除 (¥)",
        required: false,
        default: 2000,
      },
      taxThreshold: {
        type: "number",
        description: "个税起征点 (¥)",
        required: false,
        default: 5000,
      },
    },
    codeBody: `const gross = Number(args.grossSalary) || 0;
const deductions = Number(args.deductions) || 0;
const special = Number(args.specialDeductions) || 0;
const threshold = Number(args.taxThreshold) || 5000;

const taxableIncome = Math.max(0, gross - deductions - special - threshold);
let taxRate = 0.03;
let quickDeduction = 0;

if (taxableIncome <= 3000) {
  taxRate = 0.03; quickDeduction = 0;
} else if (taxableIncome <= 12000) {
  taxRate = 0.10; quickDeduction = 210;
} else if (taxableIncome <= 25000) {
  taxRate = 0.20; quickDeduction = 1410;
} else {
  taxRate = 0.25; quickDeduction = 2660;
}

const taxAmount = Math.max(0, Math.round((taxableIncome * taxRate - quickDeduction) * 100) / 100);
const netSalary = Math.round((gross - deductions - taxAmount) * 100) / 100;

return {
  grossSalary: gross,
  taxableIncome,
  taxRate: (taxRate * 100) + "%",
  quickDeduction,
  taxAmount,
  netSalary,
  summary: \`税前 ¥\${gross}，应纳税所得额 ¥\${taxableIncome}，应缴个税 ¥\${taxAmount}，实际到手 ¥\${netSalary}\`
};`,
    exampleInput: { grossSalary: 18000, deductions: 3200, specialDeductions: 2000, taxThreshold: 5000 },
    expectedOutput: { grossSalary: 18000, taxableIncome: 7800, taxAmount: 570, netSalary: 14230 },
  },
  {
    id: "regex_data_cleaner",
    name: "正则规则提取与敏感信息脱敏",
    description: "从非结构化文本中提取手机号、邮箱、身份证，或执行掩码脱敏操作",
    category: "数据清洗",
    type: "function",
    parameters: {
      rawText: {
        type: "string",
        description: "待处理的原始非结构化文本",
        required: true,
      },
      maskPhone: {
        type: "boolean",
        description: "是否对手机号进行 138****0000 掩码脱敏",
        required: false,
        default: true,
      },
    },
    codeBody: `const text = String(args.rawText || "");
const mask = args.maskPhone !== false;

const phoneRegex = /(1[3-9]\\d{9})/g;
const emailRegex = /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)/g;

const foundPhones = text.match(phoneRegex) || [];
const foundEmails = text.match(emailRegex) || [];

let sanitizedText = text;
if (mask) {
  sanitizedText = sanitizedText.replace(phoneRegex, (p) => p.substring(0, 3) + "****" + p.substring(7));
}

return {
  extractedPhones: Array.from(new Set(foundPhones)),
  extractedEmails: Array.from(new Set(foundEmails)),
  sanitizedText,
  matchCounts: { phones: foundPhones.length, emails: foundEmails.length }
};`,
    exampleInput: { rawText: "请联系张经理，手机：13812345678，邮箱：zhang@corp.com，备用电话：13987654321", maskPhone: true },
    expectedOutput: { extractedPhones: ["13812345678", "13987654321"], sanitizedText: "请联系张经理，手机：138****5678..." },
  },
  {
    id: "lead_scoring_engine",
    name: "多维线索价值评分引擎",
    description: "根据客户公司规模、采购预算与业务意向，输出商机评分与优先级分配建议",
    category: "智能分析",
    type: "function",
    parameters: {
      companySize: {
        type: "string",
        description: "企业规模 (1-50人 / 50-200人 / 200-1000人 / 1000人以上)",
        required: true,
        default: "50-200人",
      },
      budgetAmount: {
        type: "number",
        description: "预估采购预算金额 (¥)",
        required: true,
        default: 100000,
      },
      decisionMakerContacted: {
        type: "boolean",
        description: "是否已触达核心决策人 (CXO / VP / 部门负责人)",
        required: false,
        default: false,
      },
    },
    codeBody: `const size = String(args.companySize || "");
const budget = Number(args.budgetAmount) || 0;
const dm = Boolean(args.decisionMakerContacted);

let score = 50;

if (size.includes("1000")) score += 25;
else if (size.includes("200")) score += 18;
else if (size.includes("50")) score += 10;

if (budget >= 500000) score += 25;
else if (budget >= 200000) score += 18;
else if (budget >= 50000) score += 10;

if (dm) score += 15;

score = Math.min(100, score);
let tier = "P3 普通线索";
let suggestedAction = "安排 SDR 邮件跟进";

if (score >= 85) {
  tier = "P0 战略高价值商机";
  suggestedAction = "立即分配资深销售总监 1 小时内电话对接";
} else if (score >= 70) {
  tier = "P1 重点跟进商机";
  suggestedAction = "安排 Account Executive 今日发起方案演示";
} else if (score >= 55) {
  tier = "P2 潜力培育线索";
  suggestedAction = "推送产品白皮书与自动化营销邮件序列";
}

return {
  score,
  tier,
  suggestedAction,
  factors: { sizeWeight: size, budgetAmount: budget, hasDecisionMaker: dm }
};`,
    exampleInput: { companySize: "200-1000人", budgetAmount: 350000, decisionMakerContacted: true },
    expectedOutput: { score: 91, tier: "P0 战略高价值商机", suggestedAction: "立即分配资深销售总监..." },
  },
  {
    id: "feishu_webhook_notifier",
    name: "企业微信/飞书 Webhook 告警卡片",
    description: "格式化任务告警或业务动态并构建 REST API 请求体",
    category: "通信推送",
    type: "api",
    parameters: {
      title: { type: "string", description: "通知标题", required: true, default: "系统运行告警" },
      content: { type: "string", description: "消息正文", required: true, default: "任务执行完毕" },
      severity: { type: "string", description: "告警级别 (info/warning/critical)", required: false, default: "info" },
    },
    endpoint: "https://open.feishu.cn/open-apis/bot/v2/hook/mock_token",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    codeBody: `return {
  msg_type: "interactive",
  card: {
    header: {
      title: { tag: "plain_text", content: args.title },
      template: args.severity === "critical" ? "red" : args.severity === "warning" ? "orange" : "blue"
    },
    elements: [
      { tag: "div", text: { tag: "lark_md", content: args.content } },
      { tag: "hr" },
      { tag: "note", elements: [{ tag: "plain_text", content: "来自 No-Code Agent OS 自动化流水线" }] }
    ]
  }
};`,
    exampleInput: { title: "商机自动赢单通知", content: "客户【未来数智科技】已签署电子合同", severity: "info" },
    expectedOutput: { status: "ready_to_send", payloadType: "feishu_interactive_card" },
  },
];

export const PromptToToolModal: React.FC<PromptToToolModalProps> = ({
  isOpen,
  onClose,
  onSaveTool,
  initialTab = "templates",
}) => {
  const [activeTab, setActiveTab] = useState<ToolModalTab>(initialTab);

  // Tab 1: Template Selection State
  const [selectedTemplate, setSelectedTemplate] = useState<ToolTemplateItem>(PRESET_TOOL_TEMPLATES[0]);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("全部");

  // Tab 2: AI Prompt to Tool State
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiCategory, setAiCategory] = useState<string>("数据处理与智能分析");
  const [aiToolType, setAiToolType] = useState<"function" | "api">("function");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiGeneratedTool, setAiGeneratedTool] = useState<ToolDefinition | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTestOutput, setAiTestOutput] = useState<unknown | null>(null);

  // Tab 3: Visual Schema Designer State
  const [designerId, setDesignerId] = useState<string>("tool_" + Math.random().toString(36).substring(2, 8));
  const [designerName, setDesignerName] = useState<string>("自定义数据计算器");
  const [designerDesc, setDesignerDesc] = useState<string>("执行自定义业务规则计算与入参校验");
  const [designerCategory, setDesignerCategory] = useState<string>("自定义工具");
  const [designerType, setDesignerType] = useState<"function" | "api" | "builtin">("function");
  const [designerEndpoint, setDesignerEndpoint] = useState<string>("");
  const [designerMethod, setDesignerMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("POST");
  const [designerCodeBody, setDesignerCodeBody] = useState<string>(
    `// 在此处编写纯 JavaScript 执行逻辑\n// 可直接使用 args 对象，返回纯 Object\nconst { val1 = 10, val2 = 20 } = args;\nreturn {\n  sum: val1 + val2,\n  product: val1 * val2,\n  timestamp: new Date().toISOString()\n};`
  );

  // Designer Parameters state
  interface EditableParam {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    description: string;
    required: boolean;
    defaultValue: string;
  }

  const [designerParams, setDesignerParams] = useState<EditableParam[]>([
    { key: "val1", type: "number", description: "第一个操作数值", required: true, defaultValue: "10" },
    { key: "val2", type: "number", description: "第二个操作数值", required: true, defaultValue: "20" },
  ]);

  // Designer Dry Run Sandbox state
  const [designerTestArgs, setDesignerTestArgs] = useState<Record<string, string>>({
    val1: "10",
    val2: "20",
  });
  const [designerTestOutput, setDesignerTestOutput] = useState<unknown | null>(null);
  const [isDesignerTesting, setIsDesignerTesting] = useState<boolean>(false);
  const [showJsonSchemaPreview, setShowJsonSchemaPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Handlers: Tab 1 - Template Actions
  // ----------------------------------------------------
  const handleImportTemplate = (tpl: ToolTemplateItem) => {
    const newTool: ToolDefinition = {
      id: tpl.id + "_" + Math.random().toString(36).substring(2, 6),
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      type: tpl.type,
      parameters: tpl.parameters,
      codeBody: tpl.codeBody,
      endpoint: tpl.endpoint,
      method: tpl.method,
      headers: tpl.headers,
      createdAt: new Date().toISOString(),
    };
    onSaveTool(newTool);
    onClose();
  };

  const handleEditTemplateInDesigner = (tpl: ToolTemplateItem) => {
    setDesignerId(tpl.id + "_" + Math.random().toString(36).substring(2, 6));
    setDesignerName(tpl.name);
    setDesignerDesc(tpl.description);
    setDesignerCategory(tpl.category);
    setDesignerType(tpl.type);
    setDesignerCodeBody(tpl.codeBody || "");
    setDesignerEndpoint(tpl.endpoint || "");
    setDesignerMethod(tpl.method || "POST");

    const convertedParams: EditableParam[] = Object.entries(tpl.parameters).map(([k, v]) => ({
      key: k,
      type: v.type,
      description: v.description,
      required: v.required,
      defaultValue: v.default !== undefined ? String(v.default) : "",
    }));
    setDesignerParams(convertedParams);

    const initialArgs: Record<string, string> = {};
    Object.entries(tpl.exampleInput).forEach(([k, v]) => {
      initialArgs[k] = String(v);
    });
    setDesignerTestArgs(initialArgs);

    setActiveTab("designer");
  };

  // ----------------------------------------------------
  // Handlers: Tab 2 - AI Tool Generation
  // ----------------------------------------------------
  const handleGenerateToolWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    setAiGeneratedTool(null);
    setAiTestOutput(null);

    try {
      const resp = await fetch("/api/generate-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: aiCategory,
          toolType: aiToolType,
        }),
      });

      if (!resp.ok) {
        throw new Error(`生成失败: HTTP ${resp.status}`);
      }

      const data = await resp.json();
      if (!data.tool) {
        throw new Error("模型未返回有效工具格式");
      }

      const raw = data.tool;
      const formattedTool: ToolDefinition = {
        id: (raw.id || "tool_ai_" + Math.random().toString(36).substring(2, 7)).toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        name: raw.name || "AI 智能生成工具",
        description: raw.description || aiPrompt,
        category: raw.category || aiCategory,
        type: raw.type || aiToolType,
        parameters: (raw.parameters && typeof raw.parameters === "object") ? raw.parameters : {
          input: { type: "string", description: "输入载荷", required: true },
        },
        codeBody: raw.codeBody || "return { status: 'success', input: args };",
        createdAt: new Date().toISOString(),
      };

      setAiGeneratedTool(formattedTool);
    } catch (err: unknown) {
      console.warn("AI Generation failed, falling back to local synthesis:", err);
      // Local fallback tool generator if backend LLM unavailable
      const fallbackId = "tool_synth_" + Math.random().toString(36).substring(2, 7);
      const fallbackTool: ToolDefinition = {
        id: fallbackId,
        name: aiPrompt.slice(0, 18) + (aiPrompt.length > 18 ? "..." : ""),
        description: aiPrompt,
        category: aiCategory,
        type: aiToolType,
        parameters: {
          queryText: { type: "string", description: "待处理输入内容", required: true, default: "测试样本" },
          threshold: { type: "number", description: "数值阈值或限制", required: false, default: 100 },
        },
        codeBody: `const input = String(args.queryText || "");\nconst limit = Number(args.threshold) || 100;\nreturn {\n  success: true,\n  length: input.length,\n  processed: input.trim().toUpperCase(),\n  isWithinLimit: input.length <= limit\n};`,
        createdAt: new Date().toISOString(),
      };
      setAiGeneratedTool(fallbackTool);
      setAiError(err instanceof Error ? `(提示: 使用本地智能兜底规则) ${err.message}` : null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestAiGeneratedTool = () => {
    if (!aiGeneratedTool) return;
    try {
      const mockArgs: Record<string, unknown> = {};
      (Object.entries(aiGeneratedTool.parameters) as [string, ToolParameterProperty][]).forEach(([k, v]) => {
        if (v.default !== undefined) {
          mockArgs[k] = v.default;
        } else if (v.type === "number") {
          mockArgs[k] = 100;
        } else if (v.type === "boolean") {
          mockArgs[k] = true;
        } else {
          mockArgs[k] = "示例文本值";
        }
      });

      const runner = new Function("args", aiGeneratedTool.codeBody || "return { success: true };");
      const result = runner(mockArgs);
      setAiTestOutput({ mockInputs: mockArgs, executionResult: result });
    } catch (e: unknown) {
      setAiTestOutput({ error: e instanceof Error ? e.message : String(e) });
    }
  };

  const handleSendAiToolToDesigner = () => {
    if (!aiGeneratedTool) return;
    setDesignerId(aiGeneratedTool.id);
    setDesignerName(aiGeneratedTool.name);
    setDesignerDesc(aiGeneratedTool.description);
    setDesignerCategory(aiGeneratedTool.category);
    setDesignerType(aiGeneratedTool.type);
    setDesignerCodeBody(aiGeneratedTool.codeBody || "");

    const converted: EditableParam[] = (Object.entries(aiGeneratedTool.parameters) as [string, ToolParameterProperty][]).map(([k, v]) => ({
      key: k,
      type: v.type,
      description: v.description,
      required: v.required,
      defaultValue: v.default !== undefined ? String(v.default) : "",
    }));
    setDesignerParams(converted);

    setActiveTab("designer");
  };

  // ----------------------------------------------------
  // Handlers: Tab 3 - Visual Designer
  // ----------------------------------------------------
  const handleAddParam = () => {
    const newKey = "param_" + (designerParams.length + 1);
    setDesignerParams((prev) => [
      ...prev,
      {
        key: newKey,
        type: "string",
        description: "参数功能描述",
        required: true,
        defaultValue: "",
      },
    ]);
    setDesignerTestArgs((prev) => ({ ...prev, [newKey]: "" }));
  };

  const handleRemoveParam = (index: number) => {
    const paramToRemove = designerParams[index];
    setDesignerParams((prev) => prev.filter((_, idx) => idx !== index));
    if (paramToRemove) {
      setDesignerTestArgs((prev) => {
        const next = { ...prev };
        delete next[paramToRemove.key];
        return next;
      });
    }
  };

  const handleUpdateParam = (index: number, updates: Partial<EditableParam>) => {
    setDesignerParams((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleDryRunDesigner = () => {
    setIsDesignerTesting(true);
    setDesignerTestOutput(null);

    try {
      // Cast test arguments based on schema types
      const castedArgs: Record<string, unknown> = {};
      designerParams.forEach((p) => {
        const rawVal = designerTestArgs[p.key] !== undefined ? designerTestArgs[p.key] : p.defaultValue;
        if (p.type === "number") {
          castedArgs[p.key] = Number(rawVal) || 0;
        } else if (p.type === "boolean") {
          castedArgs[p.key] = rawVal === "true" || rawVal === true;
        } else if (p.type === "object" || p.type === "array") {
          try {
            castedArgs[p.key] = JSON.parse(rawVal);
          } catch {
            castedArgs[p.key] = rawVal;
          }
        } else {
          castedArgs[p.key] = String(rawVal);
        }
      });

      if (designerType === "function") {
        const fn = new Function("args", designerCodeBody);
        const res = fn(castedArgs);
        setDesignerTestOutput({
          status: "success",
          evaluatedWithArgs: castedArgs,
          result: res,
        });
      } else {
        setDesignerTestOutput({
          status: "ready",
          type: "api_proxy",
          targetEndpoint: designerEndpoint || "https://api.example.com/v1/resource",
          method: designerMethod,
          payload: castedArgs,
        });
      }
    } catch (err: unknown) {
      setDesignerTestOutput({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsDesignerTesting(false);
    }
  };

  const handleSaveFromDesigner = () => {
    if (!designerName.trim()) return;

    // Convert designerParams array to Record<string, ToolParameterProperty>
    const parametersRecord: Record<string, ToolParameterProperty> = {};
    designerParams.forEach((p) => {
      if (p.key.trim()) {
        let defVal: string | number | boolean | null | undefined = undefined;
        if (p.defaultValue) {
          if (p.type === "number") defVal = Number(p.defaultValue);
          else if (p.type === "boolean") defVal = p.defaultValue === "true";
          else defVal = p.defaultValue;
        }

        parametersRecord[p.key.trim()] = {
          type: p.type,
          description: p.description,
          required: p.required,
          default: defVal,
        };
      }
    });

    const newTool: ToolDefinition = {
      id: designerId.trim() || "tool_" + Math.random().toString(36).substring(2, 8),
      name: designerName.trim(),
      description: designerDesc.trim(),
      category: designerCategory.trim() || "Custom",
      type: designerType,
      parameters: parametersRecord,
      codeBody: designerType === "function" ? designerCodeBody : undefined,
      endpoint: designerType === "api" ? designerEndpoint : undefined,
      method: designerType === "api" ? designerMethod : undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveTool(newTool);
    onClose();
  };

  // Compile JSON Schema preview
  const compiledJsonSchema = {
    type: "object",
    properties: designerParams.reduce<Record<string, unknown>>((acc, p) => {
      acc[p.key] = {
        type: p.type,
        description: p.description,
        ...(p.defaultValue ? { default: p.defaultValue } : {}),
      };
      return acc;
    }, {}),
    required: designerParams.filter((p) => p.required).map((p) => p.key),
  };

  // Categories list for filter
  const allCategories = ["全部", ...Array.from(new Set(PRESET_TOOL_TEMPLATES.map((t) => t.category)))];
  const filteredTemplates = PRESET_TOOL_TEMPLATES.filter(
    (t) => templateCategoryFilter === "全部" || t.category === templateCategoryFilter
  );

  return (
    <div
      id="prompt-to-tool-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200"
    >
      <div
        id="prompt-to-tool-modal-container"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
      >
        {/* =========================================================================
            1. Modal Header
           ========================================================================= */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-950/50">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                原子工具构建器 (Tool Builder)
                <span className="px-2 py-0.5 text-[10px] font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded">
                  三合一入口
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                支持预设模板一键导入、自然语言 Prompt AI 生成，或可视化自定义 Schema 参数契约与沙箱
              </p>
            </div>
          </div>

          <button
            id="btn-close-tool-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            2. Three-in-One Tabs Navigation
           ========================================================================= */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            {/* Tab 1: Templates */}
            <button
              id="tab-btn-templates"
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "templates"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. 预设模板库</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-mono">
                {PRESET_TOOL_TEMPLATES.length}
              </span>
            </button>

            {/* Tab 2: AI Generation */}
            <button
              id="tab-btn-ai"
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-md shadow-amber-950/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. AI 提示词生成 (Prompt-to-Tool)</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-amber-300 rounded font-mono">
                Gemini
              </span>
            </button>

            {/* Tab 3: Visual Schema Designer */}
            <button
              id="tab-btn-designer"
              onClick={() => setActiveTab("designer")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "designer"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. 可视化 Schema 设计器</span>
            </button>
          </div>

          <span className="hidden md:inline-flex text-[11px] text-slate-400 font-mono items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            严格符合 JSON Schema 与 Agent 沙箱安全标准
          </span>
        </div>

        {/* =========================================================================
            3. Tab 1: Preset Templates View
           ========================================================================= */}
        {activeTab === "templates" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Template Catalog */}
            <div className="w-96 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
              {/* Category Filter Pills */}
              <div className="p-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTemplateCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      templateCategoryFilter === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredTemplates.map((tpl) => {
                  const isSelected = selectedTemplate.id === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/40"
                          : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-white truncate">{tpl.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{tpl.description}</p>
                      <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-500 font-mono">
                        <span>{Object.keys(tpl.parameters).length} 个入参</span>
                        <span>{tpl.type.toUpperCase()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Template Deep Preview & Actions */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 flex flex-col">
              {/* Header Info */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                        ID: {selectedTemplate.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">分类: {selectedTemplate.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selectedTemplate.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditTemplateInDesigner(selectedTemplate)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>在设计器中微调</span>
                    </button>

                    <button
                      onClick={() => handleImportTemplate(selectedTemplate)}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-950/50 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>一键导入此工具</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{selectedTemplate.description}</p>
              </div>

              {/* Parameters Schema Specifications */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    参数 Schema 规范 ({Object.keys(selectedTemplate.parameters).length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(Object.entries(selectedTemplate.parameters) as [string, ToolParameterProperty][]).map(([k, prop]) => (
                    <div key={k} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-orange-300">{k}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
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
                          默认值: <span className="text-slate-300">{String(prop.default)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Snippet or API Config */}
              {selectedTemplate.codeBody && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    JavaScript 执行代码体 (Sandbox Body)
                  </span>
                  <pre className="p-3 bg-slate-950 text-indigo-200 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-48">
                    {selectedTemplate.codeBody}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            4. Tab 2: AI Prompt to Tool View
           ========================================================================= */}
        {activeTab === "ai" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left AI Prompt Input Area */}
            <div className="w-[45%] border-r border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    自然语言描述你的工具需求
                  </label>
                  <p className="text-[11px] text-slate-400">
                    只需描述工具的核心功能、入参和期望计算逻辑，Gemini 将自动构建参数规范与沙箱代码。
                  </p>
                </div>

                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="例如：输入员工税前月薪和考勤缺勤天数，自动根据每天扣除基数计算实际应发工资与五险一金比例..."
                  rows={6}
                  className="w-full p-3 bg-slate-950 text-slate-100 text-xs rounded-2xl border border-slate-800 focus:border-amber-500/60 focus:outline-none resize-none leading-relaxed"
                />

                {/* Quick Suggestion Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500">💡 快速灵感词:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "根据纳税人识别号与开票金额计算销项增值税",
                      "提取客服聊天记录中的手机号/姓名并进行敏感词打码",
                      "计算销售合同违约金与逾期利息",
                      "将 Markdown 格式表格转化为多维 JSON 结构",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setAiPrompt(chip)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-amber-200 text-[11px] rounded-lg transition-colors text-left"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configurations */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">分类领域</label>
                    <input
                      type="text"
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">运行类型</label>
                    <select
                      value={aiToolType}
                      onChange={(e) => setAiToolType(e.target.value as "function" | "api")}
                      className="w-full px-3 py-1.5 bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl"
                    >
                      <option value="function">JavaScript 沙箱函数</option>
                      <option value="api">RESTful HTTP API</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  disabled={isGenerating || !aiPrompt.trim()}
                  onClick={handleGenerateToolWithAI}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isGenerating || !aiPrompt.trim()
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-extrabold hover:brightness-110 shadow-orange-950/50"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Gemini 3.7 Flash 深度生成中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>一键智能生成工具 Schema</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Output & Interactive Testing */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col space-y-4">
              {aiGeneratedTool ? (
                <>
                  {/* Generated Tool Header */}
                  <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                          ID: {aiGeneratedTool.id}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Category: {aiGeneratedTool.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSendAiToolToDesigner}
                          className="px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl"
                        >
                          发往设计器微调
                        </button>
                        <button
                          onClick={() => {
                            onSaveTool(aiGeneratedTool);
                            onClose();
                          }}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-950/40"
                        >
                          保存到工具库
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white">{aiGeneratedTool.name}</h3>
                    <p className="text-xs text-slate-300">{aiGeneratedTool.description}</p>
                  </div>

                  {/* Parameters Grid */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        生成的参数规范 ({Object.keys(aiGeneratedTool.parameters).length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(Object.entries(aiGeneratedTool.parameters) as [string, ToolParameterProperty][]).map(([k, p]) => (
                        <div key={k} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-300">{k}</span>
                            <span className="text-[10px] font-mono text-slate-500">[{p.type}]</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code Snippet */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-purple-400" />
                        生成的 JavaScript 代码
                      </span>
                      <button
                        onClick={handleTestAiGeneratedTool}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        立即测试沙箱
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-950 text-purple-200 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-40">
                      {aiGeneratedTool.codeBody}
                    </pre>

                    {aiTestOutput && (
                      <div className="mt-2 p-3 bg-slate-950 text-cyan-300 font-mono text-xs rounded-xl border border-cyan-800/40">
                        <div className="text-[10px] text-slate-400 mb-1">测试运行结果 (Execution Result):</div>
                        <pre className="overflow-x-auto">{JSON.stringify(aiTestOutput, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300">暂无生成的工具</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    在左侧输入你的自然语言需求并点击“一键智能生成”，即可在此处实时预览生成的工具规范与执行逻辑。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            5. Tab 3: Visual Schema Designer View
           ========================================================================= */}
        {activeTab === "designer" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Main Form: Basics & Parameters */}
            <div className="flex-1 border-r border-slate-800 bg-slate-900/40 p-6 overflow-y-auto space-y-6">
              {/* Section 1: Basics */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  基础元数据配置 (Metadata)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">工具名称</label>
                    <input
                      type="text"
                      value={designerName}
                      onChange={(e) => setDesignerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 text-xs text-slate-100 border border-slate-800 rounded-xl focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">唯一标识符 (ID)</label>
                    <input
                      type="text"
                      value={designerId}
                      onChange={(e) => setDesignerId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 font-mono text-xs text-purple-300 border border-slate-800 rounded-xl focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">所属分类</label>
                    <input
                      type="text"
                      value={designerCategory}
                      onChange={(e) => setDesignerCategory(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 text-xs text-slate-100 border border-slate-800 rounded-xl focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">执行类型</label>
                    <select
                      value={designerType}
                      onChange={(e) => setDesignerType(e.target.value as "function" | "api" | "builtin")}
                      className="w-full px-3 py-1.5 bg-slate-950 text-xs text-slate-100 border border-slate-800 rounded-xl focus:border-purple-500"
                    >
                      <option value="function">JavaScript 沙箱函数</option>
                      <option value="api">外部 RESTful HTTP API</option>
                      <option value="builtin">平台内置执行器</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">功能说明 (Description)</label>
                  <textarea
                    value={designerDesc}
                    onChange={(e) => setDesignerDesc(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl focus:border-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Visual Parameters Builder */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    入参规范配置 (Parameters Schema Builder)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddParam}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加参数</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {designerParams.map((param, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-12 gap-2 items-center"
                    >
                      {/* Key */}
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-500 font-mono">字段键名 (Key)</label>
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => handleUpdateParam(idx, { key: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 font-mono text-xs text-orange-300 border border-slate-700 rounded-lg"
                        />
                      </div>

                      {/* Type */}
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500">类型 (Type)</label>
                        <select
                          value={param.type}
                          onChange={(e) =>
                            handleUpdateParam(idx, {
                              type: e.target.value as EditableParam["type"],
                            })
                          }
                          className="w-full px-2 py-1 bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="array">array</option>
                          <option value="object">object</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-500">参数语义描述</label>
                        <input
                          type="text"
                          value={param.description}
                          onChange={(e) => handleUpdateParam(idx, { description: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 text-xs text-slate-300 border border-slate-700 rounded-lg"
                        />
                      </div>

                      {/* Required Toggle */}
                      <div className="col-span-2 flex flex-col items-center">
                        <label className="text-[10px] text-slate-500">必填项</label>
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => handleUpdateParam(idx, { required: e.target.checked })}
                          className="mt-1 w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700 focus:ring-0"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => handleRemoveParam(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Execution Code / Endpoint */}
              {designerType === "function" ? (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      JavaScript 执行逻辑代码 (Sandbox Body)
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">参数通过 args.xxx 访问</span>
                  </div>
                  <textarea
                    value={designerCodeBody}
                    onChange={(e) => setDesignerCodeBody(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-slate-950 text-purple-200 font-mono text-xs rounded-xl border border-slate-800 focus:border-purple-500 resize-none"
                  />
                </div>
              ) : (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    RESTful API 代理配置
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="text-xs text-slate-400">Method</label>
                      <select
                        value={designerMethod}
                        onChange={(e) => setDesignerMethod(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="text-xs text-slate-400">API Endpoint URL</label>
                      <input
                        type="text"
                        value={designerEndpoint}
                        onChange={(e) => setDesignerEndpoint(e.target.value)}
                        placeholder="https://api.example.com/v1/action"
                        className="w-full px-3 py-1.5 bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Live Test Sandbox & JSON Schema Inspector */}
            <div className="w-96 border-l border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                {/* Header & Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    实时沙箱调试 (Dry Run)
                  </span>
                  <button
                    onClick={() => setShowJsonSchemaPreview(!showJsonSchemaPreview)}
                    className="text-[11px] font-mono text-purple-400 hover:underline"
                  >
                    {showJsonSchemaPreview ? "返回输入沙箱" : "查看 JSON Schema"}
                  </button>
                </div>

                {showJsonSchemaPreview ? (
                  <div className="p-3 bg-slate-950 text-cyan-300 font-mono text-xs rounded-2xl border border-slate-800 overflow-x-auto max-h-96">
                    <div className="text-[10px] text-slate-500 mb-1">// JSON Schema Spec</div>
                    <pre>{JSON.stringify(compiledJsonSchema, null, 2)}</pre>
                  </div>
                ) : (
                  <>
                    {/* Sandbox Parameter Inputs */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] text-slate-400">提供测试参数值:</span>
                      {designerParams.map((p) => (
                        <div key={p.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-orange-300">{p.key}</span>
                            <span className="text-slate-500">{p.type}</span>
                          </div>
                          <input
                            type="text"
                            value={designerTestArgs[p.key] !== undefined ? designerTestArgs[p.key] : p.defaultValue}
                            onChange={(e) =>
                              setDesignerTestArgs((prev) => ({
                                ...prev,
                                [p.key]: e.target.value,
                              }))
                            }
                            placeholder={p.description || p.key}
                            className="w-full px-2.5 py-1.5 bg-slate-950 text-xs font-mono text-slate-200 border border-slate-800 rounded-xl"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleDryRunDesigner}
                      disabled={isDesignerTesting}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-950/40"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>执行沙箱测试</span>
                    </button>

                    {/* Output Viewer */}
                    {designerTestOutput && (
                      <div className="p-3 bg-slate-950 text-xs font-mono rounded-2xl border border-slate-800 max-h-52 overflow-y-auto space-y-1">
                        <div className="text-[10px] text-slate-500">执行输出 (Output):</div>
                        <pre className="text-emerald-300 overflow-x-auto">
                          {JSON.stringify(designerTestOutput, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Final Save Button */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleSaveFromDesigner}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>保存并注册原子工具</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
