/**
 * @fileoverview Tests for OfflineSyncIndicator component
 *
 * Tests the per-item sync status indicator for offline queue items.
 * Story 8.6: Full Sync Status Indicators
 * - AC1: Sync Status Display (synced, pending, retry, conflict)
 * - AC2: Tooltip content for pending items
 * - AC3: Conflict interaction opens dialog
 * - AC4: Test IDs for all indicators
 * - AC5: Feature flag guard
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { OfflineSyncIndicator } from './OfflineSyncIndicator';

import type { OfflineSyncStatus } from './OfflineSyncIndicator';

// Mock FEATURES
const mockOfflineMode = vi.fn();
vi.mock('@/lib/features', () => ({
  FEATURES: {
    get OFFLINE_MODE() { return mockOfflineMode(); },
  },
}));

// Mock tooltip for simpler testing (tooltips are hard to test without pointer events)
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: React.PropsWithChildren<{ asChild?: boolean }>) => (
    <>{asChild ? children : <button>{children}</button>}</>
  ),
}));

describe('OfflineSyncIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: feature enabled
    mockOfflineMode.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC1: Sync Status Display', () => {
    it('renders synced icon with green color', () => {
      render(<OfflineSyncIndicator status="synced" />);

      const icon = screen.getByTestId('sync-indicator-synced');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-success');
    });

    it('renders pending icon with gray color and animation', () => {
      render(<OfflineSyncIndicator status="pending" />);

      const icon = screen.getByTestId('sync-indicator-pending');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-muted-foreground');
      expect(icon).toHaveClass('animate-spin');
    });

    it('renders retry icon with amber/warning color', () => {
      render(<OfflineSyncIndicator status="retry" />);

      const icon = screen.getByTestId('sync-indicator-retry');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-warning');
    });

    it('renders conflict icon with red/destructive color', () => {
      render(<OfflineSyncIndicator status="conflict" />);

      const icon = screen.getByTestId('sync-indicator-conflict');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-destructive');
    });

    it.each([
      ['synced', 'sync-indicator-synced'],
      ['pending', 'sync-indicator-pending'],
      ['retry', 'sync-indicator-retry'],
      ['conflict', 'sync-indicator-conflict'],
    ] as const)('renders %s status with correct icon', (status, testId) => {
      render(<OfflineSyncIndicator status={status as OfflineSyncStatus} />);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  describe('AC2: Tooltip Content', () => {
    it('shows "Saved to server" tooltip for synced status', () => {
      render(<OfflineSyncIndicator status="synced" />);

      const tooltip = screen.getByTestId('tooltip-content');
      expect(tooltip).toHaveTextContent('Saved to server');
    });

    it('shows "Waiting to sync" tooltip for pending status', () => {
      render(<OfflineSyncIndicator status="pending" />);

      const tooltip = screen.getByTestId('tooltip-content');
      expect(tooltip).toHaveTextContent('Waiting to sync');
    });

    it('shows "Sync failed. Will retry automatically." tooltip for retry status', () => {
      render(<OfflineSyncIndicator status="retry" />);

      const tooltip = screen.getByTestId('tooltip-content');
      expect(tooltip).toHaveTextContent('Sync failed. Will retry automatically.');
    });

    it('shows "Conflict detected. Tap to resolve." tooltip for conflict status', () => {
      render(<OfflineSyncIndicator status="conflict" />);

      const tooltip = screen.getByTestId('tooltip-content');
      expect(tooltip).toHaveTextContent('Conflict detected. Tap to resolve.');
    });
  });

  describe('AC3: Conflict Interaction', () => {
    it('calls onConflictClick when conflict indicator is clicked', () => {
      const onConflictClick = vi.fn();
      render(
        <OfflineSyncIndicator status="conflict" onConflictClick={onConflictClick} />
      );

      const button = screen.getByRole('status');
      fireEvent.click(button);

      expect(onConflictClick).toHaveBeenCalledTimes(1);
    });

    it('conflict indicator is a focusable button', () => {
      render(<OfflineSyncIndicator status="conflict" />);

      const button = screen.getByRole('status');
      expect(button.tagName).toBe('BUTTON');
    });

    it('conflict indicator stops event propagation', () => {
      const onConflictClick = vi.fn();
      const parentClick = vi.fn();

      render(
        <div onClick={parentClick}>
          <OfflineSyncIndicator status="conflict" onConflictClick={onConflictClick} />
        </div>
      );

      const button = screen.getByRole('status');
      fireEvent.click(button);

      expect(onConflictClick).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });

    it('conflict indicator has 48px touch target', () => {
      render(<OfflineSyncIndicator status="conflict" />);

      const button = screen.getByRole('status');
      expect(button).toHaveClass('min-h-12');
      expect(button).toHaveClass('min-w-12');
    });

    it('non-conflict statuses do not call onConflictClick', () => {
      const onConflictClick = vi.fn();
      render(<OfflineSyncIndicator status="pending" onConflictClick={onConflictClick} />);

      // Non-conflict indicators are not buttons
      const indicator = screen.getByRole('status');
      fireEvent.click(indicator);

      expect(onConflictClick).not.toHaveBeenCalled();
    });
  });

  describe('AC4: Test IDs', () => {
    it('has data-testid="sync-indicator-synced" for synced status', () => {
      render(<OfflineSyncIndicator status="synced" />);
      expect(screen.getByTestId('sync-indicator-synced')).toBeInTheDocument();
    });

    it('has data-testid="sync-indicator-pending" for pending status', () => {
      render(<OfflineSyncIndicator status="pending" />);
      expect(screen.getByTestId('sync-indicator-pending')).toBeInTheDocument();
    });

    it('has data-testid="sync-indicator-retry" for retry status', () => {
      render(<OfflineSyncIndicator status="retry" />);
      expect(screen.getByTestId('sync-indicator-retry')).toBeInTheDocument();
    });

    it('has data-testid="sync-indicator-conflict" for conflict status', () => {
      render(<OfflineSyncIndicator status="conflict" />);
      expect(screen.getByTestId('sync-indicator-conflict')).toBeInTheDocument();
    });
  });

  describe('AC5: Feature Flag Guard', () => {
    it('renders nothing when OFFLINE_MODE is disabled', () => {
      mockOfflineMode.mockReturnValue(false);

      const { container } = render(<OfflineSyncIndicator status="synced" />);

      expect(container).toBeEmptyDOMElement();
    });

    it('renders indicator when OFFLINE_MODE is enabled', () => {
      mockOfflineMode.mockReturnValue(true);

      render(<OfflineSyncIndicator status="synced" />);

      expect(screen.getByTestId('sync-indicator-synced')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status" on all indicators', () => {
      render(<OfflineSyncIndicator status="pending" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label describing the status', () => {
      render(<OfflineSyncIndicator status="pending" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Waiting to sync');
    });

    it('icons have aria-hidden="true"', () => {
      render(<OfflineSyncIndicator status="synced" />);

      const icon = screen.getByTestId('sync-indicator-synced');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it.each([
      ['synced', 'Synced to server'],
      ['pending', 'Waiting to sync'],
      ['retry', 'Sync failed, will retry'],
      ['conflict', 'Conflict detected, tap to resolve'],
    ] as const)('has correct aria-label for %s status', (status, expectedLabel) => {
      render(<OfflineSyncIndicator status={status as OfflineSyncStatus} />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', expectedLabel);
    });
  });

  describe('styling', () => {
    it('conflict button has focus ring styles', () => {
      render(<OfflineSyncIndicator status="conflict" />);

      const button = screen.getByRole('status');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('conflict button has hover state', () => {
      render(<OfflineSyncIndicator status="conflict" />);

      const button = screen.getByRole('status');
      expect(button).toHaveClass('hover:bg-destructive/10');
    });

    it('all icons use consistent size (h-4 w-4)', () => {
      const { rerender } = render(<OfflineSyncIndicator status="synced" />);
      expect(screen.getByTestId('sync-indicator-synced')).toHaveClass('h-4', 'w-4');

      rerender(<OfflineSyncIndicator status="pending" />);
      expect(screen.getByTestId('sync-indicator-pending')).toHaveClass('h-4', 'w-4');

      rerender(<OfflineSyncIndicator status="retry" />);
      expect(screen.getByTestId('sync-indicator-retry')).toHaveClass('h-4', 'w-4');

      rerender(<OfflineSyncIndicator status="conflict" />);
      expect(screen.getByTestId('sync-indicator-conflict')).toHaveClass('h-4', 'w-4');
    });
  });
});
