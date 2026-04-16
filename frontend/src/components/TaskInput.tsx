'use client';

import { useState, useCallback } from 'react';
import { useTask } from '@/contexts/TaskContext';

const MAX_CHARS = 2000;

export default function TaskInput() {
  const { submitTask, status } = useTask();
  const [value, setValue] = useState('');
  const isRunning = status === 'running';
  const overLimit = value.length > MAX_CHARS;
  const canSubmit = value.trim().length > 0 && !isRunning && !overLimit;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const desc = value.trim();
    setValue('');
    submitTask(desc);
  }, [canSubmit, value, submitTask]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva sua tarefa... Ex: Busque os precos de 3 smartphones e compare em uma tabela"
          rows={3}
          disabled={isRunning}
          className="w-full resize-none rounded-xl border border-surface-muted bg-white px-4 py-3 text-text-primary placeholder:text-text-muted transition-shadow duration-150 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Descricao da tarefa"
        />

        <span
          className={`absolute bottom-3 right-3 text-xs font-mono transition-colors duration-150 ${
            overLimit
              ? 'text-red-500'
              : value.length > MAX_CHARS * 0.9
                ? 'text-primary-500'
                : 'text-text-muted'
          }`}
          aria-live="polite"
        >
          {value.length} / {MAX_CHARS}
        </span>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Spinner />
              Executando...
            </>
          ) : (
            'Executar'
          )}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-75"
      />
    </svg>
  );
}
