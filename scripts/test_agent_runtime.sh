#!/usr/bin/env bash

# ==============================================================================
# No-Code Agent Platform - 本地调用与测试脚本套件
# 涵盖: 统一运行时、MCP JSON-RPC 2.0 Invoker、HITL 人工审批拦截与放行、原子 RPC 变更
# ==============================================================================

set -e

# 配置测试目标地址 (可指定本地 Express 模拟端点或 Supabase Edge Function 地址)
BASE_URL="${BASE_URL:-http://localhost:3000}"
SUPABASE_FUNCTION_URL="${SUPABASE_FUNCTION_URL:-http://localhost:54321/functions/v1/run-agent-task}"
ANON_KEY="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_key}"

# 颜色高亮
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# JSON 格式化函数 (自动兼容 jq / node / cat)
format_json() {
  if command -v jq >/dev/null 2>&1; then
    jq .
  elif command -v node >/dev/null 2>&1; then
    node -e "
      let data = '';
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => {
        try {
          console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
          process.stdout.write(data);
        }
      });
    "
  else
    cat
  fi
}

echo -e "${BOLD}${CYAN}==============================================================================${NC}"
echo -e "${BOLD}${CYAN}    🤖 No-Code Agent Platform: 本地调用与测试用例验证套件                      ${NC}"
echo -e "${BOLD}${CYAN}==============================================================================${NC}"
echo -e "测试服务基地址: ${YELLOW}${BASE_URL}${NC}\n"

# ------------------------------------------------------------------------------
# 测试用例 1: MCP Server 标准 JSON-RPC 2.0 tools/list 发现测试
# ------------------------------------------------------------------------------
echo -e "${BLUE}[TEST CASE 1]${NC} 测试 MCP Server 的 tools/list 协议发现..."
curl -s -X POST "${BASE_URL}/api/mock-mcp-server" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-mcp-list-001",
    "method": "tools/list",
    "params": {}
  }' | format_json

echo -e "\n${GREEN}✓ CASE 1 完成${NC}\n"

# ------------------------------------------------------------------------------
# 测试用例 2: MCP Server 标准 JSON-RPC 2.0 tools/call 工具调用 (PostgreSQL 查询)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[TEST CASE 2]${NC} 测试 MCP Server 的 tools/call 远程调用 (execute_readonly_sql)..."
curl -s -X POST "${BASE_URL}/api/mock-mcp-server" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock_mcp_token_enterprise" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-mcp-call-002",
    "method": "tools/call",
    "params": {
      "name": "execute_readonly_sql",
      "arguments": {
        "sql_query": "SELECT id, name, deal_amount FROM leads WHERE deal_amount > 50000 LIMIT 3",
        "limit": 3
      }
    }
  }' | format_json

echo -e "\n${GREEN}✓ CASE 2 完成${NC}\n"

# ------------------------------------------------------------------------------
# 测试用例 3: 常规任务触发执行 (Standard Agent Dispatch with Atomic Mutation)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[TEST CASE 3]${NC} 测试统一运行时: 常规任务调度与原子 RPC 变更写回..."
curl -s -X POST "${BASE_URL}/api/run-agent-task" \
  -H "Content-Type: application/json" \
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
  }' | format_json

echo -e "\n${GREEN}✓ CASE 3 完成${NC}\n"

# ------------------------------------------------------------------------------
# 测试用例 4: Human-in-the-Loop (HITL) 触发人工审批拦截挂起 (Pending)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[TEST CASE 4]${NC} 测试 Human-in-the-loop: 大额资金或敏感变更拦截挂起 (require_approval=true)..."
curl -s -X POST "${BASE_URL}/api/run-agent-task" \
  -H "Content-Type: application/json" \
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
  }' | format_json

echo -e "\n${YELLOW}⚠ 状态已拦截并挂起: requires_approval = true${NC}\n"

# ------------------------------------------------------------------------------
# 测试用例 5: 人工审批通过后，携带 pending_execution 放行恢复执行
# ------------------------------------------------------------------------------
echo -e "${BLUE}[TEST CASE 5]${NC} 测试 Human-in-the-loop: 人工审核通过 (approved=true) 恢复暂存执行..."
curl -s -X POST "${BASE_URL}/api/run-agent-task" \
  -H "Content-Type: application/json" \
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
  }' | format_json

echo -e "\n${GREEN}✓ CASE 5 审批放行执行完成${NC}\n"

# ------------------------------------------------------------------------------
# 测试用例 6: 聚合指标计算 (calc_metrics 技能)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[TEST CASE 6]${NC} 测试数据统计技能 (calc_metrics)..."
curl -s -X POST "${BASE_URL}/api/run-agent-task" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task_metrics_003",
    "payload_override": {
      "module_id": "mod_deals",
      "instruction": "统计当前商机总签约金额",
      "trigger_skill": "calc_metrics",
      "require_approval": false,
      "tool_args": {
        "field_key": "deal_amount",
        "calculation_type": "sum",
        "filter_condition": { "stage": "Closed Won" }
      }
    }
  }' | format_json

echo -e "\n${GREEN}✓ 全部用例测试完毕！${NC}\n"
