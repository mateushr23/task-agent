export interface TaskSummary {
  id: string;
  description: string;
  status: 'running' | 'completed' | 'failed';
  stepCount: number;
  createdAt: string;
  durationMs: number | null;
}

export interface TaskDetail {
  id: string;
  description: string;
  status: 'running' | 'completed' | 'failed';
  steps: TaskStep[];
  result: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface TaskStep {
  index: number;
  toolName: string;
  toolInput: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed';
  result: string | null;
  error: string | null;
  durationMs: number | null;
}

export type TaskStatus = 'idle' | 'running' | 'completed' | 'failed';
