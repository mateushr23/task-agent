import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

// Suppress console.error from ErrorBoundary.componentDidCatch during tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test explosion');
  }
  return <p>Child is fine</p>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Hello world</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Child is fine')).not.toBeInTheDocument();
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Test explosion')).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', async () => {
    const user = userEvent.setup();

    // We need a component that throws once then stops
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error('Boom');
      }
      return <p>Recovered</p>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    // Error state visible
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    // Stop throwing before clicking retry
    shouldThrow = false;

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    // After reset + re-render, child should render normally
    rerender(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered')).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ProblemChild shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });
});
