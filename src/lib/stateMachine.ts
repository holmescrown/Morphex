import {
  TaskStatus,
  NodeExecutionStatus,
} from "../types/schemas.ts";

/**
 * Task Execution State Machine
 * Valid transitions:
 * - pending -> running
 * - running -> completed
 * - running -> failed
 * - (failed/completed are terminal states)
 */
export const TASK_VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ["running", "failed"],
  running: ["completed", "failed"],
  completed: [],
  failed: [],
};

/**
 * Node Execution State Machine
 * Valid transitions:
 * - pending -> running
 * - pending -> skipped
 * - running -> completed
 * - running -> failed
 * - (completed, failed, skipped are terminal)
 */
export const NODE_VALID_TRANSITIONS: Record<NodeExecutionStatus, NodeExecutionStatus[]> = {
  pending: ["running", "skipped", "failed"],
  running: ["completed", "failed"],
  completed: [],
  failed: [],
  skipped: [],
};

export class StateTransitionError extends Error {
  public readonly fromState: string;
  public readonly toState: string;
  public readonly entityType: string;

  constructor(entityType: string, fromState: string, toState: string) {
    super(
      `Invalid state transition for ${entityType}: cannot transition from "${fromState}" to "${toState}".`
    );
    this.name = "StateTransitionError";
    this.entityType = entityType;
    this.fromState = fromState;
    this.toState = toState;
  }
}

export function validateTaskTransition(
  current: TaskStatus,
  next: TaskStatus
): boolean {
  if (current === next) return true;
  const allowed = TASK_VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new StateTransitionError("TaskExecution", current, next);
  }
  return true;
}

export function validateNodeTransition(
  current: NodeExecutionStatus,
  next: NodeExecutionStatus
): boolean {
  if (current === next) return true;
  const allowed = NODE_VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new StateTransitionError("NodeExecution", current, next);
  }
  return true;
}
