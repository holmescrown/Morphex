// MODIFIED: Added SystemFlowCanvas for Visual AI Company Collaboration Canvas (CubeLV Style) with QuickStartWizard
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { QuickStartWizard, QuickStartScenarioId } from "./QuickStartWizard.tsx";
import {
  Bot,
  Database,
  ArrowRight,
  Sparkles,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Users,
  ShieldCheck,
  Zap,
  ChevronRight,
  Plus,
  Layers,
  Search,
  Filter,
  Info,
  Calendar,
  X,
  ExternalLink,
  Code2,
  Briefcase,
  TrendingUp,
  Cpu,
  MapPin,
  Compass,
  Locate,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Target,
  Crosshair,
} from "lucide-react";

export type DomainType = "trade" | "devops" | "finance";

interface AgentNode {
  id: string;
  name: string;
  role: string;
  avatar: string;
  departmentId: string;
  schedule: string;
  status: "active" | "idle" | "running";
  model: string;
  description: string;
  x: number;
  y: number;
  inputs: string[];
  outputs: string[];
  lastTriggered?: string;
  sopSteps: string[];
}

interface DataNode {
  id: string;
  name: string;
  category: string;
  iconName: string;
  departmentId: string;
  recordCount: number;
  version: number;
  x: number;
  y: number;
  sampleFields: string[];
  updatedAt: string;
}

interface FlowConnection {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  color?: string;
  animated?: boolean;
}

interface Department {
  id: string;
  name: string;
  englishName: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DomainConfig {
  id: DomainType;
  title: string;
  subtitle: string;
  badge: string;
  departments: Department[];
  agents: AgentNode[];
  dataNodes: DataNode[];
  connections: FlowConnection[];
}

const DOMAIN_PRESETS: Record<DomainType, DomainConfig> = {
  trade: {
    id: "trade",
    title: "外贸出海自动化公司 (Global Trade AI Co.)",
    subtitle: "外贸客群互动分析、跟进催办、报价策略与收款全链路协同",
    badge: "外贸出海 · 核心架构",
    departments: [
      {
        id: "dept_sales",
        name: "客户互动与销售拓展部",
        englishName: "Sales & Client Success",
        color: "#6366f1",
        borderColor: "border-indigo-500/40",
        bgGradient: "from-indigo-950/20 via-slate-900/40 to-slate-950/30",
        x: 40,
        y: 40,
        width: 380,
        height: 600,
      },
      {
        id: "dept_product",
        name: "供应链与行销策略部",
        englishName: "Supply Chain & Marketing",
        color: "#06b6d4",
        borderColor: "border-cyan-500/40",
        bgGradient: "from-cyan-950/20 via-slate-900/40 to-slate-950/30",
        x: 460,
        y: 40,
        width: 380,
        height: 600,
      },
      {
        id: "dept_finance",
        name: "财务结算与风控履约部",
        englishName: "Finance & Order Fulfillment",
        color: "#10b981",
        borderColor: "border-emerald-500/40",
        bgGradient: "from-emerald-950/20 via-slate-900/40 to-slate-950/30",
        x: 880,
        y: 40,
        width: 380,
        height: 600,
      },
    ],
    agents: [
      {
        id: "agent_interaction",
        name: "互动分析员",
        role: "Client Engagement Analyst",
        avatar: "🤖",
        departmentId: "dept_sales",
        schedule: "每日 08:30 / 收到新邮件时",
        status: "active",
        model: "gemini-3.7-flash",
        description: "抓取海外买家询盘邮件与 WhatsApp 对话，提取采购预算、交期与意向评分",
        x: 80,
        y: 110,
        inputs: ["node_customers"],
        outputs: ["node_reports", "agent_followup"],
        lastTriggered: "10 分钟前",
        sopSteps: ["监听邮件 Webhook", "意向情感与采购关键词提取", "写入客户互动报告"],
      },
      {
        id: "agent_followup",
        name: "跟进专员",
        role: "Follow-up Specialist",
        avatar: "👔",
        departmentId: "dept_sales",
        schedule: "每日 14:00 催办",
        status: "active",
        model: "gemini-3.7-flash",
        description: "根据未回复天数生成本地化催款与样品确认信，分派业务员待办任务",
        x: 80,
        y: 430,
        inputs: ["node_reports"],
        outputs: ["node_quotes"],
        lastTriggered: "32 分钟前",
        sopSteps: ["扫描超时未联系客户", "生成千人千面跟进草稿", "建立跟进任务"],
      },
      {
        id: "agent_marketing",
        name: "行销策略分析员",
        role: "Market Strategy Analyst",
        avatar: "📊",
        departmentId: "dept_product",
        schedule: "每周一 09:00",
        status: "idle",
        model: "gemini-3.7-flash",
        description: "基于全球大宗商品行情与竞品报价，输出最优 FOB/CIF 定价模型与营销策略",
        x: 500,
        y: 110,
        inputs: ["node_products", "node_reports"],
        outputs: ["node_marketing_strategy"],
        lastTriggered: "2 小时前",
        sopSteps: ["拉取行业大宗商品指数", "计算利润率与阶梯报价", "输出策略简报"],
      },
      {
        id: "agent_product_mgr",
        name: "产品与库存管理员",
        role: "Catalog & Production Lead",
        avatar: "📦",
        departmentId: "dept_product",
        schedule: "事件驱动 (库存变更)",
        status: "active",
        model: "gemini-3.7-flash",
        description: "校验各 SKU 规格、HS Code 海关编码、包装体积并自动化同步库存水位",
        x: 500,
        y: 430,
        inputs: ["node_products"],
        outputs: ["node_production_orders"],
        lastTriggered: "5 分钟前",
        sopSteps: ["HS Code 智能对齐", "箱规体积自动精算", "生成生产派工单"],
      },
      {
        id: "agent_payment",
        name: "收款与水单专员",
        role: "Payment & Invoice Auditor",
        avatar: "💰",
        departmentId: "dept_finance",
        schedule: "实时监听 Swift 电汇入账",
        status: "active",
        model: "gemini-3.7-flash",
        description: "OCR 识别海外银行 TT 水单，核验 PI 形式发票合同金额并执行 JSONB 记账",
        x: 920,
        y: 110,
        inputs: ["node_pi", "node_payments"],
        outputs: ["node_payments"],
        lastTriggered: "1 分钟前",
        sopSteps: ["TT 水单 OCR 与金额校验", "PI 关联核销", "触发财务记录收款"],
      },
      {
        id: "agent_fulfillment",
        name: "订舱与履约风控员",
        role: "Fulfillment & Risk Guard",
        avatar: "🚢",
        departmentId: "dept_finance",
        schedule: "装船前 48 小时",
        status: "idle",
        model: "gemini-3.7-flash",
        description: "提单提货权管控、信用证条款审核、港口海关放行合规检查",
        x: 920,
        y: 430,
        inputs: ["node_production_orders"],
        outputs: ["node_payments"],
        lastTriggered: "1 小时前",
        sopSteps: ["货权核验", "提单草本核对", "放单指令审核"],
      },
    ],
    dataNodes: [
      {
        id: "node_customers",
        name: "客户资料库 (CRM)",
        category: "核心数据",
        iconName: "Users",
        departmentId: "dept_sales",
        recordCount: 1248,
        version: 14,
        x: 80,
        y: 270,
        sampleFields: ["company_name", "country", "credit_level", "annual_volume"],
        updatedAt: "刚刚",
      },
      {
        id: "node_reports",
        name: "客户互动报告",
        category: "分析成果",
        iconName: "FileText",
        departmentId: "dept_sales",
        recordCount: 532,
        version: 8,
        x: 270,
        y: 270,
        sampleFields: ["intent_score", "pain_points", "recommended_sku", "summary"],
        updatedAt: "10 分钟前",
      },
      {
        id: "node_products",
        name: "产品目录 (Catalog)",
        category: "供应链",
        iconName: "Database",
        departmentId: "dept_product",
        recordCount: 380,
        version: 22,
        x: 500,
        y: 270,
        sampleFields: ["sku_code", "hs_code", "moq", "fob_price", "stock_qty"],
        updatedAt: "15 分钟前",
      },
      {
        id: "node_marketing_strategy",
        name: "行销与报价策略",
        category: "决策卡片",
        iconName: "Sparkles",
        departmentId: "dept_product",
        recordCount: 45,
        version: 5,
        x: 690,
        y: 270,
        sampleFields: ["target_region", "discount_ladder", "valid_until", "approved_by"],
        updatedAt: "2 小时前",
      },
      {
        id: "node_pi",
        name: "PI 形式发票",
        category: "合同单据",
        iconName: "FileText",
        departmentId: "dept_finance",
        recordCount: 168,
        version: 12,
        x: 920,
        y: 270,
        sampleFields: ["pi_number", "total_usd", "payment_term", "deposit_status"],
        updatedAt: "30 分钟前",
      },
      {
        id: "node_payments",
        name: "收款与台账管理",
        category: "资金数据",
        iconName: "DollarSign",
        departmentId: "dept_finance",
        recordCount: 420,
        version: 19,
        x: 1110,
        y: 270,
        sampleFields: ["bank_ref", "amount_usd", "settled_at", "fx_rate", "diff_amount"],
        updatedAt: "1 分钟前",
      },
    ],
    connections: [
      { id: "c1", fromId: "node_customers", toId: "agent_interaction", label: "读入历史数据", color: "#6366f1" },
      { id: "c2", fromId: "agent_interaction", toId: "node_reports", label: "写入互动报告", color: "#6366f1", animated: true },
      { id: "c3", fromId: "node_reports", toId: "agent_followup", label: "指派跟进待办", color: "#6366f1" },
      { id: "c4", fromId: "node_reports", toId: "agent_marketing", label: "同步买家痛点", color: "#06b6d4" },
      { id: "c5", fromId: "node_products", toId: "agent_marketing", label: "核算底价模型", color: "#06b6d4" },
      { id: "c6", fromId: "agent_marketing", toId: "node_marketing_strategy", label: "沉淀行销策略", color: "#06b6d4", animated: true },
      { id: "c7", fromId: "agent_product_mgr", toId: "node_products", label: "维护 SKU 规范", color: "#06b6d4" },
      { id: "c8", fromId: "node_marketing_strategy", toId: "node_pi", label: "生成外贸 PI", color: "#10b981" },
      { id: "c9", fromId: "node_pi", toId: "agent_payment", label: "核对合同款项", color: "#10b981" },
      { id: "c10", fromId: "agent_payment", toId: "node_payments", label: "记录入账核销", color: "#10b981", animated: true },
    ],
  },
  devops: {
    id: "devops",
    title: "研发与 DevOps 智能工程部 (DevOps Engineering)",
    subtitle: "从 PR 代码审查、安全漏洞审计到自动化流水线部署的无缝协同",
    badge: "研发工程 · 核心架构",
    departments: [
      {
        id: "dept_dev",
        name: "代码审查与质量保障组",
        englishName: "Code Quality & PR Review",
        color: "#06b6d4",
        borderColor: "border-cyan-500/40",
        bgGradient: "from-cyan-950/20 via-slate-900/40 to-slate-950/30",
        x: 40,
        y: 40,
        width: 380,
        height: 600,
      },
      {
        id: "dept_security",
        name: "安全合规与漏洞扫描组",
        englishName: "SecOps & Compliance",
        color: "#ec4899",
        borderColor: "border-pink-500/40",
        bgGradient: "from-pink-950/20 via-slate-900/40 to-slate-950/30",
        x: 460,
        y: 40,
        width: 380,
        height: 600,
      },
      {
        id: "dept_sre",
        name: "发布编排与 SRE 监控组",
        englishName: "Release & SRE Observability",
        color: "#f59e0b",
        borderColor: "border-amber-500/40",
        bgGradient: "from-amber-950/20 via-slate-900/40 to-slate-950/30",
        x: 880,
        y: 40,
        width: 380,
        height: 600,
      },
    ],
    agents: [
      {
        id: "agent_code_reviewer",
        name: "PR 代码审查员",
        role: "Senior Staff Reviewer",
        avatar: "👨‍💻",
        departmentId: "dept_dev",
        schedule: "PR 创建 / 更新时自动触发",
        status: "active",
        model: "gemini-3.7-flash",
        description: "分析 Git Diff、检查异步锁异常、命名规范与测试用例覆盖率",
        x: 80,
        y: 110,
        inputs: ["node_git_repos"],
        outputs: ["node_review_comments"],
        lastTriggered: "3 分钟前",
        sopSteps: ["拉取 Pull Request Diff", "语法树分析与 AST 校验", "直接在 GitHub 提交行级评论"],
      },
      {
        id: "agent_test_runner",
        name: "自动化测试规划员",
        role: "Test Matrix Architect",
        avatar: "🧪",
        departmentId: "dept_dev",
        schedule: "PR 审查通过后",
        status: "active",
        model: "gemini-3.7-flash",
        description: "生成针对修改模块的端到端集成测试脚本与性能回归压测用例",
        x: 80,
        y: 430,
        inputs: ["node_review_comments"],
        outputs: ["node_test_reports"],
        lastTriggered: "15 分钟前",
        sopSteps: ["分析影响面", "动态生成测试套件", "报告回归通过率"],
      },
      {
        id: "agent_security_auditor",
        name: "安全漏洞与凭据审计员",
        role: "SecOps Vulnerability Guard",
        avatar: "🛡️",
        departmentId: "dept_security",
        schedule: "静态扫描 + 提交前拦截",
        status: "active",
        model: "gemini-3.7-flash",
        description: "深度扫描明文 API 密钥泄露、SQL 注入、XSS 与开源依赖 CVE 漏洞",
        x: 500,
        y: 110,
        inputs: ["node_git_repos"],
        outputs: ["node_sec_audit_log"],
        lastTriggered: "8 分钟前",
        sopSteps: ["凭据正则与熵值扫描", "依赖 CVE 数据库匹配", "输出漏洞评级并阻断危险合并"],
      },
      {
        id: "agent_sre_bot",
        name: "发布与 SRE 巡检哨兵",
        role: "SRE Reliability Sentinel",
        avatar: "⚡",
        departmentId: "dept_sre",
        schedule: "每 5 分钟巡检 / 告警触发",
        status: "active",
        model: "gemini-3.7-flash",
        description: "监控生产环境 P99 延迟、CPU 内存负载与金丝雀灰度发布回滚",
        x: 920,
        y: 110,
        inputs: ["node_sec_audit_log"],
        outputs: ["node_release_changelog"],
        lastTriggered: "刚刚",
        sopSteps: ["金丝雀分流 10%", "指标异常自动触发回滚", "推送发布变更简报至 Slack"],
      },
    ],
    dataNodes: [
      {
        id: "node_git_repos",
        name: "Git 仓库与 PR 队列",
        category: "代码资产",
        iconName: "Code2",
        departmentId: "dept_dev",
        recordCount: 86,
        version: 34,
        x: 80,
        y: 270,
        sampleFields: ["repo_name", "pr_number", "author", "additions", "deletions"],
        updatedAt: "刚刚",
      },
      {
        id: "node_review_comments",
        name: "代码审查评审单",
        category: "质量报告",
        iconName: "FileText",
        departmentId: "dept_dev",
        recordCount: 215,
        version: 12,
        x: 270,
        y: 270,
        sampleFields: ["score", "blocker_issues", "lgtm_status", "summary_md"],
        updatedAt: "3 分钟前",
      },
      {
        id: "node_sec_audit_log",
        name: "安全漏洞防护台账",
        category: "安全基线",
        iconName: "ShieldCheck",
        departmentId: "dept_security",
        recordCount: 14,
        version: 3,
        x: 500,
        y: 270,
        sampleFields: ["cve_id", "severity", "file_path", "patch_suggested"],
        updatedAt: "8 分钟前",
      },
      {
        id: "node_release_changelog",
        name: "发布版本与部署日志",
        category: "发布台账",
        iconName: "Database",
        departmentId: "dept_sre",
        recordCount: 92,
        version: 41,
        x: 920,
        y: 270,
        sampleFields: ["version_tag", "commit_hash", "deployed_by", "p99_latency_ms"],
        updatedAt: "刚刚",
      },
    ],
    connections: [
      { id: "dev_c1", fromId: "node_git_repos", toId: "agent_code_reviewer", label: "抓取代码差异", color: "#06b6d4" },
      { id: "dev_c2", fromId: "agent_code_reviewer", toId: "node_review_comments", label: "写入审查意见", color: "#06b6d4", animated: true },
      { id: "dev_c3", fromId: "node_review_comments", toId: "agent_test_runner", label: "触发测试计划", color: "#06b6d4" },
      { id: "dev_c4", fromId: "node_git_repos", toId: "agent_security_auditor", label: "执行 SecOps 扫描", color: "#ec4899" },
      { id: "dev_c5", fromId: "agent_security_auditor", toId: "node_sec_audit_log", label: "记录漏洞拦截", color: "#ec4899", animated: true },
      { id: "dev_c6", fromId: "node_sec_audit_log", toId: "agent_sre_bot", label: "安全门禁放行", color: "#f59e0b" },
      { id: "dev_c7", fromId: "agent_sre_bot", toId: "node_release_changelog", label: "自动灰度发布", color: "#f59e0b", animated: true },
    ],
  },
  finance: {
    id: "finance",
    title: "金融精算与投资风控部 (Investment & Risk)",
    subtitle: "涵盖实时行情监控、投资组合研报、异常资金反洗钱与对账清算",
    badge: "金融风控 · 核心架构",
    departments: [
      {
        id: "dept_macro",
        name: "宏观研报与策略分析组",
        englishName: "Macro Strategy & Asset Alloc",
        color: "#8b5cf6",
        borderColor: "border-purple-500/40",
        bgGradient: "from-purple-950/20 via-slate-900/40 to-slate-950/30",
        x: 40,
        y: 40,
        width: 380,
        height: 600,
      },
      {
        id: "dept_audit",
        name: "反洗钱与资金合规审计组",
        englishName: "AML & Financial Audit",
        color: "#10b981",
        borderColor: "border-emerald-500/40",
        bgGradient: "from-emerald-950/20 via-slate-900/40 to-slate-950/30",
        x: 460,
        y: 40,
        width: 380,
        height: 600,
      },
      {
        id: "dept_settle",
        name: "资产清算与资金总账组",
        englishName: "Settlement & Ledger Book",
        color: "#3b82f6",
        borderColor: "border-blue-500/40",
        bgGradient: "from-blue-950/20 via-slate-900/40 to-slate-950/30",
        x: 880,
        y: 40,
        width: 380,
        height: 600,
      },
    ],
    agents: [
      {
        id: "agent_quant_analyst",
        name: "投资策略分析师",
        role: "Quantitative Strategy Lead",
        avatar: "📈",
        departmentId: "dept_macro",
        schedule: "每个交易日 09:15",
        status: "active",
        model: "gemini-3.7-flash",
        description: "汇总大宗、外汇与权益市场多因子数据，动态调优夏普比率与资产权重",
        x: 80,
        y: 110,
        inputs: ["node_market_feed"],
        outputs: ["node_strategy_report"],
        lastTriggered: "1 小时前",
        sopSteps: ["拉取高频 Tick 数据", "运行蒙特卡洛方差模拟", "生成调仓指令清单"],
      },
      {
        id: "agent_compliance_auditor",
        name: "反洗钱合规审计员",
        role: "AML & Sanction Officer",
        avatar: "⚖️",
        departmentId: "dept_audit",
        schedule: "每笔交易实时拦截",
        status: "active",
        model: "gemini-3.7-flash",
        description: "深度排查 OFAC 制裁名单、高风险地区资金跳跃与拆单洗钱行为",
        x: 500,
        y: 110,
        inputs: ["node_tx_feed"],
        outputs: ["node_audit_flagged"],
        lastTriggered: "2 分钟前",
        sopSteps: ["OFAC/制裁名单碰撞", "交易图谱异常链路探测", "生成合规阻断工单"],
      },
      {
        id: "agent_clearing_bot",
        name: "资金对账与清算专员",
        role: "Multi-Currency Clearing Bot",
        avatar: "🏦",
        departmentId: "dept_settle",
        schedule: "每日 18:00 日终清算",
        status: "idle",
        model: "gemini-3.7-flash",
        description: "自动执行银行账户、券商资金池与内部分布式 JSONB 总账的差错平账",
        x: 920,
        y: 110,
        inputs: ["node_audit_flagged"],
        outputs: ["node_settlement_ledger"],
        lastTriggered: "昨天 18:00",
        sopSteps: ["流水双向核对", "汇兑损益精算", "生成 DDL 级对账单"],
      },
    ],
    dataNodes: [
      {
        id: "node_market_feed",
        name: "宏观行情数据源",
        category: "市场行情",
        iconName: "TrendingUp",
        departmentId: "dept_macro",
        recordCount: 9400,
        version: 88,
        x: 80,
        y: 270,
        sampleFields: ["ticker", "spot_price", "volatility", "fx_spread"],
        updatedAt: "实时更新",
      },
      {
        id: "node_strategy_report",
        name: "投资组合与调仓策略",
        category: "研报结论",
        iconName: "FileText",
        departmentId: "dept_macro",
        recordCount: 120,
        version: 16,
        x: 270,
        y: 270,
        sampleFields: ["sharpe_ratio", "max_drawdown", "target_allocation", "author"],
        updatedAt: "1 小时前",
      },
      {
        id: "node_tx_feed",
        name: "实时出入金流水",
        category: "交易流水",
        iconName: "Database",
        departmentId: "dept_audit",
        recordCount: 3820,
        version: 52,
        x: 500,
        y: 270,
        sampleFields: ["tx_id", "from_account", "to_account", "amount", "currency"],
        updatedAt: "刚刚",
      },
      {
        id: "node_settlement_ledger",
        name: "总账与清算结算单",
        category: "会计台账",
        iconName: "DollarSign",
        departmentId: "dept_settle",
        recordCount: 890,
        version: 31,
        x: 920,
        y: 270,
        sampleFields: ["balance_usd", "unrealized_pnl", "cleared_status", "ledger_hash"],
        updatedAt: "18:00",
      },
    ],
    connections: [
      { id: "fin_c1", fromId: "node_market_feed", toId: "agent_quant_analyst", label: "抓取市场因子", color: "#8b5cf6" },
      { id: "fin_c2", fromId: "agent_quant_analyst", toId: "node_strategy_report", label: "输出配置建议", color: "#8b5cf6", animated: true },
      { id: "fin_c3", fromId: "node_tx_feed", toId: "agent_compliance_auditor", label: "流水实时送审", color: "#10b981" },
      { id: "fin_c4", fromId: "agent_compliance_auditor", toId: "agent_clearing_bot", label: "合规放行清算", color: "#3b82f6", animated: true },
      { id: "fin_c5", fromId: "agent_clearing_bot", toId: "node_settlement_ledger", label: "写入总账凭证", color: "#3b82f6", animated: true },
    ],
  },
};

interface SystemFlowCanvasProps {
  onNavigateToAgent?: (agentId: string) => void;
  onNavigateToModule?: () => void;
  onOpenChat?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onSelectQuickScenario?: (scenarioId: QuickStartScenarioId) => void;
}

export const SystemFlowCanvas: React.FC<SystemFlowCanvasProps> = ({
  onNavigateToAgent,
  onNavigateToModule,
  onOpenChat,
  onNavigateToTab,
  onSelectQuickScenario,
}) => {
  const [activeDomain, setActiveDomain] = useState<DomainType>("trade");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [selectedDataNode, setSelectedDataNode] = useState<DataNode | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");

  // Quick Start 30-Second Scenario Handler
  const handleSelectScenario = (scenarioId: QuickStartScenarioId) => {
    if (onSelectQuickScenario) {
      onSelectQuickScenario(scenarioId);
      return;
    }
    if (scenarioId === "lead_scoring") {
      setActiveDomain("trade");
      handleRunSimulation();
    } else if (scenarioId === "finance_hitl") {
      if (onNavigateToTab) {
        onNavigateToTab("approvals");
      } else {
        setActiveDomain("finance");
        handleRunSimulation();
      }
    } else if (scenarioId === "rag_qa") {
      if (onNavigateToTab) {
        onNavigateToTab("knowledge");
      } else if (onNavigateToAgent) {
        onNavigateToAgent("agent_rag_expert");
      }
    }
  };

  // Minimap Plugin State & References
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(true);
  const [isMinimapDragging, setIsMinimapDragging] = useState(false);
  const [minimapHoverDeptId, setMinimapHoverDeptId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 700 });
  const minimapRef = useRef<SVGSVGElement>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const config = DOMAIN_PRESETS[activeDomain];

  // Track canvas container size via ResizeObserver
  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width || 1000,
          height: entry.contentRect.height || 700,
        });
      }
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute Virtual World Bounds dynamically from current presets
  const worldBounds = useMemo(() => {
    let minX = 0;
    let minY = 0;
    let maxX = 1350;
    let maxY = 720;

    config.departments.forEach((d) => {
      minX = Math.min(minX, d.x - 20);
      minY = Math.min(minY, d.y - 20);
      maxX = Math.max(maxX, d.x + d.width + 40);
      maxY = Math.max(maxY, d.y + d.height + 40);
    });

    config.agents.forEach((a) => {
      minX = Math.min(minX, a.x - 20);
      minY = Math.min(minY, a.y - 20);
      maxX = Math.max(maxX, a.x + 280);
      maxY = Math.max(maxY, a.y + 160);
    });

    config.dataNodes.forEach((d) => {
      minX = Math.min(minX, d.x - 20);
      minY = Math.min(minY, d.y - 20);
      maxX = Math.max(maxX, d.x + 200);
      maxY = Math.max(maxY, d.y + 100);
    });

    const width = Math.max(maxX - minX, 1200);
    const height = Math.max(maxY - minY, 700);

    return { minX, minY, maxX, maxY, width, height };
  }, [config]);

  // Minimap Dimensions & Scale Factors
  const mapWidth = 260;
  const mapHeight = 140;
  const scaleX = mapWidth / worldBounds.width;
  const scaleY = mapHeight / worldBounds.height;

  // World to Minimap conversion
  const toMiniX = useCallback(
    (worldX: number) => (worldX - worldBounds.minX) * scaleX,
    [worldBounds.minX, scaleX]
  );
  const toMiniY = useCallback(
    (worldY: number) => (worldY - worldBounds.minY) * scaleY,
    [worldBounds.minY, scaleY]
  );

  // Minimap to World conversion
  const toWorldX = useCallback(
    (miniX: number) => miniX / scaleX + worldBounds.minX,
    [scaleX, worldBounds.minX]
  );
  const toWorldY = useCallback(
    (miniY: number) => miniY / scaleY + worldBounds.minY,
    [scaleY, worldBounds.minY]
  );

  // Visible World Viewport Coordinates
  const visibleWorldX = -pan.x / zoom;
  const visibleWorldY = -pan.y / zoom;
  const visibleWorldW = containerSize.width / zoom;
  const visibleWorldH = containerSize.height / zoom;

  // Viewport rect inside minimap
  const miniVx = Math.max(0, (visibleWorldX - worldBounds.minX) * scaleX);
  const miniVy = Math.max(0, (visibleWorldY - worldBounds.minY) * scaleY);
  const miniVw = Math.min(mapWidth, visibleWorldW * scaleX);
  const miniVh = Math.min(mapHeight, visibleWorldH * scaleY);

  // Reset zoom & pan when domain changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedAgent(null);
    setSelectedDataNode(null);
    setIsSimulating(false);
  }, [activeDomain]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 1.6));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Click on minimap to jump/center viewport
  const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickMiniX = e.clientX - rect.left;
    const clickMiniY = e.clientY - rect.top;

    const targetWorldX = toWorldX(clickMiniX);
    const targetWorldY = toWorldY(clickMiniY);

    const newPanX = -(targetWorldX * zoom - containerSize.width / 2);
    const newPanY = -(targetWorldY * zoom - containerSize.height / 2);

    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  // Dragging the viewport inside the minimap
  const handleMinimapMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimapDragging(true);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMinimapDragging || !minimapRef.current) return;
      const rect = minimapRef.current.getBoundingClientRect();
      const currentMiniX = Math.max(0, Math.min(mapWidth, e.clientX - rect.left));
      const currentMiniY = Math.max(0, Math.min(mapHeight, e.clientY - rect.top));

      const targetWorldX = toWorldX(currentMiniX);
      const targetWorldY = toWorldY(currentMiniY);

      const newPanX = -(targetWorldX * zoom - containerSize.width / 2);
      const newPanY = -(targetWorldY * zoom - containerSize.height / 2);

      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    };

    const handleGlobalMouseUp = () => {
      if (isMinimapDragging) {
        setIsMinimapDragging(false);
      }
    };

    if (isMinimapDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isMinimapDragging, toWorldX, toWorldY, zoom, containerSize.width, containerSize.height, mapWidth, mapHeight]);

  // Jump and fit to a specific Department
  const handleJumpToDepartment = (dept: Department) => {
    const targetCenterX = dept.x + dept.width / 2;
    const targetCenterY = dept.y + dept.height / 2;

    const newPanX = -(targetCenterX * zoom - containerSize.width / 2);
    const newPanY = -(targetCenterY * zoom - containerSize.height / 2);

    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  // Fit All Nodes comfortably into view
  const handleFitAll = () => {
    const padding = 60;
    const scaleFactorX = (containerSize.width - padding * 2) / worldBounds.width;
    const scaleFactorY = (containerSize.height - padding * 2) / worldBounds.height;
    const optimalZoom = Math.min(Math.max(Math.min(scaleFactorX, scaleFactorY), 0.5), 1.3);

    const worldCenterX = worldBounds.minX + worldBounds.width / 2;
    const worldCenterY = worldBounds.minY + worldBounds.height / 2;

    const newPanX = -(worldCenterX * optimalZoom - containerSize.width / 2);
    const newPanY = -(worldCenterY * optimalZoom - containerSize.height / 2);

    setZoom(Number(optimalZoom.toFixed(2)));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  // Focus on selected node
  const handleFocusSelected = () => {
    if (selectedAgent) {
      const targetCenterX = selectedAgent.x + 130;
      const targetCenterY = selectedAgent.y + 70;
      const newPanX = -(targetCenterX * zoom - containerSize.width / 2);
      const newPanY = -(targetCenterY * zoom - containerSize.height / 2);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else if (selectedDataNode) {
      const targetCenterX = selectedDataNode.x + 90;
      const targetCenterY = selectedDataNode.y + 40;
      const newPanX = -(targetCenterX * zoom - containerSize.width / 2);
      const newPanY = -(targetCenterY * zoom - containerSize.height / 2);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else {
      handleFitAll();
    }
  };

  // Run End-to-End Simulation
  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    const steps = [
      "1. 📥 抓取输入源数据并完成 Schema 校验...",
      "2. 🤖 触发 AI Agent 协同分析与决策...",
      "3. ⚡ 执行 JSONB 乐观锁 (patch_dynamic_record)...",
      "4. 📦 跨部门下游数据分发与待办指派...",
      "5. ✅ 链路执行完毕，全量 Trace 已捕获！",
    ];

    let currentStep = 0;
    setSimulationStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setSimulationStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulating(false);
          setSimulationStep(null);
        }, 1200);
      }
    }, 900);
  };

  // Helper to render icon
  const renderDataIcon = (iconName: string) => {
    switch (iconName) {
      case "Users":
        return <Users className="w-4 h-4 text-indigo-400" />;
      case "Database":
        return <Database className="w-4 h-4 text-cyan-400" />;
      case "DollarSign":
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case "FileText":
        return <FileText className="w-4 h-4 text-amber-400" />;
      case "Code2":
        return <Code2 className="w-4 h-4 text-cyan-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-4 h-4 text-pink-400" />;
      case "TrendingUp":
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">
      {/* 1. Header Toolbar */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur shrink-0 z-20 shadow-md gap-3">
        {/* Left: Domain Title & Mode Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-950/50 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight truncate">
                {config.title}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline-block shrink-0">
                {config.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden md:block">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Domain Presets Switcher Tabs */}
        <div className="flex items-center p-0.5 sm:p-1 bg-slate-950/90 border border-slate-800 rounded-xl shadow-inner shrink-0">
          <button
            onClick={() => setActiveDomain("trade")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeDomain === "trade"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>外贸出海</span>
          </button>
          <button
            onClick={() => setActiveDomain("devops")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeDomain === "devops"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>研发 DevOps</span>
          </button>
          <button
            onClick={() => setActiveDomain("finance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeDomain === "finance"
                ? "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>金融风控</span>
          </button>
        </div>

        {/* Right: Simulation trigger & View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile list view toggle */}
          <button
            onClick={() => setViewMode(viewMode === "canvas" ? "list" : "canvas")}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold"
            title="切换视图"
          >
            {viewMode === "canvas" ? "卡片流" : "架构图"}
          </button>

          {/* Quick Simulation Trigger */}
          <button
            disabled={isSimulating}
            onClick={handleRunSimulation}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
              isSimulating
                ? "bg-amber-600/80 cursor-not-allowed animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50"
            }`}
            title="模拟触发一次全链路 AI 协同流转"
          >
            {isSimulating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
                <span className="hidden sm:inline">协同流转中...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">模拟全流转</span>
                <span className="sm:hidden">模拟</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Simulation Banner overlay if active */}
      {isSimulating && simulationStep && (
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900/90 border-b border-indigo-500/40 px-4 py-2 flex items-center justify-between text-xs text-indigo-100 z-30 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            <span className="font-mono font-semibold">{simulationStep}</span>
          </div>
          <span className="text-[10px] font-mono bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 border border-indigo-700">
            Gemini 3.7 Flash Engine · Active
          </span>
        </div>
      )}

      {/* 3. Main View Area (Canvas for Desktop, Card Stream for Mobile option) */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* =========================================================================
            3A. Canvas View (Desktop & Tablet Interactive Canvas)
           ========================================================================= */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`flex-1 w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950 ${
            viewMode === "list" ? "hidden md:block" : "block"
          }`}
          style={{
            backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        >
          {/* Canvas Floating Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => handleZoom(0.1)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-800 mx-0.5" />
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="重置视图"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Minimap Plugin in Bottom-Left Corner */}
          <div className="absolute bottom-4 left-4 z-30 hidden sm:flex flex-col gap-2 select-none">
            {isMinimapExpanded ? (
              <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl p-3 shadow-2xl shadow-slate-950/80 w-[284px] text-xs transition-all animate-in fade-in zoom-in-95 duration-150">
                {/* Minimap Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/90">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                      <Compass className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="font-bold text-white text-[11px] tracking-tight">
                      实时架构迷你地图
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleFitAll}
                      className="px-1.5 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors text-[10px] font-mono flex items-center gap-1"
                      title="全景适配 (Fit All)"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>全景</span>
                    </button>
                    <button
                      onClick={handleFocusSelected}
                      className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                      title="聚焦定位节点"
                    >
                      <Target className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setIsMinimapExpanded(false)}
                      className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="收起迷你地图"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SVG Minimap Canvas */}
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-inner group">
                  <svg
                    ref={minimapRef}
                    width={mapWidth}
                    height={mapHeight}
                    onClick={handleMinimapClick}
                    className="cursor-crosshair w-full block"
                  >
                    {/* Grid lines background */}
                    <pattern id="miniGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                    <rect width={mapWidth} height={mapHeight} fill="url(#miniGrid)" />

                    {/* Department Region Boxes */}
                    {config.departments.map((dept) => {
                      const dx = toMiniX(dept.x);
                      const dy = toMiniY(dept.y);
                      const dw = dept.width * scaleX;
                      const dh = dept.height * scaleY;
                      const isHovered = minimapHoverDeptId === dept.id;

                      return (
                        <g key={`mini_dept_${dept.id}`}>
                          <rect
                            x={dx}
                            y={dy}
                            width={dw}
                            height={dh}
                            rx="4"
                            fill={dept.color}
                            fillOpacity={isHovered ? 0.35 : 0.12}
                            stroke={dept.color}
                            strokeWidth={isHovered ? 1.5 : 0.8}
                            strokeDasharray="3 2"
                            className="transition-all duration-200"
                          />
                          <text
                            x={dx + 4}
                            y={dy + 9}
                            fill={dept.color}
                            fontSize="6.5"
                            fontWeight="bold"
                            opacity={0.85}
                          >
                            {dept.name.slice(0, 5)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Mini Connection Lines */}
                    {config.connections.map((conn) => {
                      const fromNode =
                        config.agents.find((a) => a.id === conn.fromId) ||
                        config.dataNodes.find((d) => d.id === conn.fromId);
                      const toNode =
                        config.agents.find((a) => a.id === conn.toId) ||
                        config.dataNodes.find((d) => d.id === conn.toId);

                      if (!fromNode || !toNode) return null;

                      const sx = toMiniX(fromNode.x + 100);
                      const sy = toMiniY(fromNode.y + 40);
                      const ex = toMiniX(toNode.x + 100);
                      const ey = toMiniY(toNode.y + 40);

                      return (
                        <line
                          key={`mini_conn_${conn.id}`}
                          x1={sx}
                          y1={sy}
                          x2={ex}
                          y2={ey}
                          stroke={conn.color || "#475569"}
                          strokeWidth="0.8"
                          strokeOpacity={0.6}
                        />
                      );
                    })}

                    {/* Mini Data Nodes */}
                    {config.dataNodes.map((dataNode) => {
                      const nx = toMiniX(dataNode.x);
                      const ny = toMiniY(dataNode.y);
                      const nw = Math.max(12, 176 * scaleX);
                      const nh = Math.max(7, 60 * scaleY);
                      const isSelected = selectedDataNode?.id === dataNode.id;

                      return (
                        <rect
                          key={`mini_data_${dataNode.id}`}
                          x={nx}
                          y={ny}
                          width={nw}
                          height={nh}
                          rx="2"
                          fill={isSelected ? "#06b6d4" : "#0f766e"}
                          stroke={isSelected ? "#22d3ee" : "#14b8a6"}
                          strokeWidth={isSelected ? 1.5 : 0.5}
                          opacity={isSelected ? 1 : 0.8}
                        />
                      );
                    })}

                    {/* Mini Agent Nodes */}
                    {config.agents.map((agent) => {
                      const ax = toMiniX(agent.x);
                      const ay = toMiniY(agent.y);
                      const aw = Math.max(14, 256 * scaleX);
                      const ah = Math.max(8, 120 * scaleY);
                      const isSelected = selectedAgent?.id === agent.id;

                      return (
                        <g key={`mini_agent_${agent.id}`}>
                          <rect
                            x={ax}
                            y={ay}
                            width={aw}
                            height={ah}
                            rx="3"
                            fill={isSelected ? "#6366f1" : "#312e81"}
                            stroke={isSelected ? "#818cf8" : "#4f46e5"}
                            strokeWidth={isSelected ? 1.5 : 0.6}
                            opacity={isSelected ? 1 : 0.9}
                          />
                          {isSelected && (
                            <circle
                              cx={ax + aw / 2}
                              cy={ay + ah / 2}
                              r="3.5"
                              fill="#38bdf8"
                              className="animate-ping"
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Active Viewport Indicator Rect (Interactive Drag & Visual Frame) */}
                    <rect
                      x={miniVx}
                      y={miniVy}
                      width={miniVw}
                      height={miniVh}
                      rx="3"
                      fill="#06b6d4"
                      fillOpacity={isMinimapDragging ? 0.25 : 0.15}
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      onMouseDown={handleMinimapMouseDown}
                      className="cursor-move filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                    />
                  </svg>

                  {/* Floating Hint Overlay on hover */}
                  <div className="absolute top-1 right-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono text-cyan-300 bg-slate-900/90 px-1 py-0.5 rounded border border-slate-700">
                    点击/拖拽定位
                  </div>
                </div>

                {/* Quick Jump Department Pills */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                      快速定位部门
                    </span>
                    <span className="text-slate-500">
                      {Math.round(zoom * 100)}% 视口
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {config.departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => handleJumpToDepartment(dept)}
                        onMouseEnter={() => setMinimapHoverDeptId(dept.id)}
                        onMouseLeave={() => setMinimapHoverDeptId(null)}
                        className="px-1.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-[10px] text-slate-300 hover:text-white truncate text-center font-medium transition-colors"
                        title={`一键跳转并定位到: ${dept.name}`}
                      >
                        {dept.name.slice(0, 4)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats Summary line */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-2 mt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {config.agents.length} AI角色
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-2.5 h-2.5 text-cyan-400" />
                    {config.dataNodes.length} 数据节点
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    {config.connections.length} 流转线
                  </span>
                </div>
              </div>
            ) : (
              /* Collapsed Compact Launcher Badge */
              <button
                onClick={() => setIsMinimapExpanded(true)}
                className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-850 backdrop-blur-xl border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl text-xs text-slate-200 hover:text-white transition-all group"
                title="展开架构迷你地图"
              >
                <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
                <span className="font-semibold text-xs">架构迷你地图</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {Math.round(zoom * 100)}%
                </span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </button>
            )}
          </div>

          {/* Transformable Canvas Stage */}
          <div
            className="w-full h-full absolute inset-0 origin-top-left transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* SVG Connecting Lines */}
            <svg className="absolute inset-0 w-[2000px] h-[1200px] pointer-events-none z-10">
              <defs>
                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                </linearGradient>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#6366f1" />
                </marker>
              </defs>

              {config.connections.map((conn) => {
                // Find node coordinates
                const fromNode =
                  config.agents.find((a) => a.id === conn.fromId) ||
                  config.dataNodes.find((d) => d.id === conn.fromId);
                const toNode =
                  config.agents.find((a) => a.id === conn.toId) ||
                  config.dataNodes.find((d) => d.id === conn.toId);

                if (!fromNode || !toNode) return null;

                const startX = fromNode.x + 130;
                const startY = fromNode.y + 40;
                const endX = toNode.x + 130;
                const endY = toNode.y + 40;

                const midX = (startX + endX) / 2;
                const pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                return (
                  <g key={conn.id} className="cursor-pointer pointer-events-auto group">
                    <path
                      d={pathD}
                      fill="none"
                      stroke={conn.color || "#475569"}
                      strokeWidth="2"
                      strokeDasharray={conn.animated ? "6,4" : undefined}
                      className={conn.animated ? "animate-[dash_1.5s_linear_infinite]" : ""}
                      opacity={0.7}
                    />
                    {/* Label Badge */}
                    <rect
                      x={(startX + endX) / 2 - 36}
                      y={(startY + endY) / 2 - 10}
                      width="72"
                      height="20"
                      rx="6"
                      fill="#0f172a"
                      stroke={conn.color || "#334155"}
                      strokeWidth="1"
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 + 3}
                      fill="#cbd5e1"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      {conn.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Department Containers */}
            {config.departments.map((dept) => (
              <div
                key={dept.id}
                style={{
                  left: `${dept.x}px`,
                  top: `${dept.y}px`,
                  width: `${dept.width}px`,
                  height: `${dept.height}px`,
                }}
                className={`absolute rounded-3xl border ${dept.borderColor} bg-gradient-to-b ${dept.bgGradient} p-5 shadow-2xl backdrop-blur-sm pointer-events-none`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                      {dept.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {dept.englishName}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-400 border border-slate-800">
                    Dept Space
                  </span>
                </div>
              </div>
            ))}

            {/* AI Agent Role Nodes */}
            {config.agents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setSelectedDataNode(null);
                  }}
                  style={{
                    left: `${agent.x}px`,
                    top: `${agent.y}px`,
                  }}
                  className={`absolute w-64 rounded-2xl p-3.5 transition-all cursor-pointer z-20 border shadow-xl ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-950/60 scale-105"
                      : "bg-slate-900/90 hover:bg-slate-900 border-slate-700/80 hover:border-slate-600 hover:scale-102"
                  }`}
                >
                  {/* Top Bar: Avatar, Name & Trigger Schedule */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner shrink-0">
                        {agent.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                          <span>{agent.name}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {agent.role}
                        </div>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 shrink-0">
                      {agent.model.includes("flash") ? "Flash 3.7" : agent.model}
                    </span>
                  </div>

                  {/* Schedule rule */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300 font-mono">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {agent.schedule}
                    </span>
                    <span className="text-slate-500">{agent.lastTriggered}</span>
                  </div>

                  {/* Description preview */}
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>
                </div>
              );
            })}

            {/* Data & Card Nodes */}
            {config.dataNodes.map((dataNode) => {
              const isSelected = selectedDataNode?.id === dataNode.id;
              return (
                <div
                  key={dataNode.id}
                  onClick={() => {
                    setSelectedDataNode(dataNode);
                    setSelectedAgent(null);
                  }}
                  style={{
                    left: `${dataNode.x}px`,
                    top: `${dataNode.y}px`,
                  }}
                  className={`absolute w-44 rounded-2xl p-3 transition-all cursor-pointer z-20 border shadow-lg ${
                    isSelected
                      ? "bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/40 shadow-cyan-950/60 scale-105"
                      : "bg-slate-950/95 hover:bg-slate-900 border-slate-800 hover:border-slate-700 hover:scale-102"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {renderDataIcon(dataNode.iconName)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">
                          {dataNode.name}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {dataNode.recordCount} 条记录 · v{dataNode.version}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="text-cyan-400">{dataNode.category}</span>
                    <span>{dataNode.updatedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            3B. Mobile Card Stream (< 768px List View)
           ========================================================================= */}
        <div
          className={`flex-1 overflow-y-auto p-4 space-y-4 md:hidden ${
            viewMode === "canvas" ? "hidden" : "block"
          }`}
        >
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1">
            <h2 className="font-bold text-white flex items-center gap-1.5">
              <span>{config.title}</span>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">
                手机纵向卡片流
              </span>
            </h2>
            <p className="text-slate-400">{config.subtitle}</p>
          </div>

          {/* Departments Groups */}
          {config.departments.map((dept) => {
            const deptAgents = config.agents.filter((a) => a.departmentId === dept.id);
            const deptDataNodes = config.dataNodes.filter((d) => d.departmentId === dept.id);

            return (
              <div
                key={dept.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    {dept.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {dept.englishName}
                  </span>
                </div>

                {/* AI Agents in this Department */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    AI 角色团队
                  </div>
                  {deptAgents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{agent.avatar}</span>
                          <div>
                            <div className="font-bold text-xs text-white">{agent.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {agent.role}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {agent.schedule}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {agent.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Data Cards in this Department */}
                {deptDataNodes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      关联数据与单据
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {deptDataNodes.map((dataNode) => (
                        <div
                          key={dataNode.id}
                          onClick={() => setSelectedDataNode(dataNode)}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer"
                        >
                          <div className="font-semibold text-xs text-white truncate">
                            {dataNode.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            {dataNode.recordCount} 条 · {dataNode.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            4. Selected Node Inspector Drawer (Right Side)
           ========================================================================= */}
        {selectedAgent && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-sm">
                  {selectedAgent.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{selectedAgent.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedAgent.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Trigger Info */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    触发时机
                  </span>
                  <span className="text-white font-semibold">{selectedAgent.schedule}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    绑定模型
                  </span>
                  <span className="text-indigo-300 font-mono">{selectedAgent.model}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  岗位职责与行为描述
                </label>
                <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedAgent.description}
                </p>
              </div>

              {/* SOP Execution Steps */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>标准化 SOP 流水线步骤</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Deterministic</span>
                </label>
                <div className="space-y-1.5">
                  {selectedAgent.sopSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200 font-mono text-[11px]"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (onNavigateToAgent) onNavigateToAgent(selectedAgent.id);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950/50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>进入 Agent Studio 调试</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected Data Node Drawer */}
        {selectedDataNode && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {renderDataIcon(selectedDataNode.iconName)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedDataNode.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedDataNode.category} · v{selectedDataNode.version} 乐观锁
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDataNode(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>总记录条数</span>
                  <span className="text-white font-bold">{selectedDataNode.recordCount} Items</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>最近写入时间</span>
                  <span className="text-cyan-300">{selectedDataNode.updatedAt}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  动态 Schema 字段契约
                </label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  {selectedDataNode.sampleFields.map((field) => (
                    <div key={field} className="flex items-center justify-between text-slate-300">
                      <span className="text-indigo-400">{field}</span>
                      <span className="text-slate-500">jsonb_column</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (onNavigateToModule) onNavigateToModule();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/50 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>进入业务工作空间查看详情</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
