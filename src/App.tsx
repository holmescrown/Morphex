// MODIFIED: Updated App to route System Flow Canvas, Workspace Chat, Approvals & Cards losslessly
import React, { useState, useEffect } from "react";
import { AppShell, ShellTab, EXPERT_ONLY_TABS } from "./components/AppShell.tsx";
import { SystemFlowCanvas } from "./components/SystemFlowCanvas.tsx";
import { QuickStartWizard, QuickStartScenarioId } from "./components/QuickStartWizard.tsx";
import { WorkspaceChatView } from "./components/WorkspaceChatView.tsx";
import { WorkspaceCardsView, CardViewCategory } from "./components/WorkspaceCardsView.tsx";
import { WorkflowCanvas } from "./components/WorkflowCanvas.tsx";
import { NodeInspector } from "./components/NodeInspector.tsx";
import { ExecutionDrawer } from "./components/ExecutionDrawer.tsx";
import { AgentStudio } from "./components/AgentStudio.tsx";
import { KnowledgeManager } from "./components/KnowledgeManager.tsx";
import { ToolManager } from "./components/ToolManager.tsx";
import { ExecutionHistory } from "./components/ExecutionHistory.tsx";
import { TemplatesModal } from "./components/TemplatesModal.tsx";
import { DynamicModulesView } from "./components/DynamicModulesView.tsx";
import { AutomationTasksView } from "./components/AutomationTasksView.tsx";
import { ComponentHubView, HubAsset } from "./components/ComponentHubView.tsx";
import { McpMarketplaceView } from "./components/McpMarketplaceView.tsx";
import { PublicApisAggregatorView } from "./components/PublicApisAggregatorView.tsx";
import { WorkspaceChatDrawer } from "./components/WorkspaceChatDrawer.tsx";
import { McpSkillsView } from "./components/McpSkillsView.tsx";
import { FieldMigrationView } from "./components/FieldMigrationView.tsx";
import { JsonbConcurrencyView } from "./components/JsonbConcurrencyView.tsx";
import { DdlContractView } from "./components/DdlContractView.tsx";
import { useModeStore } from "./store/modeStore.ts";
import {
  Workflow,
  Agent,
  ToolDefinition,
  KnowledgeBase,
  KnowledgeDoc,
  ExecutionTask,
  NodeExecutionResult,
} from "./types/schemas.ts";
import {
  INITIAL_WORKFLOWS,
  INITIAL_AGENTS,
  INITIAL_TOOLS,
  INITIAL_KNOWLEDGE_BASES,
  INITIAL_KNOWLEDGE_DOCS,
  INITIAL_EXECUTIONS,
} from "./lib/store.ts";
import { executeWorkflow } from "./lib/engine.ts";

export default function App() {
  const { isExpertMode } = useModeStore();

  // Navigation State: 默认核心首页为“系统架构图画布 (System Flow Canvas)”
  const [activeTab, setActiveTab] = useState<ShellTab>("architecture");

  // 严格路由守卫：业务模式下禁止进入专家专属路由
  useEffect(() => {
    if (!isExpertMode && EXPERT_ONLY_TABS.includes(activeTab)) {
      setActiveTab("architecture");
    }
  }, [isExpertMode, activeTab]);

  // Core Data Collections
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [tools, setTools] = useState<ToolDefinition[]>(INITIAL_TOOLS);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(INITIAL_KNOWLEDGE_BASES);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(INITIAL_KNOWLEDGE_DOCS);
  const [executions, setExecutions] = useState<ExecutionTask[]>(INITIAL_EXECUTIONS);

  // Workflow Editor State
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string>(
    INITIAL_WORKFLOWS[0]?.id || ""
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Execution & Telemetry State
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecutionTask, setCurrentExecutionTask] = useState<ExecutionTask | null>(
    INITIAL_EXECUTIONS[0] || null
  );
  const [nodeExecutionResults, setNodeExecutionResults] = useState<
    Record<string, NodeExecutionResult>
  >(INITIAL_EXECUTIONS[0]?.nodeResults || {});
  const [isExecutionDrawerOpen, setIsExecutionDrawerOpen] = useState(false);

  // Templates Modal
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const currentWorkflow =
    workflows.find((w) => w.id === currentWorkflowId) || workflows[0];
  const selectedNode =
    currentWorkflow?.nodes.find((n) => n.id === selectedNodeId) || null;

  // Workflow update handlers
  const handleUpdateWorkflow = (updated: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  };

  const handleUpdateNode = (updatedNode: Workflow["nodes"][0]) => {
    if (!currentWorkflow) return;
    const updatedNodes = currentWorkflow.nodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    );
    handleUpdateWorkflow({
      ...currentWorkflow,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    });
  };

  // Agent handlers
  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a))
    );
  };

  const handleCreateAgent = () => {
    const id = "agent_" + Math.random().toString(36).substring(2, 8);
    const newAgent: Agent = {
      id,
      name: "新上岗 AI 员工",
      description: "跨领域自动化与协同分析助手",
      avatar: "⚡",
      category: "General",
      isPublished: true,
      modelConfig: {
        model: "gemini-3.7-flash",
        provider: "google",
        temperature: 0.2,
        maxTokens: 2048,
        topP: 0.95,
        systemPrompt: "你是一个专业的智能 Agent 助手，高效协助团队处理流程自动化与协同决策。",
      },
      promptTemplate: "{{user_input}}",
      tools: ["calculator", "json_formatter"],
      knowledgeBases: ["kb_enterprise_policies"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAgents((prev) => [...prev, newAgent]);
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  // Fork asset from Component Hub
  const handleForkAsset = (asset: HubAsset) => {
    if (asset.type === "agent") {
      const newAgent: Agent = {
        id: "agent_fork_" + Math.random().toString(36).substring(2, 8),
        name: `${asset.title} (Fork)`,
        description: asset.description,
        avatar: asset.author.avatar || "🤖",
        category: asset.domain,
        isPublished: true,
        modelConfig: {
          model: "gemini-3.7-flash",
          provider: "google",
          temperature: 0.2,
          maxTokens: 2048,
          topP: 0.95,
          systemPrompt: `你是基于【${asset.title}】的专业 AI 员工。`,
        },
        promptTemplate: "{{user_input}}",
        tools: ["calculator", "json_formatter"],
        knowledgeBases: ["kb_enterprise_policies"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAgents((prev) => [newAgent, ...prev]);
    }
  };

  // Execute Workflow Runner
  const handleExecuteWorkflow = async (inputs: Record<string, unknown>) => {
    if (!currentWorkflow || isExecuting) return;

    setIsExecuting(true);
    setIsExecutionDrawerOpen(true);
    setNodeExecutionResults({});

    const toolMap: Record<string, ToolDefinition> = {};
    tools.forEach((t) => {
      toolMap[t.id] = t;
    });

    const kbMap: Record<string, KnowledgeBase> = {};
    knowledgeBases.forEach((kb) => {
      kbMap[kb.id] = kb;
    });

    try {
      const task = await executeWorkflow(currentWorkflow, inputs, {
        tools: toolMap,
        knowledgeBases: kbMap,
        knowledgeDocs,
        onTraceUpdate: (event) => {
          setCurrentExecutionTask((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              traceEvents: [...prev.traceEvents, event],
            };
          });
        },
        onNodeStatusChange: (nodeId, result) => {
          setNodeExecutionResults((prev) => ({
            ...prev,
            [nodeId]: result,
          }));
        },
      });

      setCurrentExecutionTask(task);
      setExecutions((prev) => [task, ...prev]);
    } catch (err: unknown) {
      console.error("Execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Helper to check if activeTab is a Card Category
  const isCardCategory = (
    tab: ShellTab
  ): tab is CardViewCategory => {
    const cardTabs: ShellTab[] = [
      "approvals",
      "calendar",
      "today",
      "assigned",
      "inbox",
      "followups",
      "quick_notes",
      "shared_notes",
      "interaction_reports",
      "marketing_strategies",
      "customers",
      "quotes",
      "products",
      "pi_management",
      "production_orders",
      "payments",
    ];
    return cardTabs.includes(tab);
  };

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedWorkflowName={activeTab === "workflows" ? currentWorkflow?.name : undefined}
      onQuickRun={() => {
        if (isExpertMode) {
          if (activeTab !== "workflows") {
            setActiveTab("workflows");
          }
          setIsExecutionDrawerOpen(true);
        }
      }}
      onOpenTemplates={() => {
        if (isExpertMode) {
          setIsTemplatesModalOpen(true);
        }
      }}
      isExecuting={isExecuting}
    >
      {/* 1. 核心视图: 系统架构图画布 (System Flow Canvas) 与 顶部新手向导 (QuickStartWizard) */}
      {(activeTab === "architecture" ||
        activeTab === "trade_company" ||
        activeTab === "devops_dept" ||
        activeTab === "finance_dept") && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Quick Start Onboarding Ribbon directly above canvas */}
          <div className="p-3 sm:p-4 pb-0 shrink-0 z-20">
            <QuickStartWizard
              onSelectScenario={(scenarioId: QuickStartScenarioId) => {
                if (scenarioId === "lead_scoring") {
                  // 场景 1：「商机与询盘自动评分」 -> 导航至商机任务 / AI员工中心
                  setActiveTab("today");
                } else if (scenarioId === "finance_hitl") {
                  // 场景 2：「财务合规与资金审批拦截」 -> 直接跳转至包含 HITL 审批拦截的任务视图
                  setActiveTab("approvals");
                } else if (scenarioId === "rag_qa") {
                  // 场景 3：「企业知识库 RAG 问答」 -> 直接跳转至带有预置文档的 Agent 问答界面
                  setActiveTab("knowledge");
                }
              }}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <SystemFlowCanvas
              onNavigateToAgent={(agentId) => {
                setActiveTab("agents");
              }}
              onNavigateToModule={() => {
                setActiveTab("modules");
              }}
              onOpenChat={() => {
                setActiveTab("chat");
              }}
              onNavigateToTab={(tab) => {
                setActiveTab(tab as any);
              }}
              onSelectQuickScenario={(scenarioId: QuickStartScenarioId) => {
                if (scenarioId === "lead_scoring") {
                  // 场景 1：「商机与询盘自动评分」 -> 导航至商机任务 / AI员工中心
                  setActiveTab("today");
                } else if (scenarioId === "finance_hitl") {
                  // 场景 2：「财务合规与资金审批拦截」 -> 直接跳转至包含 HITL 审批拦截的任务视图
                  setActiveTab("approvals");
                } else if (scenarioId === "rag_qa") {
                  // 场景 3：「企业知识库 RAG 问答」 -> 直接跳转至带有预置文档的 Agent 问答界面
                  setActiveTab("knowledge");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 2. 工具箱内置即时交流中心 (Workspace Chat) */}
      {activeTab === "chat" && <WorkspaceChatView />}

      {/* 3. 业务卡片、待批阅、行事历与笔记清单视图 (Workspace Cards) */}
      {isCardCategory(activeTab) && (
        <WorkspaceCardsView
          category={activeTab}
          onOpenCanvas={() => setActiveTab("architecture")}
          onOpenChat={() => setActiveTab("chat")}
        />
      )}

      {/* 4. 跨领域动态业务空间 (Universal Modules) */}
      {activeTab === "modules" && <DynamicModulesView />}

      {/* 5. AI 员工配置 (双模自适应: 协同卡片 / 专家参数) */}
      {activeTab === "agents" && (
        <AgentStudio
          agents={agents}
          tools={tools}
          knowledgeBases={knowledgeBases}
          workflows={workflows}
          onUpdateAgent={handleUpdateAgent}
          onCreateAgent={handleCreateAgent}
          onDeleteAgent={handleDeleteAgent}
        />
      )}

      {/* 6. 跨领域公共资产广场 (Universal Components Hub) */}
      {activeTab === "hub" && <ComponentHubView onForkAsset={handleForkAsset} />}

      {/* 7. MCP 官方生态市场 (One-Click Connectors Marketplace) */}
      {activeTab === "mcp_market" && <McpMarketplaceView />}

      {/* 7.5. Public APIs 清洗与垂直聚合 API 引擎 */}
      {activeTab === "public_apis" && (
        <PublicApisAggregatorView
          onRegisterSystemTool={(newTool) => {
            setTools((prev) => [newTool, ...prev.filter((t) => t.id !== newTool.id)]);
          }}
          onNavigateToAgentStudio={() => setActiveTab("agents")}
        />
      )}

      {/* 8. 企业知识库 (RAG) */}
      {activeTab === "knowledge" && (
        <KnowledgeManager
          knowledgeBases={knowledgeBases}
          knowledgeDocs={knowledgeDocs}
          onUpdateKnowledgeBases={setKnowledgeBases}
          onUpdateDocs={setKnowledgeDocs}
        />
      )}

      {/* 9. 自动化任务队列 */}
      {activeTab === "tasks" && <AutomationTasksView />}

      {/* 10. 专家模式: 工作流可视化画布 (DAG 节点连线) */}
      {activeTab === "workflows" && isExpertMode && currentWorkflow && (
        <div className="flex-1 flex w-full h-full overflow-hidden">
          <WorkflowCanvas
            workflow={currentWorkflow}
            onUpdateWorkflow={handleUpdateWorkflow}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            nodeExecutionResults={nodeExecutionResults}
            isExecuting={isExecuting}
          />

          {selectedNode && (
            <NodeInspector
              node={selectedNode}
              workflow={currentWorkflow}
              onUpdateNode={handleUpdateNode}
              onClose={() => setSelectedNodeId(null)}
              tools={tools}
              knowledgeBases={knowledgeBases}
            />
          )}
        </div>
      )}

      {/* 11. 专家模式: MCP 原子技能注册表 */}
      {activeTab === "skills" && isExpertMode && <McpSkillsView />}

      {/* 12. 专家模式: 工具库 */}
      {activeTab === "tools" && isExpertMode && (
        <ToolManager tools={tools} onUpdateTools={setTools} />
      )}

      {/* 13. 专家模式: 字段迁移与容错 */}
      {activeTab === "fields" && isExpertMode && <FieldMigrationView />}

      {/* 14. 专家模式: JSONB 乐观锁并发调试 */}
      {activeTab === "concurrency" && isExpertMode && <JsonbConcurrencyView />}

      {/* 15. 专家模式: 调用遥测与 Token 审计 */}
      {activeTab === "telemetry" && isExpertMode && (
        <ExecutionHistory executions={executions} />
      )}

      {/* 16. 专家模式: DDL 数据契约 */}
      {activeTab === "database" && isExpertMode && <DdlContractView />}

      {/* 全局协同交流与打点评论抽屉 (In-Tool Realtime Collaboration Drawer) */}
      <WorkspaceChatDrawer
        onNavigateToTarget={(targetType) => {
          if (targetType === "agent") setActiveTab("agents");
          else if (targetType === "workflow") {
            if (isExpertMode) setActiveTab("workflows");
            else setActiveTab("hub");
          } else if (targetType === "mcp") {
            setActiveTab("mcp_market");
          }
        }}
      />

      {/* Execution Drawer Modal Overlay */}
      {isExecutionDrawerOpen && currentWorkflow && isExpertMode && (
        <ExecutionDrawer
          workflow={currentWorkflow}
          executionTask={currentExecutionTask}
          isExecuting={isExecuting}
          onExecute={handleExecuteWorkflow}
          onClose={() => setIsExecutionDrawerOpen(false)}
        />
      )}

      {/* Templates Modal */}
      {isTemplatesModalOpen && isExpertMode && (
        <TemplatesModal
          workflows={workflows}
          currentWorkflowId={currentWorkflowId}
          onSelectWorkflow={(id) => {
            setCurrentWorkflowId(id);
            setSelectedNodeId(null);
          }}
          onClose={() => setIsTemplatesModalOpen(false)}
        />
      )}
    </AppShell>
  );
}
