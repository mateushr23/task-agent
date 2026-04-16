'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaskStep, TaskStatus } from '@/lib/types';
import { getSSEUrl } from '@/lib/api';

interface UseSSEReturn {
  steps: TaskStep[];
  result: string | null;
  error: string | null;
  status: TaskStatus;
}

function safeParse(data: string): Record<string, unknown> | null {
  try {
    return JSON.parse(data);
  } catch {
    console.warn('Failed to parse SSE data:', data);
    return null;
  }
}

export function useSSE(taskId: string | null): UseSSEReturn {
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>('idle');
  const eventSourceRef = useRef<EventSource | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    setSteps([]);
    setResult(null);
    setError(null);
    setStatus('running');

    const url = getSSEUrl(taskId);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('step:start', (e: MessageEvent) => {
      const data = safeParse(e.data) as {
        index: number;
        toolName: string;
        toolInput: Record<string, unknown>;
      } | null;
      if (!data) return;

      const newStep: TaskStep = {
        index: data.index,
        toolName: data.toolName,
        toolInput: data.toolInput,
        status: 'running',
        result: null,
        error: null,
        durationMs: null,
      };

      setSteps((prev) => [...prev, newStep]);
    });

    es.addEventListener('step:complete', (e: MessageEvent) => {
      const data = safeParse(e.data) as {
        index: number;
        result: string;
        durationMs: number;
      } | null;
      if (!data) return;

      setSteps((prev) =>
        prev.map((step) =>
          step.index === data.index
            ? {
                ...step,
                status: 'completed' as const,
                result: data.result,
                durationMs: data.durationMs,
              }
            : step
        )
      );
    });

    es.addEventListener('step:error', (e: MessageEvent) => {
      const data = safeParse(e.data) as {
        index: number;
        error: string;
      } | null;
      if (!data) return;

      setSteps((prev) =>
        prev.map((step) =>
          step.index === data.index
            ? {
                ...step,
                status: 'failed' as const,
                error: data.error,
              }
            : step
        )
      );
    });

    es.addEventListener('result', (e: MessageEvent) => {
      const data = safeParse(e.data) as { content: string } | null;
      if (!data) return;
      setResult(data.content);
      setStatus('completed');
    });

    es.addEventListener('error', (e: MessageEvent) => {
      if (e.data) {
        const data = safeParse(e.data) as { message: string } | null;
        if (!data) return;
        setError(data.message);
      } else {
        setError('Conexao com o servidor perdida');
      }
      setStatus('failed');
    });

    es.addEventListener('done', () => {
      cleanup();
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setStatus((prev) => (prev === 'running' ? 'failed' : prev));
        setError((prev) => prev ?? 'Conexao com o servidor perdida');
        cleanup();
      }
    };

    return cleanup;
  }, [taskId, cleanup]);

  return { steps, result, error, status };
}
