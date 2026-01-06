/**
 * @fileoverview Tests for OfflineBanner component
 *
 * Tests the offline status banner display and behavior.
 * Story 10.3: Offline Read-Only Mode (Task 3)
 */

import { render, screen } from '@testing-library/react';
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
});
