import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from './error-state';

describe('ErrorState', () => {
  it('renders default message when no message prop provided', () => {
    render(<ErrorState />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('Something went wrong. Please try again.')
    ).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    render(<ErrorState message="Failed to load questions" />);

    expect(screen.getByText('Failed to load questions')).toBeInTheDocument();
  });

  it('renders retry button when onRetry callback provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    const retryButton = screen.getByTestId('error-retry-button');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Try Again');
  });

  it('does not render retry button when onRetry not provided', () => {
    render(<ErrorState />);

    expect(screen.queryByTestId('error-retry-button')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByTestId('error-retry-button'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has correct data-testid for testing', () => {
    render(<ErrorState />);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
  });

  it('has correct ARIA role for accessibility', () => {
    render(<ErrorState />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('retry button meets 48px touch target requirement', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    const retryButton = screen.getByTestId('error-retry-button');
    expect(retryButton).toHaveClass('min-h-12');
  });
});
