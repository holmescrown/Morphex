// scripts/mock_mcp_server.ts
// 标准 MCP (Model Context Protocol) JSON-RPC 2.0 独立 Mock 服务
// 支持 tools/list 与 tools/call

import http from "http";

const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 8080;

interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

const registeredTools = [
  {
    name: "execute_readonly_sql",
    description: "执行 PostgreSQL 远程只读查询，返回结构化行数据",
    parameters_schema: {
      type: "object",
      properties: {
        sql_query: { type: "string", description: "只读 SQL 语句" },
        limit: { type: "number", description: "最大行数限制" },
      },
      required: ["sql_query"],
    },
  },
  {
    name: "inspect_pull_request",
    description: "检索 GitHub 仓库指定 PR 的 Diff 和变更元数据",
    parameters_schema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "仓库所有者与名称 (owner/repo)" },
        pull_number: { type: "number", description: "PR 编号" },
      },
      required: ["repo", "pull_number"],
    },
  },
  {
    name: "fetch_customer_crm_profile",
    description: "从 CRM 系统按客户 ID 检索企业档案与信用评分",
    parameters_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string", description: "客户主键 ID" },
      },
      required: ["customer_id"],
    },
  },
];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Only POST JSON-RPC requests are supported" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      const jsonRpcReq: JsonRpcRequest = JSON.parse(body);

      // Validate JSON-RPC 2.0
      if (jsonRpcReq.jsonrpc !== "2.0") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: jsonRpcReq.id || null,
            error: { code: -32600, message: "Invalid Request: jsonrpc must be '2.0'" },
          })
        );
        return;
      }

      const authHeader = req.headers["authorization"];
      console.log(`[MCP Server] 收到调用: method=${jsonRpcReq.method}, auth=${authHeader ? "Present" : "None"}`);

      // Handle tools/list
      if (jsonRpcReq.method === "tools/list") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: jsonRpcReq.id,
            result: {
              tools: registeredTools.map((t) => ({
                name: t.name,
                description: t.description,
                inputSchema: t.parameters_schema,
              })),
            },
          })
        );
        return;
      }

      // Handle tools/call
      if (jsonRpcReq.method === "tools/call") {
        const toolName = jsonRpcReq.params?.name;
        const toolArgs = jsonRpcReq.params?.arguments || {};

        let toolOutput: any = null;

        if (toolName === "execute_readonly_sql") {
          toolOutput = {
            status: "success",
            sql: toolArgs.sql_query,
            row_count: 2,
            rows: [
              { id: "lead_01", company: "Meta", annual_revenue: 120000000, status: "Active" },
              { id: "lead_02", company: "Google", annual_revenue: 280000000, status: "Active" },
            ],
          };
        } else if (toolName === "inspect_pull_request") {
          toolOutput = {
            repo: toolArgs.repo,
            pull_number: toolArgs.pull_number,
            title: "feat(mcp): support dynamic tool invocation & vector search",
            status: "ready_for_review",
            diff_lines: "+450 -32",
          };
        } else if (toolName === "fetch_customer_crm_profile") {
          toolOutput = {
            customer_id: toolArgs.customer_id,
            rating: "AAA",
            tier: "Enterprise Pro",
            contract_value: 500000,
          };
        } else {
          toolOutput = {
            message: `Generic mock response for ${toolName}`,
            input: toolArgs,
            executed_at: new Date().toISOString(),
          };
        }

        // Return standard MCP JSON-RPC 2.0 result
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: jsonRpcReq.id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(toolOutput),
                },
              ],
              isError: false,
            },
          })
        );
        return;
      }

      // Unsupported Method
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: jsonRpcReq.id,
          error: { code: -32601, message: `Method '${jsonRpcReq.method}' not found` },
        })
      );
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: `Parse error: ${err.message}` },
        })
      );
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Mock MCP Server] 独立服务已启动在 http://localhost:${PORT}`);
  console.log(`   - JSON-RPC Endpoint: POST http://localhost:${PORT}`);
  console.log(`   - 注册工具: ${registeredTools.map((t) => t.name).join(", ")}`);
});
