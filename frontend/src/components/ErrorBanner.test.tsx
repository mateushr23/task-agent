import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBanner from './ErrorBanner';

describe('ErrorBanner', () => {
  it('renders error message', () => {
    render(<ErrorBanner message="Something broke" onRetry={vi.fn()} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorBanner message="fail" onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('dismisses when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorBanner message="fail" onRetry={vi.fn()} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows rate limit variant with amber styling and different message', () => {
    render(
      <ErrorBanner
        message="original error"
        onRetry={vi.fn()}
        rateLimitInfo={{ message: 'Rate limited', retryAfter: '30 segundos' }}
      />
    );

    const alert = screen.getByRole('alert');

    // Shows rate limit heading instead of generic error
    expect(screen.getByText('Limite de requisicoes atingido')).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();

    // Shows retry-after info
    expect(screen.getByText('30 segundos')).toBeInTheDocument();

    // Has amber styling (border-amber instead of border-red)
    expect(alert.className).toContain('amber');
  });
});
