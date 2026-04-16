'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { TaskStep, TaskStatus, TaskSummary } from '@/lib/types';
import { useSSE } from '@/hooks/useSSE';
import { createTask, fetchTasks, fetchTaskDetail, deleteTask } from '@/lib/api';

interface TaskContextValue {
  /* Current task */
  taskId: string | null;
  description: string;
  status: TaskStatus;
  steps: TaskStep[];
  result: string | null;
  error: string | null;

  /* History */
  history: TaskSummary[];
  historyLoading: boolean;

  /* Actions */
  submitTask: (description: string) => Promise<void>;
  loadTaskFromHistory: (taskId: string) => Promise<void>;
  retry: () => void;
  clearCurrent: () => void;
  removeFromHistory: (taskId: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function useTask(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTask must be used inside <TaskProvider>');
  }
  return ctx;
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [lastDescription, setLastDescription] = useState('');

  /* History */
  const [history, setHistory] = useState<TaskSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  /* Loaded-from-history state (overrides SSE when viewing past tasks) */
  const [loadedSteps, setLoadedSteps] = useState<TaskStep[] | null>(null);
  const [loadedResult, setLoadedResult] = useState<string | null>(null);
  const [loadedError, setLoadedError] = useState<string | null>(null);
  const [loadedStatus, setLoadedStatus] = useState<TaskStatus | null>(null);

  /* SSE for live tasks */
  const sse = useSSE(taskId && !loadedStatus ? taskId : null);

  /* Resolve live vs loaded state */
  const status = loadedStatus ?? (taskId ? sse.status : 'idle');
  const steps = loadedSteps ?? sse.steps;
  const result = loadedResult ?? sse.result;
  const error = loadedError ?? sse.error;

  /* Fetch history on mount */
  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchTasks(50, 0);
      setHistory(data.tasks);
    } catch (err) {
      console.warn('Failed to refresh task history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  /* Refresh history when a live task completes */
  useEffect(() => {
    if (sse.status === 'completed' || sse.status === 'failed') {
      refreshHistory();
    }
  }, [sse.status, refreshHistory]);

  const submitTask = useCallback(
    async (desc: string) => {
      setLoadedSteps(null);
      setLoadedResult(null);
      setLoadedError(null);
      setLoadedStatus(null);
      setDescription(desc);
      setLastDescription(desc);

      try {
        const { taskId: newId } = await createTask(desc);
        setTaskId(newId);
      } catch (err) {
        setLoadedStatus('failed');
        setLoadedError(
          err instanceof Error ? err.message : 'Erro ao enviar tarefa'
        );
      }
    },
    []
  );

  const loadTaskFromHistory = useCallback(async (id: string) => {
    try {
      const detail = await fetchTaskDetail(id);
      setTaskId(id);
      setDescription(detail.description);
      setLoadedSteps(detail.steps);
      setLoadedResult(detail.result);
      setLoadedError(detail.error);
      setLoadedStatus(
        detail.status === 'running'
          ? 'running'
          : detail.status === 'completed'
            ? 'completed'
            : 'failed'
      );
    } catch {
      /* toast would go here */
    }
  }, []);

  const retry = useCallback(() => {
    if (lastDescription) {
      submitTask(lastDescription);
    }
  }, [lastDescription, submitTask]);

  const clearCurrent = useCallback(() => {
    setTaskId(null);
    setDescription('');
    setLoadedSteps(null);
    setLoadedResult(null);
    setLoadedError(null);
    setLoadedStatus(null);
  }, []);

  const removeFromHistory = useCallback(
    async (id: string) => {
      try {
        await deleteTask(id);
        setHistory((prev) => prev.filter((t) => t.id !== id));
        if (taskId === id) {
          clearCurrent();
        }
      } catch {
        /* silently fail */
      }
    },
    [taskId, clearCurrent]
  );

  return (
    <TaskContext.Provider
      value={{
        taskId,
        description,
        status,
        steps,
        result,
        error,
        history,
        historyLoading,
        submitTask,
        loadTaskFromHistory,
        retry,
        clearCurrent,
        removeFromHistory,
        refreshHistory,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
