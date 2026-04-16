'use client';

import { useTask } from '@/contexts/TaskContext';
import TaskHistoryItem from './TaskHistoryItem';

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function HistorySidebar({ open, onClose }: HistorySidebarProps) {
  const { history, historyLoading, loadTaskFromHistory, removeFromHistory } =
    useTask();

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-[60px] z-40 flex h-[calc(100dvh-60px)] w-full flex-col bg-surface-muted transition-transform duration-200 ease-out md:w-[320px] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Historico de tarefas"
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-surface-muted px-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Historico
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar historico"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors duration-150 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {historyLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-white/60"
                />
              ))}
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
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
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p className="text-sm text-text-muted">
                Nenhuma tarefa no historico
              </p>
            </div>
          )}

          {!historyLoading && history.length > 0 && (
            <div className="flex flex-col gap-2">
              {history.map((task) => (
                <TaskHistoryItem
                  key={task.id}
                  task={task}
                  onSelect={(id) => {
                    loadTaskFromHistory(id);
                    onClose();
                  }}
                  onDelete={removeFromHistory}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
