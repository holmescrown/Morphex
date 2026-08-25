import React, { useState, useEffect } from "react";
import { AppShell, ShellTab, EXPERT_ONLY_TABS } from "./components/AppShell.tsx";
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

  // Navigation State: 默认首页为“动态业务模块”，杜绝在小白模式下直接打开底层 DAG 连线画布
  const [activeTab, setActiveTab] = useState<ShellTab>("modules");

  // 严格路由守卫：业务模式下禁止进入专家专属路由
  useEffect(() => {
    if (!isExpertMode && EXPERT_ONLY_TABS.includes(activeTab)) {
      setActiveTab("modules");
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
      description: "负责业务数据自动核对与客户线索分发",
      avatar: "⚡",
      category: "General",
      isPublished: true,
      modelConfig: {
        model: "gemini-3.7-flash",
        provider: "google",
        temperature: 0.2,
        maxTokens: 2048,
        topP: 0.95,
        systemPrompt: "你是一个专业的智能 Agent 助手，高效协助业务人员处理流程自动化。",
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
      {/* 1. 动态业务模块与数据记录 (业务模式默认首页) */}
      {activeTab === "modules" && <DynamicModulesView />}

      {/* 2. AI 员工配置 (双模自适应: 小白轻量卡片 / 专家全量参数) */}
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

      {/* 3. 企业知识库 (RAG) */}
      {activeTab === "knowledge" && (
        <KnowledgeManager
          knowledgeBases={knowledgeBases}
          knowledgeDocs={knowledgeDocs}
          onUpdateKnowledgeBases={setKnowledgeBases}
          onUpdateDocs={setKnowledgeDocs}
        />
      )}

      {/* 4. 自动化任务队列 */}
      {activeTab === "tasks" && <AutomationTasksView />}

      {/* 5. 专家模式: 工作流可视化画布 (DAG 节点连线) */}
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

      {/* 6. 专家模式: MCP 原子技能注册表 */}
      {activeTab === "skills" && isExpertMode && <McpSkillsView />}

      {/* 7. 专家模式: 工具库 */}
      {activeTab === "tools" && isExpertMode && (
        <ToolManager tools={tools} onUpdateTools={setTools} />
      )}

      {/* 8. 专家模式: 字段迁移与容错 */}
      {activeTab === "fields" && isExpertMode && <FieldMigrationView />}

      {/* 9. 专家模式: JSONB 乐观锁并发调试 */}
      {activeTab === "concurrency" && isExpertMode && <JsonbConcurrencyView />}

      {/* 10. 专家模式: 调用遥测与 Token 审计 */}
      {activeTab === "telemetry" && isExpertMode && (
        <ExecutionHistory executions={executions} />
      )}

      {/* 11. 专家模式: DDL 数据契约 */}
      {activeTab === "database" && isExpertMode && <DdlContractView />}

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

