import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SyncStatusIndicator } from './SyncStatusIndicator';

import type { SyncStatus } from './SyncStatusIndicator';

// Mock framer-motion to avoid animation timing issues
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initial, animate, exit, transition,
      ...htmlProps
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...htmlProps}>{children}</div>
    ),
  },
}));

describe('SyncStatusIndicator', () => {
  describe('idle state', () => {
    it('renders nothing when status is idle', () => {
      render(<SyncStatusIndicator status="idle" trigger={0} />);

      expect(screen.queryByTestId('sync-status-indicator')).not.toBeInTheDocument();
    });

    it('still renders nothing when trigger increments but status is idle', () => {
      render(<SyncStatusIndicator status="idle" trigger={5} />);

      expect(screen.queryByTestId('sync-status-indicator')).not.toBeInTheDocument();
    });
  });

  describe('saving state', () => {
    it('renders saving indicator when status is saving', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      expect(screen.getByTestId('sync-status-indicator')).toBeInTheDocument();
    });

    it('shows "Saving..." text', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays spinner icon', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      const spinner = indicator.querySelector('[data-testid="sync-spinner"]');
      expect(spinner).toBeInTheDocument();
    });

    it('does not show retry button', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      expect(screen.queryByTestId('sync-retry-button')).not.toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('renders success indicator when status is success', () => {
      render(<SyncStatusIndicator status="success" trigger={1} />);

      expect(screen.getByTestId('sync-status-indicator')).toBeInTheDocument();
    });

    it('shows "Saved" text', () => {
      render(<SyncStatusIndicator status="success" trigger={1} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('displays checkmark icon', () => {
      render(<SyncStatusIndicator status="success" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      const checkmark = indicator.querySelector('[data-testid="sync-checkmark"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('does not show retry button', () => {
      render(<SyncStatusIndicator status="success" trigger={1} />);

      expect(screen.queryByTestId('sync-retry-button')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error indicator when status is error', () => {
      render(<SyncStatusIndicator status="error" trigger={1} />);

      expect(screen.getByTestId('sync-status-indicator')).toBeInTheDocument();
    });

    it('shows "⚠ Retry" text per AC2', () => {
      render(<SyncStatusIndicator status="error" trigger={1} />);

      expect(screen.getByText('⚠ Retry')).toBeInTheDocument();
    });

    it('displays error icon', () => {
      render(<SyncStatusIndicator status="error" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      const errorIcon = indicator.querySelector('[data-testid="sync-error-icon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('shows retry button when onRetry provided', () => {
      const handleRetry = vi.fn();
      render(<SyncStatusIndicator status="error" trigger={1} onRetry={handleRetry} />);

      expect(screen.getByTestId('sync-retry-button')).toBeInTheDocument();
    });

    it('does not show retry button when onRetry not provided', () => {
      render(<SyncStatusIndicator status="error" trigger={1} />);

      expect(screen.queryByTestId('sync-retry-button')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button clicked', () => {
      const handleRetry = vi.fn();
      render(<SyncStatusIndicator status="error" trigger={1} onRetry={handleRetry} />);

      fireEvent.click(screen.getByTestId('sync-retry-button'));

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('retry button has minimum 48px touch target', () => {
      const handleRetry = vi.fn();
      render(<SyncStatusIndicator status="error" trigger={1} onRetry={handleRetry} />);

      const retryButton = screen.getByTestId('sync-retry-button');
      expect(retryButton).toHaveClass('min-h-[48px]');
    });
  });

  describe('trigger behavior', () => {
    it('does not render when trigger is 0 even with non-idle status', () => {
      // trigger=0 means "don't show yet" - initial mount state
      render(<SyncStatusIndicator status="saving" trigger={0} />);

      expect(screen.queryByTestId('sync-status-indicator')).not.toBeInTheDocument();
    });

    it('renders when trigger > 0 and status is non-idle', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      expect(screen.getByTestId('sync-status-indicator')).toBeInTheDocument();
    });

    it('re-renders with new state when trigger increments', () => {
      const { rerender } = render(<SyncStatusIndicator status="saving" trigger={1} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      rerender(<SyncStatusIndicator status="success" trigger={2} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-live="polite" for screen reader announcements', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('has appropriate role for status updates', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
    });

    it('retry button has accessible label', () => {
      const handleRetry = vi.fn();
      render(<SyncStatusIndicator status="error" trigger={1} onRetry={handleRetry} />);

      const retryButton = screen.getByTestId('sync-retry-button');
      expect(retryButton).toHaveAttribute('aria-label', 'Retry sync');
    });
  });

  describe('styling', () => {
    it('applies correct color for success state', () => {
      render(<SyncStatusIndicator status="success" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      expect(indicator).toHaveClass('text-success');
    });

    it('applies correct color for error state', () => {
      render(<SyncStatusIndicator status="error" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      expect(indicator).toHaveClass('text-destructive');
    });

    it('applies muted color for saving state', () => {
      render(<SyncStatusIndicator status="saving" trigger={1} />);

      const indicator = screen.getByTestId('sync-status-indicator');
      expect(indicator).toHaveClass('text-muted-foreground');
    });
  });
});

// Type export test - ensures the type is exported correctly
describe('SyncStatus type', () => {
  it('accepts valid status values', () => {
    const statuses: SyncStatus[] = ['idle', 'saving', 'success', 'error'];
    expect(statuses).toHaveLength(4);
  });
});
