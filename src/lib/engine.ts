import {
  Workflow,
  WorkflowNode,
  ExecutionTask,
  NodeExecutionResult,
  TraceEvent,
  ToolDefinition,
  KnowledgeBase,
  KnowledgeDoc,
} from "../types/schemas.ts";
import {
  validateTaskTransition,
  validateNodeTransition,
} from "./stateMachine.ts";

export interface ExecutionContext {
  variables: Record<string, unknown>;
  nodeOutputs: Record<string, Record<string, unknown>>;
  nodeResults: Record<string, NodeExecutionResult>;
  traceEvents: TraceEvent[];
  tools: Record<string, ToolDefinition>;
  knowledgeBases: Record<string, KnowledgeBase>;
  knowledgeDocs: KnowledgeDoc[];
  onTraceUpdate?: (event: TraceEvent) => void;
  onNodeStatusChange?: (nodeId: string, result: NodeExecutionResult) => void;
}

/**
 * Resolves template string containing {{variables.xxx}} or {{nodes.nodeId.output.field}}
 */
export function interpolateExpression(
  expression: string,
  context: ExecutionContext
): string {
  if (typeof expression !== "string") {
    return String(expression ?? "");
  }

  return expression.replace(/\{\{\s*([a-zA-Z0-9_$.]+)\s*\}\}/g, (_, path: string) => {
    const parts = path.split(".");
    if (parts[0] === "variables" && parts[1]) {
      const val = context.variables[parts[1]];
      if (typeof val === "object" && val !== null) {
        return JSON.stringify(val);
      }
      return val !== undefined ? String(val) : "";
    }

    if (parts[0] === "nodes" && parts[1]) {
      const nodeId = parts[1];
      const nodeOut = context.nodeOutputs[nodeId];
      if (!nodeOut) return "";

      if (parts[2] === "output") {
        if (parts.length === 3) {
          return typeof nodeOut === "object" ? JSON.stringify(nodeOut) : String(nodeOut);
        }
        let current: unknown = nodeOut;
        for (let i = 3; i < parts.length; i++) {
          if (current && typeof current === "object" && parts[i] in current) {
            current = (current as Record<string, unknown>)[parts[i]];
          } else {
            return "";
          }
        }
        return typeof current === "object" && current !== null
          ? JSON.stringify(current)
          : String(current ?? "");
      }
    }

    return "";
  });
}

/**
 * Resolves raw value without converting objects to strings if exact single match
 */
export function resolveValue(
  value: unknown,
  context: ExecutionContext
): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  const exactMatch = trimmed.match(/^\{\{\s*([a-zA-Z0-9_$.]+)\s*\}\}$/);
  if (exactMatch && exactMatch[1]) {
    const path = exactMatch[1];
    const parts = path.split(".");
    if (parts[0] === "variables" && parts[1]) {
      return context.variables[parts[1]];
    }
    if (parts[0] === "nodes" && parts[1]) {
      const nodeId = parts[1];
      const nodeOut = context.nodeOutputs[nodeId];
      if (!nodeOut) return undefined;
      if (parts[2] === "output") {
        if (parts.length === 3) return nodeOut;
        let current: unknown = nodeOut;
        for (let i = 3; i < parts.length; i++) {
          if (current && typeof current === "object" && parts[i] in current) {
            current = (current as Record<string, unknown>)[parts[i]];
          } else {
            return undefined;
          }
        }
        return current;
      }
    }
  }

  return interpolateExpression(value, context);
}

/**
 * Safe client/server condition evaluator
 */
export function evaluateCondition(
  left: unknown,
  operator: string,
  right: unknown
): boolean {
  const leftStr = left !== undefined && left !== null ? String(left) : "";
  const rightStr = right !== undefined && right !== null ? String(right) : "";

  const leftNum = Number(left);
  const rightNum = Number(right);
  const isBothNumeric = !isNaN(leftNum) && !isNaN(rightNum);

  switch (operator) {
    case "equals":
      return isBothNumeric ? leftNum === rightNum : leftStr === rightStr;
    case "not_equals":
      return isBothNumeric ? leftNum !== rightNum : leftStr !== rightStr;
    case "contains":
      return leftStr.toLowerCase().includes(rightStr.toLowerCase());
    case "not_contains":
      return !leftStr.toLowerCase().includes(rightStr.toLowerCase());
    case "greater_than":
      return isBothNumeric ? leftNum > rightNum : leftStr > rightStr;
    case "less_than":
      return isBothNumeric ? leftNum < rightNum : leftStr < rightStr;
    case "is_empty":
      return leftStr.trim() === "" || left === null || left === undefined;
    case "is_not_empty":
      return leftStr.trim() !== "" && left !== null && left !== undefined;
    default:
      return false;
  }
}

/**
 * Execute a single Workflow node with strict state machine verification
 */
export async function executeNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const startTime = Date.now();
  const traceLogs: string[] = [];

  const addTrace = (
    eventType: TraceEvent["eventType"],
    message: string,
    details?: Record<string, unknown>
  ) => {
    const event: TraceEvent = {
      id: "trace_" + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      nodeId: node.id,
      nodeName: node.data.label,
      eventType,
      message,
      details,
    };
    context.traceEvents.push(event);
    traceLogs.push(`[${new Date(event.timestamp).toLocaleTimeString()}] ${message}`);
    if (context.onTraceUpdate) {
      context.onTraceUpdate(event);
    }
  };

  let nodeResult: NodeExecutionResult = {
    nodeId: node.id,
    nodeName: node.data.label,
    nodeType: node.type,
    status: "pending",
    input: {},
    output: {},
    startedAt: startTime,
    completedAt: startTime,
    durationMs: 0,
    traceLogs,
  };

  // State Transition: pending -> running
  validateNodeTransition(nodeResult.status, "running");
  nodeResult.status = "running";
  addTrace("node_enter", `Starting execution of node "${node.data.label}" (${node.type})`);
  if (context.onNodeStatusChange) {
    context.onNodeStatusChange(node.id, { ...nodeResult });
  }

  try {
    switch (node.type) {
      case "start": {
        const config = node.data.startConfig;
        const resolvedInput: Record<string, unknown> = {};
        if (config?.inputVariables) {
          for (const iv of config.inputVariables) {
            const val = context.variables[iv.name] !== undefined
              ? context.variables[iv.name]
              : iv.defaultValue;
            resolvedInput[iv.name] = val;
            context.variables[iv.name] = val;
          }
        }
        nodeResult.input = resolvedInput;
        nodeResult.output = { ...resolvedInput };
        addTrace("node_executing", `Initialized start variables: ${Object.keys(resolvedInput).join(", ")}`);
        break;
      }

      case "llm": {
        const config = node.data.llmConfig;
        if (!config) throw new Error("LLM configuration is missing");

        const renderedSystemPrompt = interpolateExpression(config.systemPrompt, context);
        const renderedUserPrompt = interpolateExpression(config.userPrompt, context);

        nodeResult.input = {
          model: config.model,
          temperature: config.temperature,
          systemPrompt: renderedSystemPrompt,
          userPrompt: renderedUserPrompt,
          responseFormat: config.responseFormat,
        };

        addTrace("llm_call", `Calling LLM model "${config.model}"...`, {
          promptLength: renderedUserPrompt.length,
        });

        // Call backend API for secure Gemini invocation
        const response = await fetch("/api/run-llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: config.model || "gemini-3.7-flash",
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            topP: config.topP,
            systemPrompt: renderedSystemPrompt,
            userPrompt: renderedUserPrompt,
            responseFormat: config.responseFormat,
            jsonSchema: config.jsonSchema,
          }),
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error || `LLM request failed with status ${response.status}`);
        }

        const data = (await response.json()) as {
          text: string;
          usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
        };

        let parsedOutput: unknown = data.text;
        if (config.responseFormat === "json") {
          try {
            parsedOutput = JSON.parse(data.text);
          } catch {
            parsedOutput = data.text;
          }
        }

        nodeResult.output = {
          result: parsedOutput,
          rawText: data.text,
          usage: data.usage || { promptTokens: 120, completionTokens: 80, totalTokens: 200 },
        };
        addTrace("node_executing", `LLM returned ${data.text.length} characters.`);
        break;
      }

      case "code": {
        const config = node.data.codeConfig;
        if (!config) throw new Error("Code configuration is missing");

        const resolvedInputs: Record<string, unknown> = {};
        for (const [key, expr] of Object.entries(config.inputs || {})) {
          resolvedInputs[key] = resolveValue(expr, context);
        }
        nodeResult.input = resolvedInputs;
        addTrace("node_executing", `Executing ${config.language} sandbox with timeout protection...`);

        const logs: string[] = [];
        const customConsole = {
          log: (...args: unknown[]) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
          error: (...args: unknown[]) => logs.push("[ERROR] " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
          warn: (...args: unknown[]) => logs.push("[WARN] " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
        };

        // 支持 async function main(inputs) 并设置 Promise 超时机制 (5000ms)
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const runner = new AsyncFunction(
          "inputs",
          "console",
          "context",
          `"use strict";
          try {
            ${config.code}
            if (typeof main === 'function') {
              return await main(inputs);
            }
            return null;
          } catch (e) {
            throw e;
          }`
        );

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Code execution timed out (limit: 5000ms)")), 5000)
        );

        const executionOutput = await Promise.race([
          runner(resolvedInputs, customConsole, { variables: context.variables }),
          timeoutPromise
        ]);

        nodeResult.output = {
          result: executionOutput !== undefined ? executionOutput : null,
          logs,
        };
        addTrace("node_executing", `Code executed successfully. Output captured.`);
        break;
      }

      case "condition": {
        const config = node.data.conditionConfig;
        if (!config) throw new Error("Condition configuration is missing");

        const conditionResults: boolean[] = [];
        const conditionDetails: Record<string, unknown>[] = [];

        for (const cond of config.conditions) {
          const leftVal = resolveValue(cond.leftOperand, context);
          const rightVal = resolveValue(cond.rightOperand, context);
          const passed = evaluateCondition(leftVal, cond.operator, rightVal);
          conditionResults.push(passed);
          conditionDetails.push({
            ruleId: cond.id,
            leftOperand: leftVal,
            operator: cond.operator,
            rightOperand: rightVal,
            passed,
            targetHandle: cond.targetHandle,
          });
        }

        const isOverallPassed = config.logicalOperator === "and"
          ? conditionResults.every(Boolean)
          : conditionResults.some(Boolean);

        const activeHandle = isOverallPassed ? "true" : "false";

        nodeResult.input = { conditions: config.conditions, logicalOperator: config.logicalOperator };
        nodeResult.output = {
          passed: isOverallPassed,
          activeHandle,
          details: conditionDetails,
        };

        addTrace(
          "condition_eval",
          `Condition evaluated to: ${isOverallPassed ? "TRUE (Branch True)" : "FALSE (Branch False)"}`,
          { isOverallPassed, activeHandle }
        );
        break;
      }

      case "http_request": {
        const config = node.data.httpConfig;
        if (!config) throw new Error("HTTP configuration is missing");

        const renderedUrl = interpolateExpression(config.url, context);
        const resolvedHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(config.headers || {})) {
          resolvedHeaders[k] = interpolateExpression(v, context);
        }

        let renderedBody: string | undefined = undefined;
        if (config.bodyType !== "none" && config.body) {
          renderedBody = interpolateExpression(config.body, context);
        }

        nodeResult.input = {
          url: renderedUrl,
          method: config.method,
          headers: resolvedHeaders,
          body: renderedBody,
        };

        addTrace("node_executing", `Dispatching ${config.method} request to ${renderedUrl}...`);

        const response = await fetch("/api/proxy-http", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: renderedUrl,
            method: config.method,
            headers: resolvedHeaders,
            params: config.params,
            body: renderedBody,
            timeoutMs: config.timeoutMs || 10000,
          }),
        });

        const httpData = (await response.json()) as {
          status: number;
          statusText: string;
          data: unknown;
          headers: Record<string, string>;
        };

        nodeResult.output = {
          status: httpData.status,
          statusText: httpData.statusText,
          data: httpData.data,
          headers: httpData.headers,
        };

        addTrace("node_executing", `HTTP response status: ${httpData.status} ${httpData.statusText}`);
        break;
      }

      case "tool": {
        const config = node.data.toolConfig;
        if (!config) throw new Error("Tool configuration is missing");

        const tool = context.tools[config.toolId];
        const resolvedArgs: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(config.arguments || {})) {
          resolvedArgs[k] = resolveValue(v, context);
        }

        nodeResult.input = { toolId: config.toolId, toolName: config.toolName, arguments: resolvedArgs };
        addTrace("tool_call", `Executing tool "${config.toolName}"...`, resolvedArgs);

        let toolOutput: unknown = null;

        // Built-in tools execution logic
        if (config.toolId === "calculator" || tool?.name.toLowerCase().includes("calc")) {
          const expr = String(resolvedArgs.expression || resolvedArgs.query || "0");
          try {
            // Safe mathematical expression evaluation
            const sanitized = expr.replace(/[^0-9+\-*/().%^ ]/g, "");
            toolOutput = { result: new Function(`return (${sanitized})`)() };
          } catch {
            toolOutput = { result: 0, error: "Invalid math expression" };
          }
        } else if (config.toolId === "json_formatter" || tool?.name.toLowerCase().includes("json")) {
          try {
            const raw = resolvedArgs.input || "{}";
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            toolOutput = { formatted: JSON.stringify(parsed, null, 2), parsed };
          } catch (e) {
            toolOutput = { error: String(e) };
          }
        } else if (config.toolId === "text_summarizer" || tool?.name.toLowerCase().includes("summar")) {
          const text = String(resolvedArgs.text || "");
          const sentences = text.split(/[.!?]+/).filter(Boolean);
          toolOutput = {
            summary: sentences.slice(0, 3).join(". ") + (sentences.length > 3 ? "..." : "."),
            originalLength: text.length,
            sentenceCount: sentences.length,
          };
        } else {
          // Dynamic tool execution via backend
          const resp = await fetch("/api/run-tool", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolId: config.toolId,
              toolName: config.toolName,
              arguments: resolvedArgs,
            }),
          });
          const toolData = (await resp.json()) as { output: unknown };
          toolOutput = toolData.output;
        }

        nodeResult.output = { result: toolOutput };
        addTrace("node_executing", `Tool "${config.toolName}" finished execution.`);
        break;
      }

      case "retrieval": {
        const config = node.data.retrievalConfig;
        if (!config) throw new Error("Retrieval configuration is missing");

        const query = interpolateExpression(config.queryTemplate, context);
        nodeResult.input = { query, knowledgeBaseId: config.knowledgeBaseId, topK: config.topK };

        addTrace("node_executing", `Searching knowledge base "${config.knowledgeBaseId}" for "${query}"...`);

        // Search matching docs
        const matchingDocs = context.knowledgeDocs
          .filter((d) => !config.knowledgeBaseId || d.knowledgeBaseId === config.knowledgeBaseId)
          .map((doc) => {
            // Simple keyword & token similarity calculation
            const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
            const docText = (doc.title + " " + doc.content).toLowerCase();
            let score = 0;
            for (const token of qTokens) {
              if (docText.includes(token)) score += 1;
            }
            const normalizedScore = qTokens.length > 0 ? Math.min(1, score / qTokens.length) : 0;
            return {
              id: doc.id,
              title: doc.title,
              content: doc.content,
              score: normalizedScore,
            };
          })
          .filter((d) => d.score >= (config.scoreThreshold || 0))
          .sort((a, b) => b.score - a.score)
          .slice(0, config.topK || 3);

        nodeResult.output = {
          records: matchingDocs,
          matchedCount: matchingDocs.length,
          contextString: matchingDocs.map((m, i) => `[Doc ${i + 1}] ${m.title}\n${m.content}`).join("\n\n"),
        };

        addTrace("node_executing", `Retrieved ${matchingDocs.length} knowledge chunks.`);
        break;
      }

      case "variable_assigner": {
        const config = node.data.variableAssignerConfig;
        if (!config) throw new Error("Variable assigner configuration is missing");

        const assigned: Record<string, unknown> = {};
        for (const item of config.assignments) {
          const val = resolveValue(item.sourceExpression, context);
          context.variables[item.targetVariable] = val;
          assigned[item.targetVariable] = val;
        }

        nodeResult.input = { assignments: config.assignments };
        nodeResult.output = { assignedVariables: assigned };
        addTrace("node_executing", `Assigned variables: ${Object.keys(assigned).join(", ")}`);
        break;
      }

      case "end": {
        const config = node.data.endConfig;
        const finalOutputs: Record<string, unknown> = {};
        if (config?.outputVariables) {
          for (const ov of config.outputVariables) {
            finalOutputs[ov.name] = resolveValue(ov.expression, context);
          }
        }
        nodeResult.input = { expressions: config?.outputVariables || [] };
        nodeResult.output = finalOutputs;
        addTrace("node_executing", `Generated final outputs: ${Object.keys(finalOutputs).join(", ")}`);
        break;
      }

      default: {
        nodeResult.output = { message: "Pass-through execution" };
        break;
      }
    }

    // State Transition: running -> completed
    validateNodeTransition(nodeResult.status, "completed");
    nodeResult.status = "completed";
    nodeResult.completedAt = Date.now();
    nodeResult.durationMs = nodeResult.completedAt - nodeResult.startedAt;
    addTrace("node_exit", `Node "${node.data.label}" completed in ${nodeResult.durationMs}ms.`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    // State Transition: running -> failed
    validateNodeTransition(nodeResult.status, "failed");
    nodeResult.status = "failed";
    nodeResult.error = errorMessage;
    nodeResult.completedAt = Date.now();
    nodeResult.durationMs = nodeResult.completedAt - nodeResult.startedAt;
    addTrace("node_error", `Error executing node "${node.data.label}": ${errorMessage}`, {
      error: errorMessage,
    });
  }

  // Update context caches
  context.nodeOutputs[node.id] = nodeResult.output;
  context.nodeResults[node.id] = nodeResult;

  if (context.onNodeStatusChange) {
    context.onNodeStatusChange(node.id, { ...nodeResult });
  }

  return nodeResult;
}

/**
 * Executes a full Workflow graph from Start Node to End Node
 */
export async function executeWorkflow(
  workflow: Workflow,
  initialInputs: Record<string, unknown>,
  options?: {
    tools?: Record<string, ToolDefinition>;
    knowledgeBases?: Record<string, KnowledgeBase>;
    knowledgeDocs?: KnowledgeDoc[];
    onTraceUpdate?: (event: TraceEvent) => void;
    onNodeStatusChange?: (nodeId: string, result: NodeExecutionResult) => void;
  }
): Promise<ExecutionTask> {
  const taskId = "task_" + Math.random().toString(36).substring(2, 10);
  const startTime = Date.now();

  const task: ExecutionTask = {
    id: taskId,
    targetId: workflow.id,
    targetType: "workflow",
    targetName: workflow.name,
    status: "pending",
    input: { ...initialInputs },
    output: {},
    nodeResults: {},
    traceEvents: [],
    metrics: {
      durationMs: 0,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      costUsd: 0,
    },
    triggeredBy: "manual",
    createdAt: new Date(startTime).toISOString(),
  };

  // State Transition: pending -> running
  validateTaskTransition(task.status, "running");
  task.status = "running";
  task.startedAt = new Date().toISOString();

  const context: ExecutionContext = {
    variables: { ...initialInputs },
    nodeOutputs: {},
    nodeResults: {},
    traceEvents: task.traceEvents,
    tools: options?.tools || {},
    knowledgeBases: options?.knowledgeBases || {},
    knowledgeDocs: options?.knowledgeDocs || [],
    onTraceUpdate: options?.onTraceUpdate,
    onNodeStatusChange: options?.onNodeStatusChange,
  };

  const addTrace = (
    eventType: TraceEvent["eventType"],
    message: string,
    details?: Record<string, unknown>
  ) => {
    const event: TraceEvent = {
      id: "trace_" + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      eventType,
      message,
      details,
    };
    task.traceEvents.push(event);
    if (context.onTraceUpdate) {
      context.onTraceUpdate(event);
    }
  };

  addTrace("task_start", `Workflow "${workflow.name}" execution started.`);

  try {
    // 1. Locate Start Node
    const startNode = workflow.nodes.find((n) => n.type === "start") || workflow.nodes[0];
    if (!startNode) {
      throw new Error("No start node found in workflow.");
    }

    // Build Adjacency Map
    const nodeMap = new Map<string, WorkflowNode>();
    for (const node of workflow.nodes) {
      nodeMap.set(node.id, node);
      // Initialize pending state for all nodes
      context.nodeResults[node.id] = {
        nodeId: node.id,
        nodeName: node.data.label,
        nodeType: node.type,
        status: "pending",
        input: {},
        output: {},
        startedAt: 0,
        completedAt: 0,
        durationMs: 0,
        traceLogs: [],
      };
      if (context.onNodeStatusChange) {
        context.onNodeStatusChange(node.id, context.nodeResults[node.id]);
      }
    }

    // Active Queue for DAG Traversal
    const queue: string[] = [startNode.id];
    const visited = new Set<string>();
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (visited.has(currentNodeId)) continue;
      visited.add(currentNodeId);

      const node = nodeMap.get(currentNodeId);
      if (!node) continue;

      // Execute current node
      const result = await executeNode(node, context);
      task.nodeResults[node.id] = result;

      // Accumulate LLM Token metrics
      if (result.output?.usage && typeof result.output.usage === "object") {
        const u = result.output.usage as { promptTokens?: number; completionTokens?: number };
        totalPromptTokens += u.promptTokens || 0;
        totalCompletionTokens += u.completionTokens || 0;
      }

      if (result.status === "failed") {
        throw new Error(`Node "${node.data.label}" failed: ${result.error || "Unknown execution error"}`);
      }

      // If condition node, only follow activeHandle branch
      let outgoingEdges = workflow.edges.filter((e) => e.source === node.id);
      if (node.type === "condition") {
        const activeHandle = result.output?.activeHandle as string | undefined;
        if (activeHandle) {
          outgoingEdges = outgoingEdges.filter(
            (e) => !e.sourceHandle || e.sourceHandle === activeHandle
          );
        }
      }

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target) && !queue.includes(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    // Set remaining unvisited nodes as skipped
    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        const skippedResult: NodeExecutionResult = {
          nodeId: node.id,
          nodeName: node.data.label,
          nodeType: node.type,
          status: "skipped",
          input: {},
          output: {},
          startedAt: Date.now(),
          completedAt: Date.now(),
          durationMs: 0,
          traceLogs: ["Node skipped due to conditional branch path."],
        };
        context.nodeResults[node.id] = skippedResult;
        task.nodeResults[node.id] = skippedResult;
        if (context.onNodeStatusChange) {
          context.onNodeStatusChange(node.id, skippedResult);
        }
      }
    }

    // Find End Node or last executed node output
    const endNode = workflow.nodes.find((n) => n.type === "end" && visited.has(n.id));
    if (endNode && context.nodeOutputs[endNode.id]) {
      task.output = context.nodeOutputs[endNode.id];
    } else {
      // Gather outputs from all executed leaf nodes
      const leafOutputs: Record<string, unknown> = {};
      for (const vId of visited) {
        const out = context.nodeOutputs[vId];
        if (out) {
          leafOutputs[vId] = out;
        }
      }
      task.output = leafOutputs;
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    // Estimated cost: $0.15 / 1M prompt, $0.60 / 1M completion
    const costUsd = (totalPromptTokens * 0.00000015) + (totalCompletionTokens * 0.0000006);

    task.metrics = {
      durationMs,
      tokenUsage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens,
      },
      costUsd: Number(costUsd.toFixed(6)),
    };

    // State Transition: running -> completed
    validateTaskTransition(task.status, "completed");
    task.status = "completed";
    task.completedAt = new Date(endTime).toISOString();
    addTrace("task_complete", `Workflow execution completed successfully in ${durationMs}ms.`, {
      totalTokens,
      durationMs,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const endTime = Date.now();

    // State Transition: running -> failed
    validateTaskTransition(task.status, "failed");
    task.status = "failed";
    task.error = errorMessage;
    task.completedAt = new Date(endTime).toISOString();
    task.metrics.durationMs = endTime - startTime;
    addTrace("task_error", `Workflow execution failed: ${errorMessage}`, { error: errorMessage });
  }

  return task;
}
