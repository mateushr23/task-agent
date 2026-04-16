'use client';

import { useState } from 'react';
import type { TaskSummary } from '@/lib/types';

interface TaskHistoryItemProps {
  task: TaskSummary;
  onSelect: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function formatRelativeDate(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `ha ${diffMin} min`;
  if (diffHr < 24) return `ha ${diffHr}h`;
  if (diffDay < 7) return `ha ${diffDay}d`;
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function StatusDot({ status }: { status: TaskSummary['status'] }) {
  const color =
    status === 'completed'
      ? 'bg-emerald-400'
      : status === 'failed'
        ? 'bg-red-400'
        : 'bg-primary-400 animate-pulse';

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      aria-label={status}
    />
  );
}

export default function TaskHistoryItem({
  task,
  onSelect,
  onDelete,
}: TaskHistoryItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      className="group relative flex w-full flex-col gap-1.5 rounded-xl bg-surface-raised p-3 text-left transition-all duration-150 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
    >
      <p className="line-clamp-2 text-sm text-text-primary pr-6">
        {task.description}
      </p>

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <StatusDot status={task.status} />
        <span>{formatRelativeDate(task.createdAt)}</span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono">
          {task.stepCount} {task.stepCount === 1 ? 'passo' : 'passos'}
        </span>
      </div>

      <span
        role="button"
        tabIndex={0}
        onClick={handleDelete}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleDelete(e);
          }
        }}
        aria-label={confirmDelete ? 'Confirmar exclusao' : 'Excluir tarefa'}
        className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 ${
          confirmDelete
            ? 'bg-red-100 text-red-500'
            : 'text-text-muted opacity-0 hover:bg-surface-muted group-hover:opacity-100'
        }`}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </span>
    </button>
  );
}
