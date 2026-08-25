import React, { useState } from "react";
import {
  Cpu,
  Plus,
  Search,
  Radio,
  ExternalLink,
  Shield,
  Key,
  Database,
  CheckCircle2,
  Lock,
  Code2,
  Sparkles,
  Terminal,
  Play,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  Zap,
} from "lucide-react";
import { AgentSkill } from "../types/database.ts";

export const McpSkillsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"skills" | "testbench">("skills");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testCase, setTestCase] = useState<string>("case_mcp_call");
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  const [skills, setSkills] = useState<AgentSkill[]>([
    {
      id: "skill_mcp_postgres",
      workspace_id: "ws-default",
      name: "PostgreSQL MCP 数据库查询引擎",
      identifier: "mcp_postgres_runner",
      description: "连接远程 PostgreSQL 数据源，执行只读安全查询与元数据检索",
      category: "Database",
      execution_type: "mcp",
      parameters_schema: {
        sql_query: { type: "string", description: "只读 SQL 语句" },
        limit: { type: "number", description: "最大返回行数" },
      },
      returns_schema: {
        rows: { type: "array", description: "查询结果行" },
        row_count: { type: "number" },
      },
      code_snippet: null,
      mcp_server_url: "http://localhost:3000/api/mock-mcp-server",
      mcp_tool_name: "execute_readonly_sql",
      auth_type: "bearer",
      auth_config: {
        header_key: "Authorization",
        header_prefix: "Bearer",
        api_key_ref: "ENV_MCP_PG_TOKEN",
      },
      embedding: [0.012, -0.045, 0.089, 0.124, -0.002, 0.071], // 1536 维向量检索片段
      is_system: false,
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "skill_mcp_github",
      workspace_id: "ws-default",
      name: "GitHub PR 与代码仓库审查",
      identifier: "mcp_github_reviewer",
      description: "检索 GitHub 仓库 Pull Request、拉取代码 Diff 并自动化提交审查评语",
      category: "DevOps",
      execution_type: "mcp",
      parameters_schema: {
        repo: { type: "string", description: "仓库名 (owner/repo)" },
        pull_number: { type: "number", description: "PR 编号" },
      },
      returns_schema: {
        diff: { type: "string" },
        status: { type: "string" },
      },
      code_snippet: null,
      mcp_server_url: "http://localhost:3000/api/mock-mcp-server",
      mcp_tool_name: "inspect_pull_request",
      auth_type: "bearer",
      auth_config: {
        api_key_ref: "GITHUB_MCP_ACCESS_TOKEN",
      },
      embedding: [0.082, 0.015, -0.049, 0.201, 0.034, -0.012],
      is_system: false,
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "skill_mutate_records",
      workspace_id: "ws-default",
      name: "原子动态记录写回 (RPC)",
      identifier: "mutate_records",
      description: "原子合并更新 JSONB 记录 (patch_dynamic_record) 并检查版本冲突",
      category: "Database",
      execution_type: "javascript",
      parameters_schema: {
        updates: { type: "array", description: "包含 id, patch, expected_version" },
      },
      returns_schema: {
        updatedCount: { type: "number" },
      },
      code_snippet: "await supabase.rpc('patch_dynamic_record', ...)",
      mcp_server_url: null,
      mcp_tool_name: null,
      auth_type: "none",
      auth_config: null,
      embedding: [0.033, 0.042, -0.011, 0.125, -0.008, 0.094],
      is_system: true,
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "skill_calculator",
      workspace_id: "ws-default",
      name: "财务复合利率与汇率折算",
      identifier: "calc_financial_rate",
      description: "执行高精度复合利率、折现率与实时多币种汇率换算",
      category: "Finance",
      execution_type: "javascript",
      parameters_schema: {
        principal: { type: "number" },
        annual_rate: { type: "number" },
        years: { type: "number" },
      },
      returns_schema: {
        compound_total: { type: "number" },
      },
      code_snippet: "return principal * Math.pow((1 + annual_rate), years);",
      mcp_server_url: null,
      mcp_tool_name: null,
      auth_type: "none",
      auth_config: null,
      embedding: [0.003, 0.092, -0.011, 0.045, -0.078, 0.014],
      is_system: true,
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(skills[0]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Test Case Definitions
  const testCases = [
    {
      id: "case_mcp_list",
      name: "1. MCP 协议: 发现 tools/list",
      description: "向 MCP Mock Server 发送标准 JSON-RPC 2.0 请求，拉取可用工具清单与 Schema",
      endpoint: "/api/mock-mcp-server",
      method: "POST",
      curl: `curl -X POST http://localhost:3000/api/mock-mcp-server \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": "req-001",
    "method": "tools/list",
    "params": {}
  }'`,
      body: {
        jsonrpc: "2.0",
        id: "req-001",
        method: "tools/list",
        params: {},
      },
    },
    {
      id: "case_mcp_call",
      name: "2. MCP 协议: 调用 tools/call (只读 SQL)",
      description: "向 MCP Mock Server 发送 tools/call 请求执行 execute_readonly_sql",
      endpoint: "/api/mock-mcp-server",
      method: "POST",
      curl: `curl -X POST http://localhost:3000/api/mock-mcp-server \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mock_mcp_token_enterprise" \\
  -d '{
    "jsonrpc": "2.0",
    "id": "req-002",
    "method": "tools/call",
    "params": {
      "name": "execute_readonly_sql",
      "arguments": {
        "sql_query": "SELECT id, name, deal_amount FROM leads WHERE deal_amount > 50000 LIMIT 3",
        "limit": 3
      }
    }
  }'`,
      body: {
        jsonrpc: "2.0",
        id: "req-002",
        method: "tools/call",
        params: {
          name: "execute_readonly_sql",
          arguments: {
            sql_query: "SELECT id, name, deal_amount FROM leads WHERE deal_amount > 50000 LIMIT 3",
            limit: 3,
          },
        },
      },
    },
    {
      id: "case_runtime_auto",
      name: "3. 统一运行时: 常规任务调度与原子 RPC",
      description: "模拟 Edge Function 调度 Agent 执行 mutate_records 技能原子变更 JSONB 业务表",
      endpoint: "/api/run-agent-task",
      method: "POST",
      curl: `curl -X POST http://localhost:3000/api/run-agent-task \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_id": "task_demo_auto_001",
    "payload_override": {
      "module_id": "mod_leads",
      "instruction": "对入库的重点客户进行评分并更新标签",
      "trigger_skill": "mutate_records",
      "require_approval": false,
      "tool_args": {
        "updates": [
          {
            "id": "rec_lead_99",
            "patch": { "score": 98, "assigned_sales": "Sarah Lee", "status": "Qualified" },
            "expected_version": 1
          }
        ]
      }
    }
  }'`,
      body: {
        task_id: "task_demo_auto_001",
        payload_override: {
          module_id: "mod_leads",
          instruction: "对入库的重点客户进行评分并更新标签",
          trigger_skill: "mutate_records",
          require_approval: false,
          tool_args: {
            updates: [
              {
                id: "rec_lead_99",
                patch: { score: 98, assigned_sales: "Sarah Lee", status: "Qualified" },
                expected_version: 1,
              },
            ],
          },
        },
      },
    },
    {
      id: "case_runtime_hitl_pending",
      name: "4. Human-in-the-loop: 审批拦截挂起 (Pending)",
      description: "当 require_approval=true 时，Edge Function 自动拦截并将待执行技能暂存为 pending_execution",
      endpoint: "/api/run-agent-task",
      method: "POST",
      curl: `curl -X POST http://localhost:3000/api/run-agent-task \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_id": "task_hitl_pending_002",
    "payload_override": {
      "module_id": "mod_deals",
      "instruction": "执行涉及 200,000 美元的合同签署与状态覆写",
      "trigger_skill": "mutate_records",
      "require_approval": true,
      "tool_args": {
        "updates": [
          {
            "id": "rec_deal_702",
            "patch": { "contract_status": "Signed", "approved_budget": 200000 },
            "expected_version": 2
          }
        ]
      }
    }
  }'`,
      body: {
        task_id: "task_hitl_pending_002",
        payload_override: {
          module_id: "mod_deals",
          instruction: "执行涉及 200,000 美元的合同签署与状态覆写",
          trigger_skill: "mutate_records",
          require_approval: true,
          tool_args: {
            updates: [
              {
                id: "rec_deal_702",
                patch: { contract_status: "Signed", "approved_budget": 200000 },
                expected_version: 2,
              },
            ],
          },
        },
      },
    },
    {
      id: "case_runtime_hitl_approved",
      name: "5. Human-in-the-loop: 人工核准放行 (Approved)",
      description: "人工在工作流中确认通过 (approved=true)，直接提取 pending_execution 恢复原子执行",
      endpoint: "/api/run-agent-task",
      method: "POST",
      curl: `curl -X POST http://localhost:3000/api/run-agent-task \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_id": "task_hitl_pending_002",
    "approved": true,
    "payload_override": {
      "module_id": "mod_deals",
      "instruction": "执行涉及 200,000 美元的合同签署与状态覆写",
      "pending_execution": {
        "skill": "mutate_records",
        "args": {
          "updates": [
            {
              "id": "rec_deal_702",
              "patch": { "contract_status": "Signed", "approved_budget": 200000 },
              "expected_version": 2
            }
          ]
        }
      }
    }
  }'`,
      body: {
        task_id: "task_hitl_pending_002",
        approved: true,
        payload_override: {
          module_id: "mod_deals",
          instruction: "执行涉及 200,000 美元的合同签署与状态覆写",
          pending_execution: {
            skill: "mutate_records",
            args: {
              updates: [
                {
                  id: "rec_deal_702",
                  patch: { contract_status: "Signed", approved_budget: 200000 },
                  expected_version: 2,
                },
              ],
            },
          },
        },
      },
    },
  ];

  const currentCase = testCases.find((c) => c.id === testCase) || testCases[0];

  const runSelectedTest = async () => {
    setTestLoading(true);
    setTestResponse(null);
    try {
      const res = await fetch(currentCase.endpoint, {
        method: currentCase.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock_token_key",
        },
        body: JSON.stringify(currentCase.body),
      });
      const data = await res.json();
      setTestResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err: any) {
      setTestResponse({
        status: 500,
        error: err.message,
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Switcher Bar */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/70 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-xs text-white">MCP 技能中心与统一运行时</span>
          </div>

          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("skills")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "skills"
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              技能注册表
            </button>
            <button
              onClick={() => setActiveTab("testbench")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === "testbench"
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>本地测试台 & cURL 套件</span>
            </button>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          JSON-RPC 2.0 / Vector Router / HITL Engine
        </span>
      </div>

      {activeTab === "skills" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar List */}
          <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">已注册技能 ({skills.length})</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {skills.map((s) => {
                const isSelected = selectedSkill?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSkill(s)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-950/40"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-white truncate">{s.name}</span>
                      {s.execution_type === "mcp" ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                          MCP
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                          JS/RPC
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{s.description}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
                      <span>{s.identifier}</span>
                      <span>{s.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Details Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedSkill ? (
              <>
                {/* Header */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                          {selectedSkill.identifier}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Category: {selectedSkill.category}
                        </span>
                      </div>
                      <h1 className="text-base font-bold text-white">{selectedSkill.name}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已启用
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">{selectedSkill.description}</p>
                </div>

                {/* MCP Server & Connection Params */}
                {selectedSkill.execution_type === "mcp" && (
                  <div className="p-5 bg-purple-950/20 border border-purple-800/40 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                        Model Context Protocol (MCP) 连接配置
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">MCP Server URL</span>
                        <div className="text-xs font-mono text-purple-300 truncate">
                          {selectedSkill.mcp_server_url || "—"}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">MCP Tool Name</span>
                        <div className="text-xs font-mono text-purple-300">
                          {selectedSkill.mcp_tool_name || "—"}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">鉴权模式 (auth_type)</span>
                        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />
                          <span>{selectedSkill.auth_type.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-slate-400">凭证引用 (api_key_ref)</span>
                        <div className="text-xs font-mono text-slate-300">
                          {selectedSkill.auth_config?.api_key_ref || "无密钥"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedding Vector Retrieval */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        语义检索向量 (Vector Embedding)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Cosine Similarity 自动路由
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300/90 break-all leading-relaxed">
                    [{selectedSkill.embedding?.map((n) => n.toFixed(4)).join(", ")}, ...]
                  </div>
                </div>

                {/* Parameters Schema */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      入参与出参 JSON Schema 校验
                    </h3>
                  </div>
                  <pre className="p-3 bg-slate-950 text-indigo-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800">
                    {JSON.stringify(
                      {
                        parameters: selectedSkill.parameters_schema,
                        returns: selectedSkill.returns_schema,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                请在左侧选择一个技能查看 MCP 详情
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Testbench & cURL Guide View */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Cases Selector */}
          <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
            <div className="p-3.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">测试场景用例集</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {testCases.map((c) => {
                const isSelected = testCase === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setTestCase(c.id);
                      setTestResponse(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-950/30"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-1">{c.name}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-purple-300">
                      {c.endpoint}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Console & Visualizer */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Header / Actions */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">{currentCase.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{currentCase.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(currentCase.curl, "curl")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
                  >
                    {copiedKey === "curl" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">已复制 cURL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制 cURL 命令</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={runSelectedTest}
                    disabled={testLoading}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md shadow-purple-950/40 transition-colors disabled:opacity-50"
                  >
                    {testLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>执行测试中...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>在本地立即运行</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* cURL Command Box */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  标准 cURL 调用代码示例
                </span>
                <span className="text-[10px] font-mono text-slate-500">Bash / Shell</span>
              </div>
              <pre className="p-3.5 bg-slate-950 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
                {currentCase.curl}
              </pre>
            </div>

            {/* Request Payload */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  请求载荷 (Request JSON-RPC Body)
                </span>
              </div>
              <pre className="p-3.5 bg-slate-950 text-cyan-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800">
                {JSON.stringify(currentCase.body, null, 2)}
              </pre>
            </div>

            {/* Real-time Test Output */}
            {testResponse && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    服务端执行响应 (HTTP {testResponse.status})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                    200 OK
                  </span>
                </div>

                <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 max-h-72">
                  {JSON.stringify(testResponse.data, null, 2)}
                </pre>

                {/* Traces inspection if returned */}
                {testResponse.data?.traces && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      实时捕获的执行日志 (Traces)
                    </span>
                    <div className="space-y-1 font-mono text-[11px]">
                      {testResponse.data.traces.map((tr: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-start gap-2"
                        >
                          <span className="text-slate-500 shrink-0">
                            {new Date(tr.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                              tr.level === "warn"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : tr.level === "error"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : "bg-purple-950 text-purple-300 border border-purple-800"
                            }`}
                          >
                            {tr.level.toUpperCase()}
                          </span>
                          <span className="text-slate-300 break-all">{tr.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

