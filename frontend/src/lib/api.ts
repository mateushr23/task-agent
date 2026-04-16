import type { TaskSummary, TaskDetail } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function createTask(
  description: string
): Promise<{ taskId: string; sseUrl: string }> {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message || `Erro ao criar tarefa (${res.status})`
    );
  }

  return res.json() as Promise<{ taskId: string; sseUrl: string }>;
}

export async function fetchTasks(
  limit = 20,
  offset = 0
): Promise<{ tasks: TaskSummary[]; total: number }> {
  const res = await fetch(
    `${API_URL}/tasks?limit=${limit}&offset=${offset}`
  );

  if (!res.ok) {
    throw new Error(`Erro ao buscar tarefas (${res.status})`);
  }

  return res.json() as Promise<{ tasks: TaskSummary[]; total: number }>;
}

export async function fetchTaskDetail(taskId: string): Promise<TaskDetail> {
  const res = await fetch(`${API_URL}/tasks/${taskId}`);

  if (!res.ok) {
    throw new Error(`Erro ao buscar detalhes da tarefa (${res.status})`);
  }

  return res.json() as Promise<TaskDetail>;
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Erro ao deletar tarefa (${res.status})`);
  }
}

export async function cancelTask(taskId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tasks/${taskId}/cancel`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to cancel task');
  }
}

export function getSSEUrl(taskId: string): string {
  return `${API_URL}/tasks/${taskId}/stream`;
}
