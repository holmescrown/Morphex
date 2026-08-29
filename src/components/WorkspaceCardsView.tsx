// MODIFIED: Added WorkspaceCardsView for CubeLV-style Business Cards, Approvals, Calendar & Notes
import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  Users,
  Search,
  Plus,
  Filter,
  Tag,
  ChevronRight,
  Sparkles,
  Inbox,
  AlertCircle,
  Bookmark,
  Share2,
  Eye,
  Edit2,
  Trash2,
  Building2,
  ShieldCheck,
  TrendingUp,
  Download,
  Send,
} from "lucide-react";

export type CardViewCategory =
  | "approvals"
  | "calendar"
  | "today"
  | "assigned"
  | "inbox"
  | "followups"
  | "quick_notes"
  | "shared_notes"
  | "interaction_reports"
  | "marketing_strategies"
  | "customers"
  | "quotes"
  | "products"
  | "pi_management"
  | "production_orders"
  | "payments";

interface WorkspaceCardsViewProps {
  category: CardViewCategory;
  onOpenCanvas?: () => void;
  onOpenChat?: () => void;
}

const CATEGORY_META: Record<
  CardViewCategory,
  { title: string; subtitle: string; iconName: string; count: number; badge: string }
> = {
  approvals: {
    title: "待批阅与人工确认 (Human Approvals)",
    subtitle: "AI 员工在关键财务、合同与发布节点发起的确认请求",
    iconName: "ShieldCheck",
    count: 4,
    badge: "P0 待办",
  },
  calendar: {
    title: "团队行事历 (Workspace Calendar)",
    subtitle: "AI 定时触发时机、排产交期与跨国买家预约日程",
    iconName: "Calendar",
    count: 12,
    badge: "实时同步",
  },
  today: {
    title: "今日协同清单 (Today's Focus)",
    subtitle: "今日待处理询盘、跟进邮件与自动化流水线审查",
    iconName: "Clock",
    count: 7,
    badge: "今日处理",
  },
  assigned: {
    title: "被指派任务 (Assigned to Me)",
    subtitle: "AI 员工或团队成员根据 SOP 规则分派到您名下的工作项",
    iconName: "Users",
    count: 5,
    badge: "已指派",
  },
  inbox: {
    title: "统一收件匣 (Workspace Inbox)",
    subtitle: "来自海外买家邮件、Webhook 回调与系统报警推送",
    iconName: "Inbox",
    count: 18,
    badge: "收件箱",
  },
  followups: {
    title: "跟进任务池 (Follow-up Tasks)",
    subtitle: "高意向买家未回复自动催办与阶段性回访台账",
    iconName: "Clock",
    count: 9,
    badge: "SOP催办",
  },
  quick_notes: {
    title: "随手记 (Quick Scratchpad)",
    subtitle: "随时记录业务灵感、SOP 流程备忘与临时调试代码",
    iconName: "FileText",
    count: 6,
    badge: "本地草稿",
  },
  shared_notes: {
    title: "团队共享笔记 (Shared Knowledge)",
    subtitle: "全员沉淀的外贸谈判话术、DevOps 排障方案与风控准则",
    iconName: "Share2",
    count: 15,
    badge: "知识库",
  },
  interaction_reports: {
    title: "客户互动报告 (Engagement Reports)",
    subtitle: "互动分析员从邮件、WhatsApp 与 Zoom 提取的意向分析",
    iconName: "Sparkles",
    count: 24,
    badge: "AI 提炼",
  },
  marketing_strategies: {
    title: "行销策略简报 (Marketing Strategy)",
    subtitle: "大宗商品波动模型、阶梯价格折扣与出海投放计划",
    iconName: "TrendingUp",
    count: 8,
    badge: "策略库",
  },
  customers: {
    title: "客户档案库 (Global CRM)",
    subtitle: "海外采购商全生命周期档案、信用评级与采购偏好",
    iconName: "Users",
    count: 1248,
    badge: "CRM 核心",
  },
  quotes: {
    title: "报价追踪看板 (Quotation Tracker)",
    subtitle: "FOB/CIF 报价历史、有效期状态与利润率自动核算",
    iconName: "DollarSign",
    count: 86,
    badge: "报价中",
  },
  products: {
    title: "产品目录与 SKU (Product Catalog)",
    subtitle: "HS Code 海关税则、箱规包装、MOQ 与动态库存数据",
    iconName: "Building2",
    count: 380,
    badge: "SKU 库",
  },
  pi_management: {
    title: "PI 形式发票管理 (Proforma Invoice)",
    subtitle: "国际贸易外销合同、付款方式（TT/LC）与条款归档",
    iconName: "FileText",
    count: 168,
    badge: "合同流",
  },
  production_orders: {
    title: "生产订单管理 (Production Orders)",
    subtitle: "工厂排产派工、原材料备料跟踪与船期订舱排期",
    iconName: "Building2",
    count: 54,
    badge: "履约中",
  },
  payments: {
    title: "收款与水单管理 (Payment & TT Invoices)",
    subtitle: "海外 Swift TT 水单 OCR 匹配、财务入账与汇损核销",
    iconName: "DollarSign",
    count: 420,
    badge: "资金对账",
  },
};

const SAMPLE_DATA: Record<CardViewCategory, Array<Record<string, any>>> = {
  approvals: [
    {
      id: "app_1",
      title: "【外贸PI发票】德国 Bosch 订单 TT 30% 预付款水单金额确认",
      submitter: "收款与水单专员 (Agent)",
      amount: "$142,500.00 USD",
      urgency: "高",
      status: "待批阅",
      date: "10分钟前",
      details: "OCR 水单匹配银行流水一致，差额为中转行手续费 $25，请求放单开工。",
    },
    {
      id: "app_2",
      title: "【DevOps 发布】生产环境 v2.14.0 灰度发布门禁人工放行",
      submitter: "发布与 SRE 巡检哨兵 (Agent)",
      urgency: "中",
      status: "待批阅",
      date: "30分钟前",
      details: "所有单元测试通过，安全扫描无 CVE 漏洞，金丝雀分流 10% 请求确认。",
    },
    {
      id: "app_3",
      title: "【金融风控】OFAC 名单相似度 78% 风险交易人工复核",
      submitter: "反洗钱合规审计员 (Agent)",
      amount: "$58,000.00 EUR",
      urgency: "紧急",
      status: "待批阅",
      date: "1小时前",
      details: "中东某贸易公司汇入款项触发敏感地区跳跃预警，已临时冻结清算流程。",
    },
  ],
  calendar: [
    {
      id: "cal_1",
      title: "欧洲区买家在线洽谈会 (Zoom)",
      time: "今天 15:00 - 16:00",
      attendees: "互动分析员, Alex (You), 采购总监 Miller",
      type: "客户会议",
    },
    {
      id: "cal_2",
      title: "每日 08:30 外贸询盘自动抓取与报告写入",
      time: "工作日 08:30",
      attendees: "互动分析员 (Agent)",
      type: "定时调度",
    },
    {
      id: "cal_3",
      title: "美西集装箱船截关与提单签发确认",
      time: "明天 10:00",
      attendees: "订舱与履约风控员",
      type: "物流节点",
    },
  ],
  today: [
    {
      id: "td_1",
      title: "跟进日本松下采购部关于 3000 件样品箱规的确认信",
      priority: "高",
      due: "14:00",
      source: "跟进专员 (Agent)",
    },
    {
      id: "td_2",
      title: "核验土耳其买家信用证 (L/C) 软条款并反馈修改意见",
      priority: "高",
      due: "17:30",
      source: "订舱与履约风控员",
    },
    {
      id: "td_3",
      title: "审核 PR #108 修复 JSONB 乐观锁版本号校验边界条件",
      priority: "中",
      due: "18:00",
      source: "PR 代码审查员",
    },
  ],
  assigned: [
    {
      id: "as_1",
      title: "为 5 个核心外贸买家配置定制化 FOB 阶梯折扣公式",
      assignedBy: "Sarah Chen",
      status: "进行中",
      tag: "定价模型",
    },
    {
      id: "as_2",
      title: "更新 Notion 与 Slack MCP 连接器的 Webhook 秘钥",
      assignedBy: "David Kim",
      status: "待处理",
      tag: "MCP 集成",
    },
  ],
  inbox: [
    {
      id: "in_1",
      title: "收到新询盘: Inquiry for 50,000pcs Industrial Sensors",
      from: "Liam O'Connor (UK Global Ltd)",
      time: "15分钟前",
      unread: true,
      tag: "高意向",
    },
    {
      id: "in_2",
      title: "GitHub Webhook: Pull Request #112 已发起代码审查",
      from: "bot-github-mcp",
      time: "40分钟前",
      unread: false,
      tag: "DevOps",
    },
  ],
  followups: [
    {
      id: "fl_1",
      title: "墨西哥 ABC Corp 未回复报价邮件已满 3 天，触发第 2 轮催办",
      contact: "Carlos Mendoza",
      lastContact: "3天前",
      status: "AI 草稿已生成",
    },
    {
      id: "fl_2",
      title: "沙特能源客户样品已妥投，提醒测试报告确认",
      contact: "Tariq Al-Mansoor",
      lastContact: "昨天",
      status: "待人工审核发送",
    },
  ],
  quick_notes: [
    {
      id: "qn_1",
      title: "外贸报价大宗海运费上涨应对策略",
      snippet: "若美线运费突破 $4500/FEU，统一建议客户转为 CIF 到港并加收 5% 缓冲金...",
      updated: "1小时前",
    },
    {
      id: "qn_2",
      title: "MCP JSON-RPC 2.0 批量请求并发压测备忘",
      snippet: "在 Server 端增加 Semaphore 信号量，限制单 Agent 最大并发数为 16...",
      updated: "昨天",
    },
  ],
  shared_notes: [
    {
      id: "sn_1",
      title: "2026 全球出海展会买家背景调查与痛点全集",
      author: "Sarah Chen",
      views: 342,
      updated: "2天前",
    },
    {
      id: "sn_2",
      title: "企业私有大模型与 Gemini 3.7 Flash 混合编排最佳实践",
      author: "Alex (You)",
      views: 512,
      updated: "3天前",
    },
  ],
  interaction_reports: [
    {
      id: "ir_1",
      title: "英国 BioMed 采购总监 10 万件耗材需求深度分析",
      agent: "互动分析员",
      intentScore: 94,
      keywords: ["急需交期", "CE认证", "TT付款"],
      date: "今天 09:15",
    },
    {
      id: "ir_2",
      title: "阿联酋 Horizon 贸易公司年度框架协议意向",
      agent: "互动分析员",
      intentScore: 88,
      keywords: ["独家代理", "阶梯折扣", "迪拜中转"],
      date: "昨天 16:40",
    },
  ],
  marketing_strategies: [
    {
      id: "ms_1",
      title: "Q3 工业元器件欧洲市场 FOB 报价矩阵与返点方案",
      author: "行销策略分析员",
      effectDate: "2026-09-01 至 2026-12-31",
      margin: "28.5%",
    },
  ],
  customers: [
    {
      id: "c_1",
      name: "Global Tech Logistics LLC",
      country: "🇺🇸 美国",
      volume: "$2,400,000 / 年",
      credit: "AAA",
      contact: "John Doe",
    },
    {
      id: "c_2",
      name: "Nordic Automation AS",
      country: "🇳🇴 挪威",
      volume: "$850,000 / 年",
      credit: "AA",
      contact: "Astrid Lindgren",
    },
    {
      id: "c_3",
      name: "Tokyo Precision Ltd",
      country: "🇯🇵 日本",
      volume: "$1,200,000 / 年",
      credit: "AAA",
      contact: "Kenji Sato",
    },
  ],
  quotes: [
    {
      id: "q_1",
      quoteNo: "QT-2026-0881",
      customer: "Global Tech Logistics LLC",
      totalUsd: "$68,400.00",
      status: "客户审查中",
      validUntil: "2026-09-15",
    },
  ],
  products: [
    {
      id: "p_1",
      sku: "SKU-SENS-800X",
      name: "高精度工业温湿度变送器",
      hsCode: "9025.80.00",
      fobPrice: "$42.50 / 件",
      stock: "1,200 件",
    },
    {
      id: "p_2",
      sku: "SKU-VALVE-300B",
      name: "不锈钢气动控制阀门",
      hsCode: "8481.80.40",
      fobPrice: "$128.00 / 件",
      stock: "450 件",
    },
  ],
  pi_management: [
    {
      id: "pi_1",
      piNo: "PI-2026-EU092",
      customer: "Nordic Automation AS",
      amount: "$45,200.00 USD",
      paymentTerm: "30% TT 订金, 70% 见提单副本",
      status: "已签章确认",
    },
  ],
  production_orders: [
    {
      id: "po_1",
      orderNo: "PO-MFG-2026-104",
      item: "工业温湿度变送器 x 1000",
      factory: "无锡智能制造一厂",
      progress: "80% (组装中)",
      estShipDate: "2026-09-08",
    },
  ],
  payments: [
    {
      id: "pay_1",
      refNo: "TT-SWIFT-991204",
      payer: "Global Tech Logistics LLC",
      amountUsd: "$20,520.00",
      settledAt: "今天 10:14",
      status: "已核销到账",
    },
  ],
};

export const WorkspaceCardsView: React.FC<WorkspaceCardsViewProps> = ({
  category,
  onOpenCanvas,
  onOpenChat,
}) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.customers;
  const dataList = SAMPLE_DATA[category] || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredData = dataList.filter((item) => {
    const text = JSON.stringify(item).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate">
                {meta.title}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                {meta.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden xs:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenCanvas && (
            <button
              onClick={onOpenCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              title="切换至系统架构图画布查看全链路流转"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">架构图画布</span>
            </button>
          )}

          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-950/50 transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">新增条目</span>
            <span className="sm:hidden">新增</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="在当前卡片库中快速检索记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>共找到 <strong className="text-white">{filteredData.length}</strong> 条记录</span>
        </div>
      </div>

      {/* 3. Cards Grid / List Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Bookmark className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">暂无匹配的业务卡片记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredData.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-md transition-all space-y-3 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1">
                      <span>#{item.id || `REC-${index + 1}`}</span>
                      {item.urgency && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {item.urgency}
                        </span>
                      )}
                      {item.status && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          {item.status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-xs text-white leading-snug group-hover:text-indigo-300 transition-colors">
                      {item.title || item.name || item.quoteNo || item.piNo || item.orderNo || item.refNo}
                    </h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="text-xs text-slate-300 space-y-1.5">
                  {item.details && (
                    <p className="text-slate-400 text-[11px] leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      {item.details}
                    </p>
                  )}
                  {item.amount && (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">金额:</span>
                      <span className="font-bold text-emerald-400 text-xs">{item.amount}</span>
                    </div>
                  )}
                  {item.country && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">地区:</span>
                      <span className="text-slate-200">{item.country}</span>
                    </div>
                  )}
                  {item.volume && (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">年度采购量:</span>
                      <span className="text-indigo-300">{item.volume}</span>
                    </div>
                  )}
                  {item.fobPrice && (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">FOB 报价:</span>
                      <span className="text-cyan-300 font-bold">{item.fobPrice}</span>
                    </div>
                  )}
                  {item.time && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>时间:</span>
                      <span className="text-slate-300">{item.time}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.date || item.updated || item.lastContact || "刚刚"}</span>
                  <div className="flex items-center gap-1.5">
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
