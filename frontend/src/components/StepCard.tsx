'use client';

import { useState } from 'react';
import type { TaskStep } from '@/lib/types';

const TOOL_LABELS: Record<string, string> = {
  web_search: 'Busca Web',
  read_url: 'Leitura de URL',
  format_data: 'Formatacao de Dados',
};

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName;
}

function ToolIcon({ toolName }: { toolName: string }) {
  const iconClass = 'h-5 w-5 flex-shrink-0';

  if (toolName === 'web_search') {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    );
  }

  if (toolName === 'read_url') {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    );
  }

  if (toolName === 'format_data') {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
      </svg>
    );
  }

  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

interface StepCardProps {
  step: TaskStep;
}

export default function StepCard({ step }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputExpanded, setInputExpanded] = useState(false);

  const isRunning = step.status === 'running';
  const isCompleted = step.status === 'completed';
  const isFailed = step.status === 'failed';

  const borderColor = isRunning
    ? 'border-primary-200 animate-pulse'
    : isFailed
      ? 'border-red-200'
      : 'border-surface-muted';

  const bgColor = isFailed
    ? 'bg-red-50/50'
    : isCompleted
      ? 'bg-surface-raised'
      : 'bg-surface-raised';

  const durationLabel =
    step.durationMs != null
      ? step.durationMs < 1000
        ? `${step.durationMs}ms`
        : `${(step.durationMs / 1000).toFixed(1)}s`
      : null;

  return (
    <div
      className={`rounded-xl border ${borderColor} ${bgColor} p-4 transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 ${
            isRunning
              ? 'text-primary-400'
              : isFailed
                ? 'text-red-400'
                : 'text-emerald-500'
          }`}
        >
          {isRunning ? (
            <svg
              className="h-5 w-5 animate-spin"
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
          ) : isFailed ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6" />
              <path d="M9 9l6 6" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <ToolIcon toolName={step.toolName} />
            <span className="text-sm font-medium text-text-primary">
              {getToolLabel(step.toolName)}
            </span>
            {durationLabel && (
              <span className="ml-auto text-xs font-mono text-text-muted">
                {durationLabel}
              </span>
            )}
          </div>

          {isFailed && step.error && (
            <p className="mt-2 text-xs text-red-600">{step.error}</p>
          )}

          {isCompleted && step.result && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary-500 hover:text-primary-600 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
              >
                {expanded ? 'ver menos' : 'ver mais'}
              </button>
              {expanded && (
                <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-surface-muted p-3 text-xs font-mono text-text-secondary whitespace-pre-wrap wrap-break-word">
                  {step.result}
                </pre>
              )}
              {!expanded && (
                <p className="mt-1 text-xs text-text-muted line-clamp-2">
                  {step.result}
                </p>
              )}
            </div>
          )}

          {Object.keys(step.toolInput).length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setInputExpanded(!inputExpanded)}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
              >
                {inputExpanded ? 'ocultar input' : 'ver input'}
              </button>
              {inputExpanded && (
                <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-surface-muted p-2 text-xs font-mono text-text-muted whitespace-pre-wrap wrap-break-word">
                  {JSON.stringify(step.toolInput, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
