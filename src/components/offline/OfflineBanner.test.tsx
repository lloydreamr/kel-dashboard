/**
 * @fileoverview Tests for OfflineBanner component
 *
 * Tests the offline status banner display and behavior.
 * Story 10.3: Offline Read-Only Mode (Task 3)
 */

import { render, screen, act } from '@testing-library/react';
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

// Mock FEATURES
const mockOfflineRead = vi.fn();
vi.mock('@/lib/features', () => ({
  FEATURES: {
    get OFFLINE_READ() { return mockOfflineRead(); },
    OFFLINE_MODE: false,
  },
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: online and feature disabled
    mockIsOnline.mockReturnValue(true);
    mockOfflineRead.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('feature flag disabled (AC#6)', () => {
    it('does not render when OFFLINE_READ is false and online', () => {
      mockOfflineRead.mockReturnValue(false);
      mockIsOnline.mockReturnValue(true);

      render(<OfflineBanner />);

      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });

    it('does not render when OFFLINE_READ is false and offline', () => {
      mockOfflineRead.mockReturnValue(false);
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });
  });

  describe('feature flag enabled', () => {
    beforeEach(() => {
      mockOfflineRead.mockReturnValue(true);
    });

    it('does not render when online (AC#5 - auto-dismiss)', () => {
      mockIsOnline.mockReturnValue(true);

      render(<OfflineBanner />);

      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });

    it('renders when offline and feature enabled (AC#5)', () => {
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    });

    it('shows correct message text (AC#5)', () => {
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.getByText("You're offline - viewing cached data")).toBeInTheDocument();
    });
  });

  describe('styling (AC#5)', () => {
    beforeEach(() => {
      mockOfflineRead.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);
    });

    it('has yellow background color', () => {
      render(<OfflineBanner />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveClass('bg-yellow-100');
    });

    it('has yellow text color', () => {
      render(<OfflineBanner />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveClass('text-yellow-800');
    });

    it('accepts custom className', () => {
      render(<OfflineBanner className="custom-class" />);

      const banner = screen.getByTestId('offline-banner');
      expect(banner).toHaveClass('custom-class');
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

    it('has wifi icon with aria-hidden', () => {
      render(<OfflineBanner />);

      const icon = document.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('data-testid (AC#5)', () => {
    it('has correct test id for E2E tests', () => {
      mockOfflineRead.mockReturnValue(true);
      mockIsOnline.mockReturnValue(false);

      render(<OfflineBanner />);

      expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    });
  });

  describe('reconnection state (AC#4)', () => {
    beforeEach(() => {
      mockOfflineRead.mockReturnValue(true);
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows "Back online – syncing..." message when reconnected', () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      expect(screen.getByText("You're offline - viewing cached data")).toBeInTheDocument();

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      expect(screen.getByText('Back online – syncing...')).toBeInTheDocument();
    });

    it('has green styling and offline-banner-reconnected test ID when reconnected (AC#4)', () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Per AC#4: Uses offline-banner-reconnected test ID when reconnecting
      const banner = screen.getByTestId('offline-banner-reconnected');
      expect(banner).toHaveClass('bg-green-100');
      expect(banner).toHaveClass('text-green-800');
    });

    it('auto-dismisses after 2 seconds', async () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Per AC#4: Uses offline-banner-reconnected when reconnecting
      expect(screen.getByTestId('offline-banner-reconnected')).toBeInTheDocument();

      // Advance timer past dismiss delay (wrapped in act)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Both test IDs should be gone after dismissal
      expect(screen.queryByTestId('offline-banner-reconnected')).not.toBeInTheDocument();
      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });

    it('does not show reconnection message if never was offline', () => {
      // Start online
      mockIsOnline.mockReturnValue(true);
      render(<OfflineBanner />);

      // Should not show any banner
      expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
    });

    it('shows Wifi icon when reconnected', () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      // Should have an icon (Wifi for reconnected vs WifiOff for offline)
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('clears reconnection state if goes offline again', () => {
      // Start offline
      mockIsOnline.mockReturnValue(false);
      const { rerender } = render(<OfflineBanner />);

      // Reconnect
      mockIsOnline.mockReturnValue(true);
      rerender(<OfflineBanner />);

      expect(screen.getByText('Back online – syncing...')).toBeInTheDocument();

      // Go offline again before auto-dismiss
      mockIsOnline.mockReturnValue(false);
      rerender(<OfflineBanner />);

      // Should show offline message, not reconnection message
      expect(screen.getByText("You're offline - viewing cached data")).toBeInTheDocument();
    });
  });
});
