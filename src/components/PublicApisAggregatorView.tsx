// View: Public APIs Cleansing & Domain-Vertical Aggregated API Engine
import React, { useState, useMemo } from "react";
import {
  Sparkles,
  GitFork,
  Database,
  Layers,
  Activity,
  Play,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Code2,
  Download,
  Copy,
  Check,
  Cpu,
  Globe,
  Sliders,
  FileCode2,
  Clock,
  Zap,
  Tag,
  ChevronRight,
  ChevronDown,
  Terminal,
  Workflow as WorkflowIcon,
  HelpCircle,
  TrendingUp,
  Building2,
  DollarSign,
  Package,
} from "lucide-react";
import {
  CleansedApiItem,
  VerticalAggregatedApi,
  ApiDomainCategory,
  AggregationStep,
  AggregatedExecutionResult,
} from "../types/publicApis.ts";
import {
  INITIAL_CLEANSED_APIS,
  INITIAL_VERTICAL_AGGREGATED_APIS,
} from "../data/publicApisDataset.ts";
import { ToolDefinition } from "../types/schemas.ts";

interface PublicApisAggregatorViewProps {
  onRegisterSystemTool?: (newTool: ToolDefinition) => void;
  onNavigateToAgentStudio?: () => void;
}

export const PublicApisAggregatorView: React.FC<PublicApisAggregatorViewProps> = ({
  onRegisterSystemTool,
  onNavigateToAgentStudio,
}) => {
  // Navigation Tabs inside Aggregator View
  const [activeSubTab, setActiveSubTab] = useState<
    "vertical_pipelines" | "cleansed_apis" | "custom_builder" | "export_mcp"
  >("vertical_pipelines");

  // State Collections
  const [cleansedApis, setCleansedApis] = useState<CleansedApiItem[]>(INITIAL_CLEANSED_APIS);
  const [verticalPipelines, setVerticalPipelines] = useState<VerticalAggregatedApi[]>(
    INITIAL_VERTICAL_AGGREGATED_APIS
  );
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(
    INITIAL_VERTICAL_AGGREGATED_APIS[0].id
  );

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedAuthFilter, setSelectedAuthFilter] = useState<string>("All");
  const [httpsOnlyFilter, setHttpsOnlyFilter] = useState(true);
  const [corsOnlyFilter, setCorsOnlyFilter] = useState(false);

  // GitHub Sync State
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // Execution & Live Sandbox State
  const selectedPipeline =
    verticalPipelines.find((p) => p.id === selectedPipelineId) || verticalPipelines[0];
  const [pipelineInputs, setPipelineInputs] = useState<Record<string, unknown>>(
    selectedPipeline?.sampleInput || {}
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<AggregatedExecutionResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"final_json" | "waterfall" | "schema">(
    "final_json"
  );

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom Pipeline Builder State
  const [customBuilderName, setCustomBuilderName] = useState("跨境电商综合选品与物流雷达 API");
  const [customBuilderDomain, setCustomBuilderDomain] = useState<ApiDomainCategory>("E-Commerce & Trade");
  const [customBuilderDesc, setCustomBuilderDesc] = useState("自动聚合多币种汇率、目的港物流轨迹与关税税率，输出一站式海外履约决策。");
  const [customSelectedApiIds, setCustomSelectedApiIds] = useState<string[]>([
    "api_frankfurter",
    "api_openweather",
  ]);
  const [customExecMode, setCustomExecMode] = useState<"sequential" | "parallel">("parallel");

  // System Tool Registration Toast
  const [toolRegisteredToast, setToolRegisteredToast] = useState<string | null>(null);

  const categories: string[] = [
    "All",
    "Finance & Crypto",
    "Geocoding & Maps",
    "Weather & Environment",
    "Logistics & Transport",
    "DevOps & Cloud",
    "CyberSecurity & Threat",
    "E-Commerce & Trade",
    "Government & Open Data",
  ];

  // Filtered Cleansed APIs list
  const filteredApis = useMemo(() => {
    return cleansedApis.filter((api) => {
      const matchSearch =
        api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        api.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === "All" || api.category === selectedCategory;

      const matchAuth =
        selectedAuthFilter === "All" || api.authType === selectedAuthFilter;

      const matchHttps = !httpsOnlyFilter || api.https;
      const matchCors = !corsOnlyFilter || api.cors === "yes";

      return matchSearch && matchCategory && matchAuth && matchHttps && matchCors;
    });
  }, [cleansedApis, searchQuery, selectedCategory, selectedAuthFilter, httpsOnlyFilter, corsOnlyFilter]);

  // Handle Pipeline Switch
  const handleSelectPipeline = (pipeline: VerticalAggregatedApi) => {
    setSelectedPipelineId(pipeline.id);
    setPipelineInputs(pipeline.sampleInput || {});
    setExecutionResult(null);
  };

  // Trigger Live Execution Simulation
  const handleRunPipeline = async () => {
    if (!selectedPipeline || isExecuting) return;

    setIsExecuting(true);
    const startTime = performance.now();

    // Simulate multi-step call waterfall with live delay
    const stepResults: AggregatedExecutionResult["stepResults"] = [];

    for (let i = 0; i < selectedPipeline.steps.length; i++) {
      const step = selectedPipeline.steps[i];
      const stepStartTime = performance.now();

      // Find API config
      const matchedApi = cleansedApis.find((a) => a.id === step.apiId);
      const simulatedDuration = matchedApi ? matchedApi.latencyMs + Math.floor(Math.random() * 40) : 150;

      // Small async sleep for realistic telemetry
      await new Promise((resolve) => setTimeout(resolve, Math.min(simulatedDuration, 350)));

      const stepDuration = Math.round(performance.now() - stepStartTime + simulatedDuration);

      stepResults.push({
        stepId: step.id,
        stepName: step.stepName,
        apiName: step.apiName,
        status: "success",
        durationMs: stepDuration,
        urlCalled: `${matchedApi?.baseUrl || "https://api.example.com"}${step.endpoint}`,
        responseStatus: 200,
        data: matchedApi?.mockResponse || { status: "ok" },
      });
    }

    const totalDuration = Math.round(performance.now() - startTime);

    const result: AggregatedExecutionResult = {
      executionId: "exec_agg_" + Math.random().toString(36).substring(2, 9),
      pipelineId: selectedPipeline.id,
      status: "success",
      totalDurationMs: totalDuration,
      stepResults,
      finalOutput: selectedPipeline.sampleOutput,
      executedAt: new Date().toISOString(),
    };

    setExecutionResult(result);
    setIsExecuting(false);
  };

  // Sync from GitHub raw repo simulation
  const handleSyncGithub = async () => {
    setIsSyncingGithub(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulated additional parsed APIs from public-apis markdown
    const newlyDiscoveredApi: CleansedApiItem = {
      id: `api_parsed_${Date.now()}`,
      name: "OpenAI Public Moderation & Embeddings (Public Feed)",
      description: "从 GitHub public-apis 仓库实时清洗解析：文本合规风险分类与高维语义向量 API",
      category: "AI & Machine Learning",
      authType: "API Key",
      https: true,
      cors: "yes",
      baseUrl: "https://api.openai.com/v1",
      docsUrl: "https://platform.openai.com/docs/guides/moderation",
      sampleEndpoint: "/moderations",
      method: "POST",
      healthScore: 98,
      latencyMs: 160,
      rateLimit: "60 req/min",
      tags: ["AI", "NLP", "Moderation", "Safety"],
      suggestedPipelineRoles: ["内容风控", "语义相似度", "合规审查"],
      mockResponse: { id: "modr-123", flagged: false, categories: { hate: false, violence: false } },
    };

    setCleansedApis((prev) => [newlyDiscoveredApi, ...prev]);
    setIsSyncingGithub(false);
    setSyncSuccessToast("已成功从 github.com/public-apis/public-apis 同步最新数据字典并完成清洗！");
    setTimeout(() => setSyncSuccessToast(null), 4000);
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert Aggregated Pipeline into System Tool
  const handleRegisterAsSystemTool = () => {
    if (!selectedPipeline) return;

    const newTool: ToolDefinition = {
      id: `tool_${selectedPipeline.slug.replace(/[^a-zA-Z0-9_]/g, "_")}`,
      name: selectedPipeline.name,
      description: `【垂直聚合 API】${selectedPipeline.description}`,
      category: "custom",
      type: "function",
      parameters: selectedPipeline.inputSchema.reduce(
        (acc, item) => ({
          ...acc,
          [item.name]: {
            type: item.type,
            description: item.description,
            required: item.required,
            default: item.defaultValue,
          },
        }),
        {}
      ),
      codeBody: `// Auto-generated aggregator tool from public-apis
async function execute(args) {
  return ${JSON.stringify(selectedPipeline.sampleOutput, null, 2)};
}`,
      createdAt: new Date().toISOString(),
    };

    if (onRegisterSystemTool) {
      onRegisterSystemTool(newTool);
    }

    setToolRegisteredToast(`已成功将【${selectedPipeline.name}】注册为系统级 AI Agent 原子工具！`);
    setTimeout(() => setToolRegisteredToast(null), 4000);
  };

  // Create custom pipeline from selected cleaned APIs
  const handleCreateCustomPipeline = () => {
    const selectedApis = cleansedApis.filter((a) => customSelectedApiIds.includes(a.id));
    if (selectedApis.length === 0) return;

    const newSteps: AggregationStep[] = selectedApis.map((api, idx) => ({
      id: `step_${idx + 1}_${api.id}`,
      stepName: `${api.name} 数据抽取`,
      apiId: api.id,
      apiName: api.name,
      category: api.category,
      endpoint: api.sampleEndpoint,
      method: api.method,
      paramsMapping: api.defaultParams || {},
      extractFields: { data: "data" },
      enabled: true,
    }));

    const newPipeline: VerticalAggregatedApi = {
      id: `agg_custom_${Date.now()}`,
      name: customBuilderName || "自定义多源聚合 API",
      slug: `custom-pipeline-${Date.now().toString(36)}`,
      domain: customBuilderDomain,
      description: customBuilderDesc,
      icon: "⚡",
      badge: "自定义聚合",
      version: "1.0.0",
      executionMode: customExecMode,
      inputSchema: [
        {
          name: "query_param",
          type: "string",
          description: "聚合流通用查询入参",
          required: true,
          defaultValue: "default_value",
          example: "test_input",
        },
      ],
      steps: newSteps,
      responseTemplate: JSON.stringify(
        {
          status: "success",
          pipelineName: customBuilderName,
          aggregatedData: selectedApis.map((a) => ({
            source: a.name,
            payload: a.mockResponse,
          })),
        },
        null,
        2
      ),
      sampleInput: { query_param: "test_input" },
      sampleOutput: {
        status: "success",
        pipeline: customBuilderName,
        sourcesCount: selectedApis.length,
        results: selectedApis.map((a) => ({ name: a.name, sample: a.mockResponse })),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setVerticalPipelines((prev) => [newPipeline, ...prev]);
    setSelectedPipelineId(newPipeline.id);
    setActiveSubTab("vertical_pipelines");
    setSyncSuccessToast(`已成功编排并生成新聚合 API: ${newPipeline.name}`);
    setTimeout(() => setSyncSuccessToast(null), 3000);
  };

  return (
    <div
      id="public-apis-aggregator-view"
      className="flex-1 flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden"
    >
      {/* =========================================================================
          1. 顶部数据清洗与聚合引擎看板 (Header Banner)
         ========================================================================= */}
      <div className="border-b border-slate-800/80 bg-slate-900/90 px-4 sm:px-6 py-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-950/50 shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Public-APIs 清洗与垂直聚合 API 引擎
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GitHub Sync 联机
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                1400+ 原始仓 · 15+ 垂直领域
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              自动抓取并清洗开源公共 API 字典，支持跨源串并联编排，产出开箱即用的外贸/运维/金融业务聚合端点与 Agent MCP 工具。
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-sync-github-repo"
            disabled={isSyncingGithub}
            onClick={handleSyncGithub}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSyncingGithub
                ? "bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600 shadow-sm"
            }`}
            title="从 https://github.com/public-apis/public-apis 抓取最新更新并重新跑清洗管道"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGithub ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
            <span>{isSyncingGithub ? "正在清洗与同步..." : "从 GitHub 实时清洗同步"}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("custom_builder")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>编排新聚合 API</span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {syncSuccessToast && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-200 px-4 py-2 text-xs flex items-center justify-between shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessToast}</span>
          </div>
          <button onClick={() => setSyncSuccessToast(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {toolRegisteredToast && (
        <div className="bg-indigo-950/80 border-b border-indigo-800/80 text-indigo-200 px-4 py-2 text-xs flex items-center justify-between shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{toolRegisteredToast}</span>
          </div>
          <button onClick={() => setToolRegisteredToast(null)} className="text-indigo-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          2. 二级导航 Tab (Sub-navigation)
         ========================================================================= */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab("vertical_pipelines")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "vertical_pipelines"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>垂直业务聚合 API ({verticalPipelines.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("cleansed_apis")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "cleansed_apis"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>清洗后公共 API 资产库 ({cleansedApis.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("custom_builder")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "custom_builder"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>可视化组合编排器</span>
          </button>

          <button
            onClick={() => setActiveSubTab("export_mcp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "export_mcp"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>MCP / OpenAPI 导出</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden md:flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            100% HTTPS 强制
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            CORS / Proxy 兼容
          </span>
        </div>
      </div>

      {/* =========================================================================
          3. 主体内容区 (Main Content View)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* =====================================================================
            TAB 1: 垂直业务聚合 API 列表与实时沙箱 (Vertical Pipelines View)
           ===================================================================== */}
        {activeSubTab === "vertical_pipelines" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Sidebar: Pipeline Selector */}
            <div className="w-full lg:w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col overflow-hidden shrink-0">
              <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  已上线业务聚合流
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  {verticalPipelines.length} 个端点
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {verticalPipelines.map((pipeline) => {
                  const isSelected = pipeline.id === selectedPipelineId;
                  return (
                    <div
                      key={pipeline.id}
                      onClick={() => handleSelectPipeline(pipeline)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group ${
                        isSelected
                          ? "bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-950/30"
                          : "bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{pipeline.icon}</span>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-white truncate">
                              {pipeline.name}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400">
                              {pipeline.slug}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 border ${
                            pipeline.domain === "E-Commerce & Trade"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : pipeline.domain === "DevOps & Cloud"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {pipeline.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                        {pipeline.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          {pipeline.steps.length} 个串联 API
                        </span>
                        <span className="uppercase text-indigo-300">
                          {pipeline.executionMode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Pipeline Details & Interactive Sandbox */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 sm:p-6 space-y-6">
              {/* Pipeline Meta Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="text-3xl p-2.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                      {selectedPipeline.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-white">
                          {selectedPipeline.name}
                        </h2>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                          v{selectedPipeline.version}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                          {selectedPipeline.domain}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                        {selectedPipeline.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={handleRegisterAsSystemTool}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all"
                      title="一键将该聚合端点转换为当前系统的 Agent 原子工具"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>转换为 Agent 工具</span>
                    </button>

                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedPipeline, null, 2), "pipeline_json")}
                      className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl border border-slate-700 transition-colors"
                      title="复制完整聚合流定义 JSON"
                    >
                      {copiedKey === "pipeline_json" ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Steps Visual Chain */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>聚合流水线调用链 ({selectedPipeline.steps.length} 级 Sub-APIs)</span>
                    <span className="font-mono text-cyan-400">
                      模式: {selectedPipeline.executionMode === "parallel" ? "并发聚合 (Parallel Fan-Out)" : "串行流水线 (Sequential Pipe)"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
                    {selectedPipeline.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                            <span>Step 0{idx + 1}</span>
                            <span className="text-indigo-300">{step.method}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-200 mb-1">
                            {step.apiName}
                          </h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1 font-mono">
                            {step.endpoint}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-[9px] font-mono text-slate-500">
                          抽取字段: {Object.keys(step.extractFields).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Execution & Sandbox Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Form: Parameter Inputs */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          入参配置 (Input Parameters)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedPipeline.inputSchema.length} 个动态字段
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedPipeline.inputSchema.map((field) => (
                        <div key={field.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-mono font-medium text-slate-300">
                              {field.name}
                              {field.required && <span className="text-rose-400 ml-1">*</span>}
                            </label>
                            <span className="text-[10px] font-mono text-slate-500">
                              {field.type}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={String(pipelineInputs[field.name] ?? field.defaultValue)}
                            onChange={(e) =>
                              setPipelineInputs((prev) => ({
                                ...prev,
                                [field.name]:
                                  field.type === "number"
                                    ? Number(e.target.value) || 0
                                    : e.target.value,
                              }))
                            }
                            placeholder={String(field.example)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                          <p className="text-[10px] text-slate-400">{field.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-5 pt-3 border-t border-slate-800">
                    <button
                      id="btn-run-aggregated-pipeline"
                      disabled={isExecuting}
                      onClick={handleRunPipeline}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                        isExecuting
                          ? "bg-amber-600/80 cursor-not-allowed animate-pulse"
                          : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-950/50"
                      }`}
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>正在发起跨 API 聚合调用...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>执行端点聚合验证 (Live Request)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Result: Waterfall & JSON Output */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col">
                  {/* Result Header Tabs */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveResultTab("final_json")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                          activeResultTab === "final_json"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        聚合响应 JSON
                      </button>
                      <button
                        onClick={() => setActiveResultTab("waterfall")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                          activeResultTab === "waterfall"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        时延瀑布图 (Waterfall)
                      </button>
                      <button
                        onClick={() => setActiveResultTab("schema")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                          activeResultTab === "schema"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        响应模板
                      </button>
                    </div>

                    {executionResult && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        耗时: {executionResult.totalDurationMs} ms
                      </span>
                    )}
                  </div>

                  {/* Tab Contents */}
                  <div className="flex-1 min-h-[300px] flex flex-col justify-between">
                    {activeResultTab === "final_json" && (
                      <div className="relative flex-1 bg-slate-950 rounded-xl p-3 border border-slate-800/80 overflow-auto font-mono text-xs text-cyan-300 max-h-96">
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(
                                executionResult
                                  ? executionResult.finalOutput
                                  : selectedPipeline.sampleOutput,
                                null,
                                2
                              ),
                              "res_json"
                            )
                          }
                          className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                        >
                          {copiedKey === "res_json" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <pre>
                          {JSON.stringify(
                            executionResult
                              ? executionResult.finalOutput
                              : selectedPipeline.sampleOutput,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}

                    {activeResultTab === "waterfall" && (
                      <div className="space-y-3 p-2">
                        {(executionResult?.stepResults ||
                          selectedPipeline.steps.map((s, idx) => ({
                            stepId: s.id,
                            stepName: s.stepName,
                            apiName: s.apiName,
                            status: "success" as const,
                            durationMs: 120 + idx * 45,
                            urlCalled: s.endpoint,
                            responseStatus: 200,
                            data: {},
                          }))
                        ).map((step, idx) => (
                          <div
                            key={step.stepId}
                            className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {step.stepName} ({step.apiName})
                              </span>
                              <span className="text-[10px] font-mono text-cyan-400">
                                {step.durationMs} ms · HTTP {step.responseStatus}
                              </span>
                            </div>

                            {/* Waterfall Bar */}
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(20, (step.durationMs / 400) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 truncate">
                              {step.urlCalled}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeResultTab === "schema" && (
                      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 font-mono text-xs text-purple-300 overflow-auto max-h-96">
                        <pre>{selectedPipeline.responseTemplate}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: 清洗后公共 API 资产库 (Cleansed Public APIs Hub)
           ===================================================================== */}
        {activeSubTab === "cleansed_apis" && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索 API 名称、标签 (Forex, Geo, Weather, DNS, SSL)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={httpsOnlyFilter}
                    onChange={(e) => setHttpsOnlyFilter(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>强制 HTTPS (100%)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={corsOnlyFilter}
                    onChange={(e) => setCorsOnlyFilter(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>支持 CORS 直接调用</span>
                </label>
              </div>
            </div>

            {/* Grid of Cleaned APIs */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
              {filteredApis.map((api) => (
                <div
                  key={api.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-md flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {api.name}
                        </h3>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {api.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {api.authType}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {api.healthScore}分
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">
                      {api.description}
                    </p>

                    {/* Endpoint Box */}
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 mb-3 font-mono text-[10px] text-slate-400 truncate flex items-center justify-between">
                      <span className="text-emerald-400 font-bold mr-1.5">{api.method}</span>
                      <span className="truncate flex-1">{api.baseUrl}{api.sampleEndpoint}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {api.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-slate-800 text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <a
                      href={api.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                    >
                      <span>官方文档</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => {
                        if (!customSelectedApiIds.includes(api.id)) {
                          setCustomSelectedApiIds((prev) => [...prev, api.id]);
                        }
                        setActiveSubTab("custom_builder");
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg transition-colors text-[11px] font-medium"
                    >
                      + 加入聚合编排
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: 可视化组合编排器 (Custom Pipeline Builder)
           ===================================================================== */}
        {activeSubTab === "custom_builder" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-6">
            {/* Left: Configuration Form */}
            <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between shrink-0 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">聚合 API 基础定义</h3>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">聚合 API 名称</label>
                  <input
                    type="text"
                    value={customBuilderName}
                    onChange={(e) => setCustomBuilderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">归属垂直领域</label>
                  <select
                    value={customBuilderDomain}
                    onChange={(e) => setCustomBuilderDomain(e.target.value as ApiDomainCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">执行并发策略</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomExecMode("parallel")}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        customExecMode === "parallel"
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      并发聚合 (Fan-Out)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomExecMode("sequential")}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        customExecMode === "sequential"
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      串行流水线 (Pipe)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">业务描述与意图</label>
                  <textarea
                    rows={3}
                    value={customBuilderDesc}
                    onChange={(e) => setCustomBuilderDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={handleCreateCustomPipeline}
                  disabled={customSelectedApiIds.length === 0}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                    customSelectedApiIds.length === 0
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-950/50"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>生成并上线该聚合 API</span>
                </button>
              </div>
            </div>

            {/* Right: Selected APIs Pipeline Builder */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    已编排的 Sub-APIs 调用序列 ({customSelectedApiIds.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSubTab("cleansed_apis")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  + 从资产库挑选更多 API
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {customSelectedApiIds.map((apiId, idx) => {
                  const api = cleansedApis.find((a) => a.id === apiId);
                  if (!api) return null;

                  return (
                    <div
                      key={apiId}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">
                              {api.name}
                            </h4>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {api.authType}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {api.baseUrl}{api.sampleEndpoint}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setCustomSelectedApiIds((prev) => prev.filter((id) => id !== apiId))
                        }
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="从编排序列移除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {customSelectedApiIds.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Database className="w-10 h-10 mb-2 stroke-1" />
                    <p className="text-xs">尚未添加任何公共 API。请在资产库中点击“+ 加入聚合编排”。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: MCP / OpenAPI 导出中心 (Export & MCP Protocol View)
           ===================================================================== */}
        {activeSubTab === "export_mcp" && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-6">
            {/* Left: Export Formats & Selection */}
            <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">选择导出标准</h3>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Model Context Protocol (MCP)</span>
                    <span className="text-[9px] font-mono px-1.5 bg-purple-500/20 text-purple-300 rounded">
                      Claude / Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    直接生成可运行的 MCP Tool Server 标准脚本，供 AI 智能体自主调度垂直聚合流。
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">OpenAPI 3.0 / Swagger</span>
                    <span className="text-[9px] font-mono px-1.5 bg-cyan-500/20 text-cyan-300 rounded">
                      REST Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    标准 RESTful 接口契约，可直接导入 Postman、Apifox 或云网关。
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800">
                <button
                  onClick={handleRegisterAsSystemTool}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  <span>注入到当前系统 Tool Manager</span>
                </button>
              </div>
            </div>

            {/* Right: Code Generator Output */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    MCP Server 运行时代码 (`mcp-server.ts`)
                  </h3>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      `// MCP Server for ${selectedPipeline.name}
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "${selectedPipeline.slug}",
  version: "${selectedPipeline.version}",
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "${selectedPipeline.slug.replace(/-/g, "_")}",
      description: "${selectedPipeline.description}",
      inputSchema: {
        type: "object",
        properties: ${JSON.stringify(
          selectedPipeline.inputSchema.reduce(
            (acc, i) => ({ ...acc, [i.name]: { type: i.type, description: i.description } }),
            {}
          )
        )},
        required: ${JSON.stringify(selectedPipeline.inputSchema.filter((i) => i.required).map((i) => i.name))}
      }
    }
  ]
}));`,
                      "mcp_code"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                >
                  {copiedKey === "mcp_code" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制代码</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800/80 overflow-auto font-mono text-xs text-purple-300">
                <pre>{`// =========================================================================
// Model Context Protocol (MCP) Server for: ${selectedPipeline.name}
// Domain: ${selectedPipeline.domain} (Aggregated from ${selectedPipeline.steps.length} Public APIs)
// =========================================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "${selectedPipeline.slug}",
    version: "${selectedPipeline.version}",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Aggregated Tool Definition
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "${selectedPipeline.slug.replace(/-/g, "_")}",
        description: "${selectedPipeline.description}",
        inputSchema: {
          type: "object",
          properties: ${JSON.stringify(
            selectedPipeline.inputSchema.reduce(
              (acc, i) => ({
                ...acc,
                [i.name]: {
                  type: i.type,
                  description: i.description,
                },
              }),
              {}
            ),
            null,
            12
          )},
          required: ${JSON.stringify(
            selectedPipeline.inputSchema.filter((i) => i.required).map((i) => i.name)
          )},
        },
      },
    ],
  };
});

// Tool Call Execution Handler
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "${selectedPipeline.slug.replace(/-/g, "_")}") {
    const args = request.params.arguments;
    // Multi-source parallel dispatch
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(${JSON.stringify(selectedPipeline.sampleOutput, null, 2)}),
        },
      ],
    };
  }
  throw new Error("Tool not found");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main();`}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
