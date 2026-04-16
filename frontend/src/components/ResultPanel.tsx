'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useTask } from '@/contexts/TaskContext';

export default function ResultPanel() {
  const { result, status } = useTask();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may fail in insecure contexts */
    }
  }, [result]);

  if (!result || status === 'running') return null;

  return (
    <section
      aria-label="Resultado"
      className="w-full animate-slide-up"
    >
      <div className="rounded-2xl border border-primary-100 bg-surface-raised p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-primary-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3l1.09 3.26L16.36 7.5l-3.27 1.09L12 11.85l-1.09-3.26L7.64 7.5l3.27-1.09L12 3z" />
              <path d="M18 12l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7L18 12z" />
              <path d="M7 16l.5 1.5 1.5.5-1.5.5L7 20l-.5-1.5L5 18l1.5-.5L7 16z" />
            </svg>
            <h2 className="text-base font-semibold text-text-primary">
              Resultado
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-surface-muted bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-150 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 active:scale-[0.98]"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copiar
              </>
            )}
          </button>
        </div>

        <div className="prose-task">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {result}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
