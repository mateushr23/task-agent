'use client';

import { useRef, useEffect } from 'react';
import { useTask } from '@/contexts/TaskContext';
import StepCard from './StepCard';

export default function StepPanel() {
  const { steps, status } = useTask();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [steps.length]);

  const isEmpty = steps.length === 0;
  const isIdle = status === 'idle';

  return (
    <section aria-label="Passos do Agente" className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-semibold text-text-primary">
          Passos do Agente
        </h2>
        {steps.length > 0 && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-100 px-1.5 text-xs font-medium text-primary-700">
            {steps.length}
          </span>
        )}
      </div>

      {isEmpty && isIdle && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-muted py-12 text-center">
          <svg
            className="mb-3 h-8 w-8 text-text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
          </svg>
          <p className="text-sm text-text-muted">Nenhum passo ainda</p>
          <p className="mt-1 text-xs text-text-muted">
            Descreva uma tarefa acima para comecar
          </p>
        </div>
      )}

      {!isEmpty && (
        <div className="relative pl-6">
          {/* Timeline line */}
          <div
            className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-surface-muted"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <div
                key={step.index}
                className="relative animate-step-in"
                style={{
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-6 top-4 h-2.5 w-2.5 rounded-full border-2 border-white ${
                    step.status === 'running'
                      ? 'bg-primary-400'
                      : step.status === 'failed'
                        ? 'bg-red-400'
                        : 'bg-emerald-400'
                  }`}
                  aria-hidden="true"
                />
                <StepCard step={step} />
              </div>
            ))}
          </div>

          <div ref={bottomRef} />
        </div>
      )}
    </section>
  );
}
