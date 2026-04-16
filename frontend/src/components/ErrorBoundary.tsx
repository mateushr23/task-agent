'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-red-200 p-8 text-center max-w-md">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Algo deu errado
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {this.state.error?.message || 'Erro inesperado na aplicacao.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-xl bg-[var(--color-primary-500)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-600)] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
