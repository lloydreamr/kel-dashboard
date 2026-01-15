/**
 * @fileoverview Tests for OfflineBanner component
 *
 * Tests the offline status banner display and behavior.
 * Story 8.5: Offline Banner Component
 * - AC1: Offline Detection
 * - AC2: Banner Content (message + queue count)
 * - AC3: Syncing State (spinner, "Back online", auto-dismiss)
 * - AC4: Online State (no banner)
 * - AC5: Test IDs
 */

import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { OfflineBanner } from './OfflineBanner';

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

// Mock useOnlineStatus hook
const mockIsOnline = vi.fn();
vi.mock('@/hooks/offline', () => ({
  useOnlineStatus: () => ({ isOnline: mockIsOnline() }),
}));

// Mock FEATURES - both OFFLINE_READ and OFFLINE_MODE
const mockOfflineRead = vi.fn();
const mockOfflineMode = vi.fn();
vi.mock('@/lib/features', () => ({
  FEATURES: {
    get OFFLINE_READ() { return mockOfflineRead(); },
    get OFFLINE_MODE() { return mockOfflineMode(); },
  },
}));

// Mock getCount from offline queue
const mockGetCount = vi.fn();
vi.mock('@/lib/offline', () => ({
  getCount: () => mockGetCount(),
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: online and features disabled
    mockIsOnline.mockReturnValue(true);
    mockOfflineRead.mockReturnValue(false);
    mockOfflineMode.mockReturnValue(false);
    mockGetCount.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC1: Offline Detection', () => {
    it('renders when offline and OFFLINE_READ is enabled', () => {
      mockOfflineRead.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    });

    it('renders when offline and OFFLINE_MODE is enabled', () => {
      mockOfflineMode.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    });

    it('renders when offline and both flags are enabled', () => {
      mockOfflineRead.mockReturnValue(true);
      mockOfflineMode.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    });
  });

  describe('AC2: Banner Content', () => {
    beforeEach(() => {
      mockOfflineRead.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);
    });

    it('shows correct offline message', () => {
      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner-message')).toHaveTextContent(
        "You're offline. Actions will sync when connected."
      );
    });

    it('has amber/orange background color per UX spec', () => {
      render(<OfflineBanner />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveClass('bg-amber-100');
      expect(banner).toHaveClass('text-amber-800');
    });

    it('has 48px min-height for touch targets', () => {
      render(<OfflineBanner />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveClass('min-h-[48px]');
    });

    it('shows WifiOff icon when offline', () => {
      render(<OfflineBanner />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('AC2: Queue Count Display', () => {
    beforeEach(() => {
      mockOfflineMode.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);
    });

    it('shows queue count when OFFLINE_MODE is enabled and count > 0', async () => {
      mockGetCount.mockResolvedValue(3);

      render(<OfflineBanner />);

      // Wait for async getCount to resolve and state to update
      await waitFor(() => {
        expect(screen.getByTestId('offline-banner-queue-count')).toHaveTextContent('3 pending actions');
      });
    });

    it('shows singular "action" when count is 1', async () => {
      mockGetCount.mockResolvedValue(1);

      render(<OfflineBanner />);

      await waitFor(() => {
        expect(screen.getByTestId('offline-banner-queue-count')).toHaveTextContent('1 pending action');
      });
    });

    it('does not show queue count when count is 0', async () => {
      mockGetCount.mockResolvedValue(0);

      render(<OfflineBanner />);

      // Wait a tick for the async operation to complete
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.queryByTestId('offline-banner-queue-count')).not.toBeInTheDocument();
    });

    it('does not show queue count when OFFLINE_MODE is disabled', async () => {
      mockOfflineMode.mockReturnValue(false);
      mockOfflineRead.mockReturnValue(true);
      mockGetCount.mockResolvedValue(5);

      render(<OfflineBanner />);

      // Wait a tick for the async operation to complete
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.queryByTestId('offline-banner-queue-count')).not.toBeInTheDocument();
    });

    it('calls getCount when offline with OFFLINE_MODE enabled', async () => {
      mockGetCount.mockResolvedValue(2);

      render(<OfflineBanner />);

      await waitFor(() => {
        expect(mockGetCount).toHaveBeenCalled();
      });
    });
  });

  describe('AC3: Syncing State', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockOfflineRead.mockReturnValue(true);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows syncing state with spinner when reconnecting', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Should show syncing state
      expect(screen.getByTestId('offline-banner-syncing')).toBeInTheDocument();
      expect(screen.getByTestId('offline-banner-message')).toHaveTextContent('Syncing...');
    });

    it('transitions from syncing to success state', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Initially syncing
      expect(screen.getByTestId('offline-banner-syncing')).toBeInTheDocument();

      // Advance past sync simulation (1 second)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Should show success state
      expect(screen.getByTestId('offline-banner-online')).toBeInTheDocument();
      expect(screen.getByTestId('offline-banner-message')).toHaveTextContent('✓ Back online');
    });

    it('has green styling when showing success message', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Advance past sync simulation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      const banner = screen.getByTestId('offline-banner-online');
      expect(banner).toHaveClass('bg-green-100');
      expect(banner).toHaveClass('text-green-800');
    });

    it('auto-dismisses success message after ~3 seconds (AC3)', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Advance past sync simulation (1 second)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByTestId('offline-banner-online')).toBeInTheDocument();

      // Advance past auto-dismiss delay (3 seconds)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      expect(screen.queryByTestId('offline-banner-online')).not.toBeInTheDocument();
      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });

    it('allows custom success dismiss delay', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner successDismissDelay={5000} />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner successDismissDelay={5000} />);

      // Advance past sync simulation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Advance 3 seconds - should still be visible
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(screen.getByTestId('offline-banner-online')).toBeInTheDocument();

      // Advance remaining 2 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.queryByTestId('offline-banner-online')).not.toBeInTheDocument();
    });
  });

  describe('AC4: Online State', () => {
    it('does not render when online with no prior offline state', () => {
      mockOfflineRead.mockReturnValue(true);
      mockIsOnline.mockReturnValue(true);

      render(<OfflineBanner />);

      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });

    it('does not render when all feature flags are disabled', () => {
      mockOfflineRead.mockReturnValue(false);
      mockOfflineMode.mockReturnValue(false);
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });
  });

  describe('AC5: Test IDs', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockOfflineMode.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);
      mockGetCount.mockResolvedValue(2);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('has data-testid="offline-banner" on container when offline', () => {
      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    });

    it('has data-testid="offline-banner-message" on message text', () => {
      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner-message')).toBeInTheDocument();
    });

    it('has data-testid="offline-banner-queue-count" on count display', async () => {
      // Use real timers for this test since we need async resolution
      vi.useRealTimers();

      render(<OfflineBanner />);

      await waitFor(() => {
        expect(screen.getByTestId('offline-banner-queue-count')).toBeInTheDocument();
      });

      // Restore fake timers for subsequent tests
      vi.useFakeTimers();
    });

    it('has data-testid="offline-banner-syncing" on syncing indicator', async () => {
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner-syncing')).toBeInTheDocument();
    });

    it('has data-testid="offline-banner-online" on success message', async () => {
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Advance past sync simulation
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByTestId('offline-banner-online')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockOfflineRead.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);
    });

    it('has role="alert" for screen readers', () => {
      render(<OfflineBanner />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveAttribute('role', 'alert');
    });

    it('has aria-live="polite" for announcements', () => {
      render(<OfflineBanner />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveAttribute('aria-live', 'polite');
    });

    it('accepts custom className', () => {
      render(<OfflineBanner className="custom-class" />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveClass('custom-class');
    });
  });

  describe('state transitions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockOfflineRead.mockReturnValue(true);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('clears success state if goes offline again', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Advance to success state
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByTestId('offline-banner-online')).toBeInTheDocument();

      // Go offline again before auto-dismiss
      mockIsOnline.mockReturnValue(false);
      rerender(<OfflineBanner />);

      // Should show offline message, not success
      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
      expect(screen.getByTestId('offline-banner-message')).toHaveTextContent(
        "You're offline. Actions will sync when connected."
      );
    });

    it('shows Wifi icon when reconnected/success', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Advance to success state
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Should have an icon
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});
