import {
  Agent,
  Workflow,
  ToolDefinition,
  KnowledgeBase,
  KnowledgeDoc,
  ExecutionTask,
} from "../types/schemas.ts";

export const INITIAL_TOOLS: ToolDefinition[] = [
  {
    id: "calculator",
    name: "数学表达式计算器 (Calculator)",
    description: "安全执行数学公式、汇率计算或统计公式运算",
    category: "Math & Utilities",
    type: "builtin",
    parameters: {
      expression: {
        type: "string",
        description: "待计算的数学算式，例如: (150 * 0.8) + 25",
        required: true,
      },
    },
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "json_formatter",
    name: "JSON 格式化与解析器 (JSON Parser)",
    description: "解析、验证并美化 JSON 字符串或嵌套对象",
    category: "Developer Tools",
    type: "builtin",
    parameters: {
      input: {
        type: "string",
        description: "待解析的 JSON 字符串",
        required: true,
      },
    },
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "text_summarizer",
    name: "文本核心提取器 (Text Summarizer)",
    description: "提取长文本或文档的核心关键句子与字数统计",
    category: "NLP & Content",
    type: "builtin",
    parameters: {
      text: {
        type: "string",
        description: "输入的原始长文本内容",
        required: true,
      },
    },
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "currency_converter",
    name: "实时汇率换算工具 (FX Rate Converter)",
    description: "换算不同货币币种之间的实时汇率金额",
    category: "Financial",
    type: "function",
    parameters: {
      amount: {
        type: "number",
        description: "兑换金额数值",
        required: true,
      },
      from: {
        type: "string",
        description: "源货币代码 (例如: USD, CNY, EUR)",
        required: true,
      },
      to: {
        type: "string",
        description: "目标货币代码 (例如: CNY, USD, JPY)",
        required: true,
      },
    },
    createdAt: "2026-08-20T10:00:00.000Z",
  },
];

export const INITIAL_KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: "kb_enterprise_policies",
    name: "企业服务与 SLA 规范手册",
    description: "包含企业级客户支持等级、SLA 响应时限、退款协议与权限策略",
    documentsCount: 3,
    vectorDimension: 1536,
    status: "ready",
    createdAt: "2026-08-15T08:00:00.000Z",
  },
  {
    id: "kb_product_specs",
    name: "开放平台 API 与产品架构文档",
    description: "包含 RESTful API 端点规范、鉴权凭据格式、速率限制与错误码说明",
    documentsCount: 2,
    vectorDimension: 1536,
    status: "ready",
    createdAt: "2026-08-18T11:30:00.000Z",
  },
];

export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: "doc_sla_01",
    knowledgeBaseId: "kb_enterprise_policies",
    title: "企业客户服务等级 (SLA) 响应标准",
    content: `1. 企业专属客户（Enterprise Tier）：无论工单紧急程度，必须在 15 分钟内完成首次响应，高优先级问题在 2 小时内提供临时规避或修复方案。
2. 专业版客户（Pro Tier）：高优先级问题 1 小时内响应，普通问题 4 小时内响应。
3. 免费版客户（Community Tier）：24 小时内通过工单系统异步响应。
4. 紧急升级策略：若企业客户遭遇账单扣费异常或系统 500 宕机，自动触发 P0 级即时告警并抄送值班架构师。`,
    chunkCount: 2,
    status: "indexed",
    createdAt: "2026-08-15T09:00:00.000Z",
  },
  {
    id: "doc_refund_02",
    knowledgeBaseId: "kb_enterprise_policies",
    title: "退款与账单结算争议处理流程",
    content: `用户购买订阅后 7 日内未消耗超过 10,000 Token 算力的，可申请 100% 全额原路退款。
若因平台自身可用性低于 99.9% 造成的业务中断，将按中断时长的 3 倍以代金券形式补偿用户账户余额。
涉及欺诈盗刷的工单，需上报风控合规组人工审核，工单状态置为 pending_fraud_review。`,
    chunkCount: 2,
    status: "indexed",
    createdAt: "2026-08-15T09:10:00.000Z",
  },
  {
    id: "doc_api_spec_01",
    knowledgeBaseId: "kb_product_specs",
    title: "开放平台 REST API 鉴权与调用规范",
    content: `所有发往 https://api.agentplatform.io/v1/ 的请求必须携带 'Authorization: Bearer <API_KEY>' 标头。
速率限制：标准账户 60 次/分钟，企业账户 1200 次/分钟。
如果超过速率限制，服务端将返回 HTTP 429 Too Many Requests，并在响应头中附带 'Retry-After' 秒数。
支持的返回格式统一为 application/json，错误响应体格式固定为 { "error": { "code": string, "message": string } }。`,
    chunkCount: 2,
    status: "indexed",
    createdAt: "2026-08-18T12:00:00.000Z",
  },
];

export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: "wf_support_triage",
    name: "智能工单分流与自动解答工作流 (Ticket Auto-Triage)",
    description: "接收用户工单后自动通过 LLM 识别意图与紧急度，基于企业知识库与 SLA 规则进行条件分支路由，生成专业解答并计算响应时限。",
    isPublished: true,
    createdAt: "2026-08-21T09:00:00.000Z",
    updatedAt: "2026-08-24T18:00:00.000Z",
    variables: [
      {
        id: "var_1",
        name: "ticketTitle",
        type: "string",
        defaultValue: "API 响应 429 并提示超出速率限制",
        description: "工单标题",
      },
      {
        id: "var_2",
        name: "ticketContent",
        type: "string",
        defaultValue: "我们是企业版用户，在今天下午压测时突然收到很多 429 报错，请协助检查我们的配额是否未生效？",
        description: "工单具体描述内容",
      },
      {
        id: "var_3",
        name: "userTier",
        type: "string",
        defaultValue: "enterprise",
        description: "客户等级: enterprise | pro | community",
      },
    ],
    nodes: [
      {
        id: "node_start",
        type: "start",
        position: { x: 50, y: 220 },
        data: {
          label: "开始 (Start Trigger)",
          description: "接收工单标题、内容与客户等级输入",
          type: "start",
          startConfig: {
            inputVariables: [
              {
                name: "ticketTitle",
                type: "string",
                required: true,
                defaultValue: "API 响应 429 并提示超出速率限制",
                description: "工单标题",
              },
              {
                name: "ticketContent",
                type: "string",
                required: true,
                defaultValue: "我们是企业版用户，在今天下午压测时突然收到很多 429 报错，请协助检查我们的配额是否未生效？",
                description: "工单描述",
              },
              {
                name: "userTier",
                type: "string",
                required: true,
                defaultValue: "enterprise",
                description: "客户等级",
              },
            ],
          },
        },
      },
      {
        id: "node_classify",
        type: "llm",
        position: { x: 340, y: 220 },
        data: {
          label: "意图分类 (LLM Classifier)",
          description: "分析工单类型 (billing/technical/auth) 与优先级 (high/low)",
          type: "llm",
          llmConfig: {
            model: "gemini-3.7-flash",
            provider: "google",
            temperature: 0.1,
            maxTokens: 512,
            topP: 0.9,
            systemPrompt: "你是一个资深技术支持分类器。请严格以 JSON 格式输出分类结果。字段包含: category (枚举: technical, billing, auth, general), priority (枚举: high, low), summary (简短概括), sentiment (枚举: urgent, neutral, frustrated)。",
            userPrompt: "工单标题: {{variables.ticketTitle}}\n工单内容: {{variables.ticketContent}}\n用户等级: {{variables.userTier}}\n请分析该工单。",
            responseFormat: "json",
            tools: [],
          },
        },
      },
      {
        id: "node_condition",
        type: "condition",
        position: { x: 640, y: 220 },
        data: {
          label: "优先级判定 (Condition)",
          description: "判断客户是否为企业客户或高优先级",
          type: "condition",
          conditionConfig: {
            logicalOperator: "or",
            conditions: [
              {
                id: "c_1",
                leftOperand: "{{variables.userTier}}",
                operator: "equals",
                rightOperand: "enterprise",
                targetHandle: "true",
              },
              {
                id: "c_2",
                leftOperand: "{{nodes.node_classify.output.result.priority}}",
                operator: "equals",
                rightOperand: "high",
                targetHandle: "true",
              },
            ],
            elseTargetHandle: "false",
          },
        },
      },
      {
        id: "node_sla_code",
        type: "code",
        position: { x: 940, y: 120 },
        data: {
          label: "SLA 时效计算 (Code Sandbox)",
          description: "计算 VIP 响应时限与专属工程师派单标记",
          type: "code",
          codeConfig: {
            language: "javascript",
            inputs: {
              tier: "{{variables.userTier}}",
              category: "{{nodes.node_classify.output.result.category}}",
            },
            code: `function main(inputs) {
  const isEnterprise = inputs.tier === 'enterprise';
  const responseLimitMinutes = isEnterprise ? 15 : 60;
  const deadline = new Date(Date.now() + responseLimitMinutes * 60000).toISOString();
  
  return {
    escalated: isEnterprise,
    slaTarget: responseLimitMinutes + ' 分钟',
    deadlineTime: deadline,
    assignedQueue: isEnterprise ? 'VIP_SENIOR_ENG_POOL' : 'STANDARD_SUPPORT_POOL',
    tag: 'URGENT_TRIAGE'
  };
}`,
          },
        },
      },
      {
        id: "node_rag",
        type: "retrieval",
        position: { x: 940, y: 330 },
        data: {
          label: "知识库检索 (Knowledge RAG)",
          description: "检索平台 API 规范与企业 SLA 政策",
          type: "retrieval",
          retrievalConfig: {
            knowledgeBaseId: "kb_product_specs",
            queryTemplate: "{{variables.ticketTitle}} {{variables.ticketContent}}",
            topK: 2,
            scoreThreshold: 0.1,
          },
        },
      },
      {
        id: "node_reply_llm",
        type: "llm",
        position: { x: 1240, y: 220 },
        data: {
          label: "回复生成 (LLM Solver)",
          description: "结合检索上下文与工单详情撰写最终解决方案",
          type: "llm",
          llmConfig: {
            model: "gemini-3.7-flash",
            provider: "google",
            temperature: 0.3,
            maxTokens: 1024,
            topP: 0.95,
            systemPrompt: "你是一个专业、严谨且富有同理心的企业级技术客服顾问。请根据工单内容和参考知识库文档，撰写清晰的答复，给出排查步骤和后续跟进说明。",
            userPrompt: "工单标题: {{variables.ticketTitle}}\n工单内容: {{variables.ticketContent}}\n客户等级: {{variables.userTier}}\n参考知识库资料:\n{{nodes.node_rag.output.contextString}}\nSLA 分派信息: {{nodes.node_sla_code.output.result}}\n\n请输出专业回复。",
            responseFormat: "text",
            tools: [],
          },
        },
      },
      {
        id: "node_end",
        type: "end",
        position: { x: 1540, y: 220 },
        data: {
          label: "结束输出 (End Output)",
          description: "输出结构化工单处理结果与答复文本",
          type: "end",
          endConfig: {
            outputVariables: [
              {
                name: "replyContent",
                expression: "{{nodes.node_reply_llm.output.result}}",
                description: "生成的客服回复草稿",
              },
              {
                name: "ticketClassification",
                expression: "{{nodes.node_classify.output.result}}",
                description: "工单分类元数据",
              },
              {
                name: "slaDetails",
                expression: "{{nodes.node_sla_code.output.result}}",
                description: "SLA 时限与派单信息",
              },
            ],
          },
        },
      },
    ],
    edges: [
      { id: "e_1", source: "node_start", target: "node_classify" },
      { id: "e_2", source: "node_classify", target: "node_condition" },
      { id: "e_3", source: "node_condition", sourceHandle: "true", target: "node_sla_code", label: "VIP / 高优先级" },
      { id: "e_4", source: "node_condition", sourceHandle: "false", target: "node_rag", label: "普通等级" },
      { id: "e_5", source: "node_sla_code", target: "node_rag" },
      { id: "e_6", source: "node_rag", target: "node_reply_llm" },
      { id: "e_7", source: "node_reply_llm", target: "node_end" },
    ],
  },
  {
    id: "wf_data_pipeline",
    name: "API 数据清洗与告警管道 (Data Pipeline & Alert)",
    description: "定时或手动触发抓取外部接口数据，执行 JavaScript 过滤清洗与异常判定，输出结构化告警摘要。",
    isPublished: true,
    createdAt: "2026-08-22T14:00:00.000Z",
    updatedAt: "2026-08-24T19:00:00.000Z",
    variables: [
      {
        id: "v_1",
        name: "targetEndpoint",
        type: "string",
        defaultValue: "https://jsonplaceholder.typicode.com/todos/1",
        description: "监控的目标数据接口",
      },
      {
        id: "v_2",
        name: "thresholdScore",
        type: "number",
        defaultValue: 80,
        description: "告警阈值分",
      },
    ],
    nodes: [
      {
        id: "start_1",
        type: "start",
        position: { x: 80, y: 200 },
        data: {
          label: "开始 (Start)",
          type: "start",
          startConfig: {
            inputVariables: [
              {
                name: "targetEndpoint",
                type: "string",
                required: true,
                defaultValue: "https://jsonplaceholder.typicode.com/todos/1",
                description: "目标接口",
              },
              {
                name: "thresholdScore",
                type: "number",
                required: true,
                defaultValue: 80,
                description: "告警阈值",
              },
            ],
          },
        },
      },
      {
        id: "http_1",
        type: "http_request",
        position: { x: 360, y: 200 },
        data: {
          label: "数据请求 (HTTP GET)",
          type: "http_request",
          httpConfig: {
            method: "GET",
            url: "{{variables.targetEndpoint}}",
            headers: { "Accept": "application/json" },
            params: {},
            bodyType: "none",
            body: "",
            timeoutMs: 8000,
          },
        },
      },
      {
        id: "code_1",
        type: "code",
        position: { x: 660, y: 200 },
        data: {
          label: "数据清洗转换 (JS Transform)",
          type: "code",
          codeConfig: {
            language: "javascript",
            inputs: {
              payload: "{{nodes.http_1.output.data}}",
              threshold: "{{variables.thresholdScore}}",
            },
            code: `function main(inputs) {
  const data = inputs.payload || {};
  const isCompleted = Boolean(data.completed);
  const healthScore = isCompleted ? 95 : 45;
  
  return {
    itemId: data.id || 0,
    title: data.title || 'N/A',
    healthScore,
    needsAlert: healthScore < Number(inputs.threshold),
    checkedAt: new Date().toISOString()
  };
}`,
          },
        },
      },
      {
        id: "end_1",
        type: "end",
        position: { x: 960, y: 200 },
        data: {
          label: "完成归档 (Pipeline End)",
          type: "end",
          endConfig: {
            outputVariables: [
              {
                name: "pipelineReport",
                expression: "{{nodes.code_1.output.result}}",
                description: "清洗后的监控结果",
              },
            ],
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "start_1", target: "http_1" },
      { id: "e2", source: "http_1", target: "code_1" },
      { id: "e3", source: "code_1", target: "end_1" },
    ],
  },
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: "agent_support_expert",
    name: "企业技术客服与 SLA 调度 Agent",
    description: "基于企业级 SLA 服务标准和知识库文档，自动对客户问题进行意图识别、故障排查指导与响应时效预警。",
    avatar: "🎧",
    category: "Customer Support",
    isPublished: true,
    modelConfig: {
      model: "gemini-3.7-flash",
      provider: "google",
      temperature: 0.2,
      maxTokens: 2048,
      topP: 0.95,
      systemPrompt: "你是一个企业级技术支持专家 Agent。你会主动引用 SLA 标准并协助用户定位 API、鉴权或配额问题。",
    },
    promptTemplate: "用户问题: {{user_input}}\n客户等级: {{user_tier}}",
    tools: ["calculator", "json_formatter", "text_summarizer"],
    knowledgeBases: ["kb_enterprise_policies", "kb_product_specs"],
    workflowId: "wf_support_triage",
    createdAt: "2026-08-20T12:00:00.000Z",
    updatedAt: "2026-08-24T17:00:00.000Z",
  },
  {
    id: "agent_code_reviewer",
    name: "全栈代码安全与重构审查 Agent",
    description: "深入分析 TypeScript / Python 代码中的类型错误、潜在安全漏洞、SQL 注入风险与性能瓶颈，提供重构建议。",
    avatar: "🛡️",
    category: "Developer Tools",
    isPublished: true,
    modelConfig: {
      model: "gemini-3.7-flash",
      provider: "google",
      temperature: 0.1,
      maxTokens: 4096,
      topP: 0.9,
      systemPrompt: "你是一个资深全栈架构师与安全审计 Agent。以严格的生产标准审查代码，指出安全风险与类型问题并给出重构方案。",
    },
    promptTemplate: "代码片段:\n```\n{{user_input}}\n```",
    tools: ["json_formatter"],
    knowledgeBases: ["kb_product_specs"],
    createdAt: "2026-08-22T10:00:00.000Z",
    updatedAt: "2026-08-24T18:00:00.000Z",
  },
];

export const INITIAL_EXECUTIONS: ExecutionTask[] = [
  {
    id: "task_demo_8829",
    targetId: "wf_support_triage",
    targetType: "workflow",
    targetName: "智能工单分流与自动解答工作流 (Ticket Auto-Triage)",
    status: "completed",
    input: {
      ticketTitle: "企业版 API 速率限制 429 报错咨询",
      ticketContent: "我们是企业版用户，目前压测请求达到 500 次/分时出现 429 拦截，需要确认当前配额。",
      userTier: "enterprise",
    },
    output: {
      replyContent: "尊敬的企业级用户：您好！已为您核对开放平台 API 规范。企业级账户默认配额上限为 1200 次/分钟。当前 429 拦截可能与客户端并发集中突发有关。已为您将工单标记为 VIP_SENIOR_ENG_POOL 队列，专属架构师将在 15 分钟内为您调优突发突增配额桶。",
      ticketClassification: {
        category: "technical",
        priority: "high",
        summary: "企业客户 429 速率限制核对与配额调整",
        sentiment: "urgent",
      },
      slaDetails: {
        escalated: true,
        slaTarget: "15 分钟",
        assignedQueue: "VIP_SENIOR_ENG_POOL",
        tag: "URGENT_TRIAGE",
      },
    },
    nodeResults: {
      node_start: {
        nodeId: "node_start",
        nodeName: "开始 (Start Trigger)",
        nodeType: "start",
        status: "completed",
        input: { userTier: "enterprise" },
        output: { userTier: "enterprise" },
        startedAt: 1787612000000,
        completedAt: 1787612000005,
        durationMs: 5,
        traceLogs: ["Initialized start variables: ticketTitle, ticketContent, userTier"],
      },
      node_classify: {
        nodeId: "node_classify",
        nodeName: "意图分类 (LLM Classifier)",
        nodeType: "llm",
        status: "completed",
        input: { model: "gemini-3.7-flash" },
        output: { result: { category: "technical", priority: "high" } },
        startedAt: 1787612000005,
        completedAt: 1787612000850,
        durationMs: 845,
        traceLogs: ["Calling LLM model gemini-3.7-flash", "LLM returned valid JSON classification."],
      },
      node_condition: {
        nodeId: "node_condition",
        nodeName: "优先级判定 (Condition)",
        nodeType: "condition",
        status: "completed",
        input: {},
        output: { passed: true, activeHandle: "true" },
        startedAt: 1787612000850,
        completedAt: 1787612000852,
        durationMs: 2,
        traceLogs: ["Condition evaluated to TRUE (Branch True)"],
      },
      node_sla_code: {
        nodeId: "node_sla_code",
        nodeName: "SLA 时效计算 (Code Sandbox)",
        nodeType: "code",
        status: "completed",
        input: { tier: "enterprise" },
        output: { result: { escalated: true, slaTarget: "15 分钟" } },
        startedAt: 1787612000852,
        completedAt: 1787612000860,
        durationMs: 8,
        traceLogs: ["Code executed successfully in sandbox."],
      },
      node_rag: {
        nodeId: "node_rag",
        nodeName: "知识库检索 (Knowledge RAG)",
        nodeType: "retrieval",
        status: "completed",
        input: { query: "企业版 API 速率限制 429 报错咨询" },
        output: { matchedCount: 2 },
        startedAt: 1787612000860,
        completedAt: 1787612000875,
        durationMs: 15,
        traceLogs: ["Retrieved 2 relevant knowledge chunks."],
      },
      node_reply_llm: {
        nodeId: "node_reply_llm",
        nodeName: "回复生成 (LLM Solver)",
        nodeType: "llm",
        status: "completed",
        input: { model: "gemini-3.7-flash" },
        output: { result: "尊敬的企业级用户：您好！已为您核对开放平台 API 规范..." },
        startedAt: 1787612000875,
        completedAt: 1787612002100,
        durationMs: 1225,
        traceLogs: ["LLM solver generated complete response."],
      },
      node_end: {
        nodeId: "node_end",
        nodeName: "结束输出 (End Output)",
        nodeType: "end",
        status: "completed",
        input: {},
        output: {},
        startedAt: 1787612002100,
        completedAt: 1787612002102,
        durationMs: 2,
        traceLogs: ["Generated final outputs."],
      },
    },
    traceEvents: [
      {
        id: "tr_1",
        timestamp: 1787612000000,
        eventType: "task_start",
        message: "Workflow '智能工单分流与自动解答工作流' execution started.",
      },
      {
        id: "tr_2",
        timestamp: 1787612000005,
        nodeId: "node_start",
        nodeName: "开始 (Start Trigger)",
        eventType: "node_enter",
        message: "Starting execution of node '开始 (Start Trigger)'",
      },
      {
        id: "tr_3",
        timestamp: 1787612000850,
        nodeId: "node_classify",
        nodeName: "意图分类 (LLM Classifier)",
        eventType: "llm_call",
        message: "Calling LLM model 'gemini-3.7-flash'...",
      },
      {
        id: "tr_4",
        timestamp: 1787612002102,
        eventType: "task_complete",
        message: "Workflow execution completed successfully in 2102ms.",
      },
    ],
    metrics: {
      durationMs: 2102,
      tokenUsage: {
        promptTokens: 420,
        completionTokens: 210,
        totalTokens: 630,
      },
      costUsd: 0.000189,
    },
    triggeredBy: "manual",
    createdAt: "2026-08-24T18:00:00.000Z",
    startedAt: "2026-08-24T18:00:00.000Z",
    completedAt: "2026-08-24T18:00:02.102Z",
  },
];
