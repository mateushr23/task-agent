'use client';

import { useState } from 'react';
import { TaskProvider, useTask } from '@/contexts/TaskContext';
import Header from '@/components/Header';
import TaskInput from '@/components/TaskInput';
import StepPanel from '@/components/StepPanel';
import ResultPanel from '@/components/ResultPanel';
import ErrorBanner from '@/components/ErrorBanner';
import HistorySidebar from '@/components/HistorySidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TaskWorkspace() {
  const { error, status, retry, rateLimitInfo } = useTask();
  const showError = status === 'failed' && error;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:py-8">
      <TaskInput />

      {showError && (
        <ErrorBanner
          message={error}
          onRetry={retry}
          rateLimitInfo={rateLimitInfo}
        />
      )}

      <StepPanel />
      <ResultPanel />
    </main>
  );
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <Header
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      <div className="relative flex flex-1">
        <HistorySidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div
          className={`flex-1 transition-[margin] duration-200 ${
            sidebarOpen ? 'md:ml-[320px]' : 'md:ml-0'
          }`}
        >
          <ErrorBoundary>
            <TaskWorkspace />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TaskProvider>
      <AppShell />
    </TaskProvider>
  );
}
