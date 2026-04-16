'use client';

import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="w-full animate-fade-in rounded-xl border border-red-200/60 bg-red-50/60 p-4"
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-700">Algo deu errado</p>
          <p className="mt-1 text-xs text-red-600/80">{message}</p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar erro"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors duration-150 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-600 transition-all duration-150 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 active:scale-[0.98]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
