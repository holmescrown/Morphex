import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy/Safe initialization for Gemini AI SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "No-Code Agent Platform API Engine",
  });
});

// 1. LLM Node Execution Endpoint
app.post("/api/run-llm", async (req, res) => {
  try {
    const {
      model = "gemini-3.7-flash",
      temperature = 0.2,
      maxTokens = 2048,
      topP = 0.95,
      systemPrompt = "",
      userPrompt = "",
      responseFormat = "text",
    } = req.body;

    if (!userPrompt && !systemPrompt) {
      return res.status(400).json({ error: "Prompt cannot be empty" });
    }

    const ai = getGeminiClient();

    const config: Record<string, unknown> = {
      temperature: Number(temperature) || 0.2,
      topP: Number(topP) || 0.95,
    };

    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }

    if (responseFormat === "json") {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3.7-flash",
      contents: userPrompt || "Execute task according to system instruction",
      config: config as any,
    });

    const textOutput = response.text || "";
    const promptLen = (systemPrompt.length + userPrompt.length);
    const estimatedPromptTokens = Math.max(10, Math.round(promptLen / 3.8));
    const estimatedCompTokens = Math.max(10, Math.round(textOutput.length / 3.8));

    res.json({
      text: textOutput,
      usage: {
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompTokens,
        totalTokens: estimatedPromptTokens + estimatedCompTokens,
      },
    });
  } catch (error: unknown) {
    console.error("Gemini LLM error:", error);
    const message = error instanceof Error ? error.message : "LLM generation failed";
    res.status(500).json({ error: message });
  }
});

// 2. Interactive Agent Chat Endpoint
app.post("/api/run-agent", async (req, res) => {
  try {
    const {
      agentName,
      systemPrompt = "You are a helpful AI assistant.",
      model = "gemini-3.7-flash",
      temperature = 0.2,
      history = [],
      message = "",
      knowledgeContext = "",
    } = req.body;

    const ai = getGeminiClient();

    let fullSystemInstruction = systemPrompt;
    if (knowledgeContext) {
      fullSystemInstruction += `\n\n【参考知识库资料 (Grounding Context)】:\n${knowledgeContext}`;
    }

    // Build chat contents or prompt
    const chat = ai.chats.create({
      model: model || "gemini-3.7-flash",
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: Number(temperature) || 0.2,
      },
    });

    // Send the message
    const response = await chat.sendMessage({
      message: message || "Hello",
    });

    res.json({
      reply: response.text || "",
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    console.error("Agent chat error:", error);
    const message = error instanceof Error ? error.message : "Agent chat execution failed";
    res.status(500).json({ error: message });
  }
});

// 3. HTTP Proxy Endpoint for HttpRequestNode
app.post("/api/proxy-http", async (req, res) => {
  try {
    const { url, method = "GET", headers = {}, params = {}, body, timeoutMs = 10000 } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const targetUrl = new URL(url);
    for (const [k, v] of Object.entries(params || {})) {
      targetUrl.searchParams.append(k, String(v));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(timeoutMs) || 10000);

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        "User-Agent": "NoCodeAgentPlatform/1.0",
        ...(headers as Record<string, string>),
      },
      signal: controller.signal,
    };

    if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && body) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
      if (!(fetchOptions.headers as Record<string, string>)["Content-Type"]) {
        (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
      }
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    let data: unknown;
    if (contentType.includes("application/json")) {
      data = await response.json().catch(() => ({}));
    } else {
      data = await response.text();
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    res.json({
      status: response.status,
      statusText: response.statusText,
      data,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "HTTP proxy request failed";
    res.status(500).json({
      status: 500,
      statusText: "Internal Gateway Error",
      error: message,
    });
  }
});

// 4. Dynamic Tool Runner Endpoint
app.post("/api/run-tool", async (req, res) => {
  try {
    const { toolId, toolName, arguments: args } = req.body;

    // Currency converter implementation
    if (toolId === "currency_converter" || toolName?.includes("汇率")) {
      const amount = Number(args?.amount) || 100;
      const from = String(args?.from || "USD").toUpperCase();
      const to = String(args?.to || "CNY").toUpperCase();

      const rates: Record<string, number> = {
        USD: 1.0,
        CNY: 7.23,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 154.5,
      };

      const fromRate = rates[from] || 1.0;
      const toRate = rates[to] || 7.23;
      const converted = (amount / fromRate) * toRate;

      return res.json({
        output: {
          original: `${amount} ${from}`,
          convertedAmount: Number(converted.toFixed(2)),
          targetCurrency: to,
          exchangeRate: Number((toRate / fromRate).toFixed(4)),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Default echo tool response
    res.json({
      output: {
        tool: toolName || toolId,
        argsProcessed: args,
        status: "success",
        timestamp: Date.now(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Tool run failed";
    res.status(500).json({ error: message });
  }
});

// 5. AI Prompt-to-Tool Generator Endpoint (Gemini 3.7 Flash)
app.post("/api/generate-tool", async (req, res) => {
  try {
    const { prompt, category = "Custom Utilities", toolType = "function" } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGeminiClient();

    const systemPrompt = `你是一个顶级 No-Code Agent 平台的原子工具架构师。
用户会用自然语言描述一个工具需求。你需要将该需求转化为一个严格合规的 JSON 工具定义。
输出必须是纯 JSON 格式（无需 markdown 代码块包裹），严格匹配如下结构：
{
  "id": "简短英文蛇形或小驼峰ID，如 calc_tax_rate",
  "name": "中文工具名称，如 个人所得税与五险一金精算器",
  "description": "精确阐述此工具的功能、应用场景及边界",
  "category": "分类，如 财务金融 / 数据清洗 / DevOps / 智能分析 / 通信推送",
  "type": "function", // 或 "api"
  "parameters": {
    "参数名1": {
      "type": "string" | "number" | "boolean" | "object" | "array",
      "description": "参数功能说明",
      "required": true | false,
      "default": 默认值（可选）
    }
  },
  "codeBody": "一段纯 JavaScript 异步/同步函数代码体（可直接使用 args 对象，需 return 一个包含执行结果的纯 Object）",
  "returnsDescription": "返回值格式说明",
  "exampleInput": { "参数名1": "示例值" }
}

代码体示例要求：
对于 function 类型，可以直接访问 args.xxx，如：
"const { salary = 10000, threshold = 5000 } = args; const taxable = Math.max(0, salary - threshold); const tax = taxable * 0.03; return { grossSalary: salary, taxableIncome: taxable, taxAmount: tax, netSalary: salary - tax };"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `请为以下需求生成完整的工具 JSON Schema 与执行代码：\n需求：${prompt}\n指定类别：${category}\n指定工具类型：${toolType}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text || "{}";
    let parsedTool: Record<string, unknown>;
    try {
      parsedTool = JSON.parse(rawText);
    } catch {
      // Clean up markdown block if present
      const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedTool = JSON.parse(cleanJson);
    }

    res.json({
      success: true,
      tool: parsedTool,
    });
  } catch (error: unknown) {
    console.error("Generate tool error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate tool from prompt";
    res.status(500).json({ error: message });
  }
});

// ----------------------------------------------------
// 6. Mock MCP JSON-RPC 2.0 Server Endpoint (tools/call & tools/list)
// ----------------------------------------------------
app.post("/api/mock-mcp-server", (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  // Validate JSON-RPC 2.0 format
  if (jsonrpc !== "2.0") {
    return res.status(400).json({
      jsonrpc: "2.0",
      id: id || null,
      error: { code: -32600, message: "Invalid Request: jsonrpc must be '2.0'" },
    });
  }

  // Handle tools/list
  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "execute_readonly_sql",
            description: "执行远程 PostgreSQL 只读安全查询",
            inputSchema: {
              type: "object",
              properties: {
                sql_query: { type: "string", description: "只读 SQL 语句" },
                limit: { type: "number", description: "最大返回行数" },
              },
              required: ["sql_query"],
            },
          },
          {
            name: "inspect_pull_request",
            description: "检索 GitHub 仓库 Pull Request 并分析代码 Diff",
            inputSchema: {
              type: "object",
              properties: {
                repo: { type: "string" },
                pull_number: { type: "number" },
              },
              required: ["repo", "pull_number"],
            },
          },
          {
            name: "fetch_customer_crm_profile",
            description: "根据客户 ID 实时拉取企业 CRM 详情与征信评级",
            inputSchema: {
              type: "object",
              properties: {
                customer_id: { type: "string" },
              },
              required: ["customer_id"],
            },
          },
        ],
      },
    });
  }

  // Handle tools/call
  if (method === "tools/call") {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    if (!toolName) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: "Missing tool name in params" },
      });
    }

    switch (toolName) {
      case "execute_readonly_sql": {
        const sql = toolArgs.sql_query || "SELECT * FROM mock_table";
        const limit = toolArgs.limit || 5;
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "success",
                  executed_sql: sql,
                  row_count: 3,
                  rows: [
                    { id: "rec_101", name: "Acme Corp", stage: "Closed Won", deal_amount: 180000 },
                    { id: "rec_102", name: "Globex Ltd", stage: "Negotiation", deal_amount: 95000 },
                    { id: "rec_103", name: "Soylent Tech", stage: "Qualified", deal_amount: 42000 },
                  ].slice(0, limit),
                }),
              },
            ],
            isError: false,
          },
        });
      }

      case "inspect_pull_request": {
        const { repo = "corp/agent-core", pull_number = 42 } = toolArgs;
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  repo,
                  pull_number,
                  title: "feat(auth): add fine-grained RBAC and audit logging",
                  author: "dev-lead",
                  changed_files_count: 5,
                  additions: 142,
                  deletions: 18,
                  diff_summary: "Added permission checks to /api/run-agent-task and patch_dynamic_record RPC",
                }),
              },
            ],
            isError: false,
          },
        });
      }

      case "fetch_customer_crm_profile": {
        const customerId = toolArgs.customer_id || "cust_default";
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  customer_id: customerId,
                  tier: "Diamond Enterprise",
                  credit_score: 840,
                  total_spend_ytd: 340000,
                  assigned_manager: "Sarah Jenkins",
                  status: "active",
                }),
              },
            ],
            isError: false,
          },
        });
      }

      default:
        // Echo / Generic Mock Response
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  message: `MCP Tool [${toolName}] executed successfully in sandbox`,
                  received_arguments: toolArgs,
                  timestamp: new Date().toISOString(),
                }),
              },
            ],
            isError: false,
          },
        });
    }
  }

  // Method not found
  return res.status(404).json({
    jsonrpc: "2.0",
    id: id || null,
    error: { code: -32601, message: `Method '${method}' not found` },
  });
});

// ----------------------------------------------------
// 7. Local Simulation of Supabase Edge Function: /api/run-agent-task
// ----------------------------------------------------
app.post("/api/run-agent-task", async (req, res) => {
  const { task_id, approved, payload_override } = req.body;
  const traceLogs: Array<{ level: string; message: string; timestamp: string; extra?: any }> = [];

  const addTrace = (level: string, message: string, extra?: any) => {
    traceLogs.push({
      level,
      message,
      timestamp: new Date().toISOString(),
      extra,
    });
  };

  try {
    const currentTaskId = task_id || `sim_task_${Date.now().toString(36)}`;
    const taskPayload = payload_override || {
      module_id: "mod_leads",
      instruction: "对潜在客户商机进行评分并自动归类，若金额超过10万需触发人工审批",
      require_approval: false,
      sql_filter: "data->>'deal_amount' > 50000",
    };

    addTrace("info", `[Task Initialized] 正在拾取任务 ${currentTaskId}...`);

    // Case 1: Human-in-the-loop Approved Resume Execution
    if (approved && taskPayload.pending_execution) {
      const { skill: skillSlug, args } = taskPayload.pending_execution;
      addTrace("info", `[人工审批通过] 开始执行暂存操作: ${skillSlug}`, {
        tool_call_raw: { skill: skillSlug, arguments: args },
      });

      // Execute atomic mock handler
      const executionResult = {
        updatedCount: 1,
        mutated_record_id: args?.updates?.[0]?.id || "rec_101",
        applied_patch: args?.updates?.[0]?.patch || { status: "Approved" },
        executed_at: new Date().toISOString(),
      };

      addTrace("info", "审批后执行成功，原子数据状态已落盘写回", { raw_payload: executionResult });

      return res.json({
        success: true,
        task_id: currentTaskId,
        status: "completed",
        approved_execution: true,
        result: {
          text: "人工审批后执行完成",
          executions: [{ skill: skillSlug, result: executionResult }],
        },
        traces: traceLogs,
      });
    }

    // Case 2: Skill loading & vector search simulation
    const loadedSkills = [
      { slug: "mcp_postgres_runner", handler_type: "mcp_server", name: "PostgreSQL MCP 查询引擎" },
      { slug: "mutate_records", handler_type: "internal_rpc", name: "原子记录变更 (RPC)" },
      { slug: "calc_metrics", handler_type: "internal_rpc", name: "指标聚合统计" },
      { slug: "send_notification", handler_type: "internal_rpc", name: "多渠道通知告警" },
    ];

    addTrace("info", `已挂载 ${loadedSkills.length} 个技能: ${loadedSkills.map((s) => s.slug).join(", ")}`, {
      raw_payload: { loaded_skills: loadedSkills.map((s) => s.slug) },
    });

    // Mock records loaded
    const sampleRecords = [
      { id: "rec_101", data: { customer_name: "Acme Corp", deal_amount: 150000, stage: "Prospect" } },
      { id: "rec_102", data: { customer_name: "Stark Tech", deal_amount: 80000, stage: "Qualified" } },
    ];
    addTrace("info", `已加载 ${sampleRecords.length} 条业务记录，准备注入大模型上下文`);

    // Simulated LLM reasoning & token usage
    const tokenUsage = { prompt: 420, completion: 110, total: 530 };
    addTrace("info", `LLM Token 消耗: prompt=${tokenUsage.prompt}, completion=${tokenUsage.completion}, total=${tokenUsage.total}`, {
      token_usage: tokenUsage,
    });

    // Determine target skill
    const triggeredSkillSlug = taskPayload.trigger_skill || "mutate_records";
    const toolArgs = taskPayload.tool_args || {
      updates: [
        {
          id: "rec_101",
          patch: { score: 96, category: "Tier-1 Enterprise", verified: true },
          expected_version: 1,
        },
      ],
    };

    addTrace("info", `[触发技能: ${triggeredSkillSlug}] 参数: ${JSON.stringify(toolArgs)}`, {
      tool_call_raw: { skill: triggeredSkillSlug, arguments: toolArgs },
    });

    // Case 3: HITL approval intercept
    if (taskPayload.require_approval) {
      addTrace("warn", "检测到审批拦截标志 (require_approval=true)，任务暂停等待人工确认");
      return res.json({
        success: true,
        task_id: currentTaskId,
        status: "pending",
        requires_approval: true,
        skill: triggeredSkillSlug,
        args: toolArgs,
        pending_execution: { skill: triggeredSkillSlug, args: toolArgs },
        message: "任务已暂停，等待有权限的人员在工作流中进行审批",
        traces: traceLogs,
      });
    }

    // Case 4: Standard Direct Execution
    let skillOutput: any = null;
    if (triggeredSkillSlug === "mcp_postgres_runner") {
      skillOutput = {
        executed_mcp_url: "http://localhost:3000/api/mock-mcp-server",
        result: { row_count: 2, rows: sampleRecords },
      };
    } else if (triggeredSkillSlug === "mutate_records") {
      skillOutput = {
        updatedCount: toolArgs.updates?.length || 1,
        createdCount: 0,
        atomic_rpc: "patch_dynamic_record",
      };
    } else if (triggeredSkillSlug === "calc_metrics") {
      skillOutput = {
        field: "deal_amount",
        type: "sum",
        value: 230000,
        totalRecords: 2,
      };
    } else {
      skillOutput = { sent: true, timestamp: new Date().toISOString() };
    }

    addTrace("info", `[技能执行完成] ${triggeredSkillSlug} 结果: ${JSON.stringify(skillOutput)}`, {
      raw_payload: skillOutput,
    });
    addTrace("info", "全流程任务执行成功");

    return res.json({
      success: true,
      task_id: currentTaskId,
      status: "completed",
      executions: [{ skill: triggeredSkillSlug, result: skillOutput }],
      traces: traceLogs,
    });
  } catch (error: any) {
    addTrace("error", `执行异常: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message,
      traces: traceLogs,
    });
  }
});

// ----------------------------------------------------
// Vite & Static Asset Setup
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`No-Code Agent Platform Server running on port ${PORT}`);
  });
}

startServer();
