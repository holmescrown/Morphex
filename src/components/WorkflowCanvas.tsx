import React, { useState, useRef, useEffect } from "react";
import {
  Workflow,
  WorkflowNode,
  NodeType,
  NodeExecutionResult,
} from "../types/schemas.ts";
import {
  Play,
  Bot,
  Code2,
  GitBranch,
  Globe,
  Wrench,
  Database,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface WorkflowCanvasProps {
  workflow: Workflow;
  onUpdateWorkflow: (updated: Workflow) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  nodeExecutionResults: Record<string, NodeExecutionResult>;
  isExecuting?: boolean;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onUpdateWorkflow,
  selectedNodeId,
  onSelectNode,
  nodeExecutionResults,
  isExecuting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connection dragging state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [connectingHandle, setConnectingHandle] = useState<string | undefined>(undefined);

  // Add node dropdown
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Pan canvas handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      const newX = (e.clientX - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - pan.y) / zoom - dragOffset.y;

      const updatedNodes = workflow.nodes.map((node) => {
        if (node.id === draggingNodeId) {
          return {
            ...node,
            position: {
              x: Math.round(newX / 10) * 10,
              y: Math.round(newY / 10) * 10,
            },
          };
        }
        return node;
      });

      onUpdateWorkflow({
        ...workflow,
        nodes: updatedNodes,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setConnectingSourceId(null);
  };

  // Node Dragging Start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onSelectNode(nodeId);

    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - node.position.x,
      y: (e.clientY - pan.y) / zoom - node.position.y,
    });
  };

  // Node Deletion
  const handleDeleteNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const updatedNodes = workflow.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = workflow.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    onUpdateWorkflow({
      ...workflow,
      nodes: updatedNodes,
      edges: updatedEdges,
      updatedAt: new Date().toISOString(),
    });
    if (selectedNodeId === nodeId) {
      onSelectNode(null);
    }
  };

  // Add new Node
  const handleAddNode = (type: NodeType) => {
    const id = `node_${type}_${Math.random().toString(36).substring(2, 7)}`;
    const x = Math.max(100, Math.round((-pan.x + 300) / zoom / 10) * 10);
    const y = Math.max(100, Math.round((-pan.y + 200) / zoom / 10) * 10);

    let defaultLabel = "新节点";
    let nodeData: WorkflowNode["data"] = {
      label: defaultLabel,
      type,
    };

    switch (type) {
      case "start":
        nodeData = {
          label: "开始触发器",
          type: "start",
          startConfig: { inputVariables: [] },
        };
        break;
      case "llm":
        nodeData = {
          label: "LLM 智能处理",
          type: "llm",
          llmConfig: {
            model: "gemini-3.7-flash",
            provider: "google",
            temperature: 0.2,
            maxTokens: 2048,
            topP: 0.95,
            systemPrompt: "你是一个智能 Agent 工作流助手。",
            userPrompt: "{{variables.input}}",
            responseFormat: "text",
            tools: [],
          },
        };
        break;
      case "code":
        nodeData = {
          label: "JS 代码沙箱",
          type: "code",
          codeConfig: {
            language: "javascript",
            inputs: {},
            code: "function main(inputs) {\n  return { processed: true, timestamp: Date.now() };\n}",
          },
        };
        break;
      case "condition":
        nodeData = {
          label: "条件分支判定",
          type: "condition",
          conditionConfig: {
            logicalOperator: "and",
            conditions: [
              {
                id: "c_1",
                leftOperand: "{{variables.status}}",
                operator: "equals",
                rightOperand: "active",
                targetHandle: "true",
              },
            ],
            elseTargetHandle: "false",
          },
        };
        break;
      case "http_request":
        nodeData = {
          label: "HTTP 请求 (API)",
          type: "http_request",
          httpConfig: {
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/todos/1",
            headers: {},
            params: {},
            bodyType: "none",
            body: "",
            timeoutMs: 10000,
          },
        };
        break;
      case "tool":
        nodeData = {
          label: "工具调用 (Tool)",
          type: "tool",
          toolConfig: {
            toolId: "calculator",
            toolName: "计算器",
            arguments: { expression: "100 * 1.5" },
          },
        };
        break;
      case "retrieval":
        nodeData = {
          label: "知识库检索 (RAG)",
          type: "retrieval",
          retrievalConfig: {
            knowledgeBaseId: "kb_enterprise_policies",
            queryTemplate: "{{variables.query}}",
            topK: 3,
            scoreThreshold: 0.2,
          },
        };
        break;
      case "variable_assigner":
        nodeData = {
          label: "变量赋值 (Assigner)",
          type: "variable_assigner",
          variableAssignerConfig: {
            assignments: [],
          },
        };
        break;
      case "end":
        nodeData = {
          label: "结束输出 (End)",
          type: "end",
          endConfig: {
            outputVariables: [
              { name: "result", expression: "{{nodes.llm_1.output.result}}", description: "最终输出" },
            ],
          },
        };
        break;
    }

    const newNode: WorkflowNode = {
      id,
      type,
      position: { x, y },
      data: nodeData,
    };

    onUpdateWorkflow({
      ...workflow,
      nodes: [...workflow.nodes, newNode],
      updatedAt: new Date().toISOString(),
    });
    onSelectNode(id);
    setIsAddMenuOpen(false);
  };

  // Node Edge Target Connect
  const handleConnectTarget = (targetId: string) => {
    if (!connectingSourceId || connectingSourceId === targetId) return;

    // Check if edge already exists
    const exists = workflow.edges.some(
      (e) => e.source === connectingSourceId && e.target === targetId
    );
    if (exists) return;

    const newEdge = {
      id: `edge_${connectingSourceId}_${targetId}_${Math.random().toString(36).substring(2, 6)}`,
      source: connectingSourceId,
      sourceHandle: connectingHandle,
      target: targetId,
      label: connectingHandle === "true" ? "True" : connectingHandle === "false" ? "False" : undefined,
    };

    onUpdateWorkflow({
      ...workflow,
      edges: [...workflow.edges, newEdge],
      updatedAt: new Date().toISOString(),
    });

    setConnectingSourceId(null);
    setConnectingHandle(undefined);
  };

  // Node Icon Helper
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case "start":
        return <Play className="w-4 h-4 text-emerald-400 fill-current" />;
      case "llm":
        return <Bot className="w-4 h-4 text-indigo-400" />;
      case "code":
        return <Code2 className="w-4 h-4 text-amber-400" />;
      case "condition":
        return <GitBranch className="w-4 h-4 text-cyan-400" />;
      case "http_request":
        return <Globe className="w-4 h-4 text-blue-400" />;
      case "tool":
        return <Wrench className="w-4 h-4 text-orange-400" />;
      case "retrieval":
        return <Database className="w-4 h-4 text-purple-400" />;
      case "variable_assigner":
        return <Sliders className="w-4 h-4 text-teal-400" />;
      case "end":
        return <CheckCircle2 className="w-4 h-4 text-rose-400" />;
    }
  };

  // Node Header Color
  const getNodeHeaderClass = (type: NodeType) => {
    switch (type) {
      case "start":
        return "border-emerald-500/40 bg-emerald-950/30 text-emerald-300";
      case "llm":
        return "border-indigo-500/40 bg-indigo-950/30 text-indigo-300";
      case "code":
        return "border-amber-500/40 bg-amber-950/30 text-amber-300";
      case "condition":
        return "border-cyan-500/40 bg-cyan-950/30 text-cyan-300";
      case "http_request":
        return "border-blue-500/40 bg-blue-950/30 text-blue-300";
      case "tool":
        return "border-orange-500/40 bg-orange-950/30 text-orange-300";
      case "retrieval":
        return "border-purple-500/40 bg-purple-950/30 text-purple-300";
      case "variable_assigner":
        return "border-teal-500/40 bg-teal-950/30 text-teal-300";
      case "end":
        return "border-rose-500/40 bg-rose-950/30 text-rose-300";
    }
  };

  return (
    <div
      id="workflow-canvas-root"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-full bg-slate-950 overflow-hidden select-none cursor-crosshair"
      style={{
        backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Top Floating Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="relative">
          <button
            id="btn-add-node"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg text-xs font-semibold transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>添加节点 (Add Node)</span>
          </button>

          {isAddMenuOpen && (
            <div
              id="menu-node-types"
              className="absolute top-11 left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-slate-200"
            >
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                基础与触发
              </div>
              <button
                onClick={() => handleAddNode("start")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="font-medium text-slate-100">开始触发器 (Start)</div>
                  <div className="text-[10px] text-slate-400">定义流程入参和执行入口</div>
                </div>
              </button>

              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 mt-1 uppercase tracking-wider">
                智能与模型
              </div>
              <button
                onClick={() => handleAddNode("llm")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <div>
                  <div className="font-medium text-slate-100">LLM 智能节点</div>
                  <div className="text-[10px] text-slate-400">调用 Gemini 3.7 模型处理推理</div>
                </div>
              </button>

              <button
                onClick={() => handleAddNode("retrieval")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <div className="font-medium text-slate-100">知识库检索 (RAG)</div>
                  <div className="text-[10px] text-slate-400">向量语义或关键词文档匹配</div>
                </div>
              </button>

              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 mt-1 uppercase tracking-wider">
                逻辑与执行
              </div>
              <button
                onClick={() => handleAddNode("condition")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <div className="font-medium text-slate-100">条件分支 (Condition)</div>
                  <div className="text-[10px] text-slate-400">多分支逻辑路由与断言判定</div>
                </div>
              </button>

              <button
                onClick={() => handleAddNode("code")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <div className="font-medium text-slate-100">JavaScript 代码沙箱</div>
                  <div className="text-[10px] text-slate-400">执行自定义函数与数据清洗</div>
                </div>
              </button>

              <button
                onClick={() => handleAddNode("http_request")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <div className="font-medium text-slate-100">HTTP 请求 (API)</div>
                  <div className="text-[10px] text-slate-400">调用外部 RESTful 接口</div>
                </div>
              </button>

              <button
                onClick={() => handleAddNode("tool")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <Wrench className="w-3.5 h-3.5 text-orange-400" />
                <div>
                  <div className="font-medium text-slate-100">扩展工具 (Tools)</div>
                  <div className="text-[10px] text-slate-400">计算器、格式化、汇率换算</div>
                </div>
              </button>

              <button
                onClick={() => handleAddNode("variable_assigner")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <div>
                  <div className="font-medium text-slate-100">变量赋值 (Assigner)</div>
                  <div className="text-[10px] text-slate-400">更新工作流全局变量状态</div>
                </div>
              </button>

              <button
                onClick={() => handleAddNode("end")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <div className="font-medium text-slate-100">结束输出 (End)</div>
                  <div className="text-[10px] text-slate-400">封装输出响应与完成状态</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Canvas Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 backdrop-blur px-2 py-1.5 rounded-xl shadow-xl text-slate-300">
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-xs"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono px-1">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-xs"
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-3.5 bg-slate-700 mx-1" />
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 50, y: 50 });
          }}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1"
          title="重置视图"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">重置</span>
        </button>
      </div>

      {/* Canvas SVG Edge Connectors Layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <defs>
          <marker
            id="edge-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#6366f1" />
          </marker>
          <marker
            id="edge-arrow-active"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
          </marker>
        </defs>

        {workflow.edges.map((edge) => {
          const sourceNode = workflow.nodes.find((n) => n.id === edge.source);
          const targetNode = workflow.nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          // Node width is ~260px, height is ~110px
          const sourceX = sourceNode.position.x + 260;
          const sourceY = sourceNode.position.y + (edge.sourceHandle === "false" ? 80 : 55);

          const targetX = targetNode.position.x;
          const targetY = targetNode.position.y + 55;

          const dx = targetX - sourceX;
          const controlOffset = Math.max(40, Math.min(120, Math.abs(dx) * 0.4));
          const pathD = `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY}, ${
            targetX - controlOffset
          } ${targetY}, ${targetX} ${targetY}`;

          const isEdgeActive =
            nodeExecutionResults[sourceNode.id]?.status === "completed" &&
            (nodeExecutionResults[targetNode.id]?.status === "running" ||
              nodeExecutionResults[targetNode.id]?.status === "completed");

          return (
            <g key={edge.id}>
              {/* Outer Glow / Path */}
              <path
                d={pathD}
                fill="none"
                stroke={isEdgeActive ? "#10b981" : "#475569"}
                strokeWidth={isEdgeActive ? 3 : 2}
                strokeDasharray={isExecuting ? "5,5" : undefined}
                className={isExecuting && isEdgeActive ? "animate-[dash_1s_linear_infinite]" : ""}
                markerEnd={isEdgeActive ? "url(#edge-arrow-active)" : "url(#edge-arrow)"}
              />
              {/* Edge Label if any */}
              {edge.label && (
                <text
                  x={(sourceX + targetX) / 2}
                  y={(sourceY + targetY) / 2 - 8}
                  fill={edge.sourceHandle === "true" ? "#34d399" : "#94a3b8"}
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  className="bg-slate-900 px-1 py-0.5"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes DOM Layer */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {workflow.nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const execResult = nodeExecutionResults[node.id];
          const nodeStatus = execResult?.status || "pending";

          return (
            <div
              key={node.id}
              id={`canvas-node-${node.id}`}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.id);
              }}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: "260px",
              }}
              className={`absolute pointer-events-auto rounded-xl border bg-slate-900/95 shadow-xl transition-all select-none ${
                isSelected
                  ? "ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Node Header */}
              <div
                className={`flex items-center justify-between px-3 py-2 border-b rounded-t-xl text-xs font-semibold ${getNodeHeaderClass(
                  node.type
                )}`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getNodeIcon(node.type)}
                  <span className="truncate">{node.data.label}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteNode(e, node.id)}
                  className="opacity-40 hover:opacity-100 text-slate-400 hover:text-rose-400 p-0.5 rounded transition-opacity"
                  title="删除节点"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Node Body */}
              <div className="p-3 text-xs text-slate-300">
                <div className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                  {node.data.description || `${node.type} 节点配置`}
                </div>

                {/* Status Indicator Badge */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    {nodeStatus === "pending" && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                    {nodeStatus === "running" && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono animate-pulse">
                        <Sparkles className="w-3 h-3 animate-spin" />
                        <span>Running</span>
                      </span>
                    )}
                    {nodeStatus === "completed" && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{execResult?.durationMs}ms</span>
                      </span>
                    )}
                    {nodeStatus === "failed" && (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
                        <XCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    )}
                    {nodeStatus === "skipped" && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Skipped</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {node.id.substring(0, 10)}
                  </span>
                </div>
              </div>

              {/* Target Port (Left Input) */}
              {node.type !== "start" && (
                <div
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    handleConnectTarget(node.id);
                  }}
                  className="absolute -left-2.5 top-[50px] w-5 h-5 rounded-full bg-slate-800 border-2 border-indigo-500 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer shadow-md"
                  title="输入连接点"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
              )}

              {/* Source Port (Right Output) */}
              {node.type !== "end" && node.type !== "condition" && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setConnectingSourceId(node.id);
                    setConnectingHandle(undefined);
                  }}
                  className="absolute -right-2.5 top-[50px] w-5 h-5 rounded-full bg-slate-800 border-2 border-emerald-500 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer shadow-md"
                  title="输出连接点 (拖拽连接下一个节点)"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              )}

              {/* Condition Node Multi-Handles (True / False) */}
              {node.type === "condition" && (
                <>
                  {/* True Branch */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setConnectingSourceId(node.id);
                      setConnectingHandle("true");
                    }}
                    className="absolute -right-2.5 top-[40px] w-5 h-5 rounded-full bg-slate-800 border-2 border-emerald-500 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer shadow-md"
                    title="True 分支 (拖拽连接)"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  {/* False Branch */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setConnectingSourceId(node.id);
                      setConnectingHandle("false");
                    }}
                    className="absolute -right-2.5 top-[75px] w-5 h-5 rounded-full bg-slate-800 border-2 border-rose-500 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer shadow-md"
                    title="False 分支 (拖拽连接)"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
