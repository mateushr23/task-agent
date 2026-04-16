export interface Task {
  id: string;
  description: string;
  status: "running" | "completed" | "failed";
  result: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface TaskSummary {
  id: string;
  description: string;
  status: "running" | "completed" | "failed";
  stepCount: number;
  createdAt: string;
  durationMs: number | null;
}

export interface TaskDetail extends Task {
  steps: TaskStep[];
}

export interface TaskStep {
  index: number;
  toolName: string;
  toolInput: Record<string, unknown>;
  status: "running" | "completed" | "failed";
  result: string | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
