import { create } from "zustand";

export interface WorkspaceMember {
  id: string;
  name: string;
  avatar: string;
  role: "admin" | "engineer" | "operator" | "designer" | "analyst";
  color: string;
  status: "online" | "idle" | "offline";
  currentLocation?: string; // e.g. "Agent: DevOps Assistant", "Workflow: Code Reviewer"
}

export interface ContextComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  targetType: "agent" | "workflow" | "mcp" | "field" | "prompt" | "general";
  targetId?: string;
  targetTitle?: string;
  replies?: Array<{
    id: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
  }>;
}

export interface WorkspaceChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
  annotation?: {
    targetType: "agent" | "workflow" | "mcp" | "field";
    targetId: string;
    targetTitle: string;
  };
  reactions?: Record<string, number>;
}

export interface SharedPlaygroundRun {
  id: string;
  initiatorName: string;
  initiatorAvatar: string;
  targetType: "agent" | "workflow";
  targetName: string;
  inputPrompt: string;
  status: "running" | "completed" | "error";
  outputPreview?: string;
  tokensUsed?: number;
  durationMs?: number;
  timestamp: string;
}

interface CollabState {
  // Members
  activeMembers: WorkspaceMember[];
  currentUser: WorkspaceMember;
  
  // Drawer visibility
  isChatDrawerOpen: boolean;
  toggleChatDrawer: () => void;
  setChatDrawerOpen: (open: boolean) => void;
  
  // Messages & Comments
  messages: WorkspaceChatMessage[];
  addMessage: (text: string, annotation?: WorkspaceChatMessage["annotation"]) => void;
  
  // Real-time Shared Runs
  sharedRuns: SharedPlaygroundRun[];
  addSharedRun: (run: Omit<SharedPlaygroundRun, "id" | "timestamp">) => void;
  updateSharedRun: (id: string, updates: Partial<SharedPlaygroundRun>) => void;
  
  // Comments by Target
  comments: ContextComment[];
  addComment: (comment: Omit<ContextComment, "id" | "timestamp">) => void;
}

const INITIAL_MEMBERS: WorkspaceMember[] = [
  {
    id: "user_me",
    name: "Alex (You)",
    avatar: "👨‍💻",
    role: "engineer",
    color: "#6366f1",
    status: "online",
    currentLocation: "Agent Studio",
  },
  {
    id: "user_sarah",
    name: "Sarah Chen",
    avatar: "👩‍💼",
    role: "designer",
    color: "#ec4899",
    status: "online",
    currentLocation: "Workflow Canvas",
  },
  {
    id: "user_david",
    name: "David Kim",
    avatar: "🧑‍🔬",
    role: "analyst",
    color: "#10b981",
    status: "online",
    currentLocation: "MCP Marketplace",
  },
  {
    id: "user_elena",
    name: "Elena Rostova",
    avatar: "🚀",
    role: "operator",
    color: "#f59e0b",
    status: "idle",
    currentLocation: "Components Hub",
  },
];

const INITIAL_MESSAGES: WorkspaceChatMessage[] = [
  {
    id: "msg_1",
    senderId: "user_sarah",
    senderName: "Sarah Chen",
    senderAvatar: "👩‍💼",
    senderRole: "Product Lead",
    text: "大家注意，我刚才把 GitHub PR 审查流和 Notion 文档同步 MCP 连接器绑定好了，欢迎大家在资产广场一键 Fork 测试！",
    timestamp: "10:14 AM",
    annotation: {
      targetType: "workflow",
      targetId: "wf_devops_review",
      targetTitle: "DevOps 代码与 PR 自动审查流",
    },
  },
  {
    id: "msg_2",
    senderId: "user_david",
    senderName: "David Kim",
    senderAvatar: "🧑‍🔬",
    senderRole: "AI Architect",
    text: "收到！我为财务合规 Agent 增加了审计打点。Prompt 里配置了严格的异常资金拦截规则，并在沙箱里压测通过。",
    timestamp: "10:18 AM",
    annotation: {
      targetType: "agent",
      targetId: "agent_compliance",
      targetTitle: "财务精算与合规审计员",
    },
  },
  {
    id: "msg_3",
    senderId: "user_me",
    senderName: "Alex (You)",
    senderAvatar: "👨‍💻",
    senderRole: "Staff Engineer",
    text: "太棒了，协作测试通道已开启。我们可以随时发起 Multi-Playground 共享联调测试。",
    timestamp: "10:22 AM",
  },
];

const INITIAL_COMMENTS: ContextComment[] = [
  {
    id: "cmt_1",
    authorId: "user_sarah",
    authorName: "Sarah Chen",
    authorAvatar: "👩‍💼",
    content: "建议在 System Prompt 中添加 Markdown 表格总结要求，以便直接推送到 Lark / Slack 频道。",
    timestamp: "10:05 AM",
    targetType: "prompt",
    targetId: "agent_devops_code",
    targetTitle: "DevOps 代码审查助手",
    replies: [
      {
        id: "rep_1",
        authorName: "David Kim",
        authorAvatar: "🧑‍🔬",
        content: "已在最新版本中增加 {{format_table: true}} 约束！",
        timestamp: "10:08 AM",
      },
    ],
  },
  {
    id: "cmt_2",
    authorId: "user_david",
    authorName: "David Kim",
    authorAvatar: "🧑‍🔬",
    content: "这个 MCP 连接器的 OAuth Scope 需要勾选 repo 与 workflow 读写权限，避免出现 403。",
    timestamp: "09:45 AM",
    targetType: "mcp",
    targetId: "mcp_github",
    targetTitle: "GitHub DevOps Connector",
  },
];

const INITIAL_RUNS: SharedPlaygroundRun[] = [
  {
    id: "run_1",
    initiatorName: "Sarah Chen",
    initiatorAvatar: "👩‍💼",
    targetType: "agent",
    targetName: "全栈代码审查与 PR 合规官",
    inputPrompt: "检查 PR #104 中存在未捕获异常的 async await 逻辑...",
    status: "completed",
    outputPreview: "已识别 2 处潜在 UnhandledPromiseRejection，并建议加入 Promise.race 超时保护。",
    tokensUsed: 642,
    durationMs: 920,
    timestamp: "10:20 AM",
  },
];

export const useCollabStore = create<CollabState>((set) => ({
  activeMembers: INITIAL_MEMBERS,
  currentUser: INITIAL_MEMBERS[0],
  isChatDrawerOpen: false,

  toggleChatDrawer: () =>
    set((state) => ({ isChatDrawerOpen: !state.isChatDrawerOpen })),

  setChatDrawerOpen: (open: boolean) => set({ isChatDrawerOpen: open }),

  messages: INITIAL_MESSAGES,
  addMessage: (text: string, annotation?: WorkspaceChatMessage["annotation"]) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: "msg_" + Math.random().toString(36).substring(2, 9),
          senderId: state.currentUser.id,
          senderName: state.currentUser.name,
          senderAvatar: state.currentUser.avatar,
          senderRole: state.currentUser.role,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          annotation,
        },
      ],
    })),

  sharedRuns: INITIAL_RUNS,
  addSharedRun: (run) =>
    set((state) => ({
      sharedRuns: [
        {
          ...run,
          id: "run_" + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...state.sharedRuns,
      ],
    })),

  updateSharedRun: (id, updates) =>
    set((state) => ({
      sharedRuns: state.sharedRuns.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  comments: INITIAL_COMMENTS,
  addComment: (comment) =>
    set((state) => ({
      comments: [
        ...state.comments,
        {
          ...comment,
          id: "cmt_" + Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    })),
}));
