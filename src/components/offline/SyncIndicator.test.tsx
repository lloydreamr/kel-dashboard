/**
 * SyncIndicator Component Tests
 *
 * Tests for the sync status indicator with colored dot,
 * tooltip, and refresh button.
 * Story 10.4: Offline Detection & Sync Indicator (Task 2)
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SyncIndicator } from './SyncIndicator';
import type { SyncState } from '@/hooks/offline';
import * as features from '@/lib/features';

// Mock dependencies
vi.mock('@/lib/features', () => ({
  FEATURES: {
    OFFLINE_READ: true,
    OFFLINE_MODE: false,
  },
}));

const mockUpdateSyncTime = vi.fn();
const mockUseSyncStatus = vi.fn();

vi.mock('@/hooks/offline', async () => {
  const actual = await vi.importActual('@/hooks/offline');
  return {
    ...actual,
    useSyncStatus: () => mockUseSyncStatus(),
  };
});

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(features.FEATURES).OFFLINE_READ = true;
    mockUseSyncStatus.mockReturnValue({
      lastSync: new Date(),
      syncState: 'fresh' as SyncState,
      timeSinceSync: 'just now',
      updateSyncTime: mockUpdateSyncTime,
    });
  });

  describe('rendering', () => {
    it('renders sync indicator with state-specific test ID', () => {
      render(<SyncIndicator />);

      expect(screen.getByTestId('sync-indicator')).toBeInTheDocument();
      // Per AC#1: When fresh, shows sync-indicator-online
      expect(screen.getByTestId('sync-indicator-online')).toBeInTheDocument();
    });

    it('renders refresh button with 48px touch target', () => {
      render(<SyncIndicator onRefresh={vi.fn()} />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toBeInTheDocument();
      // Check that button has appropriate size class for 48px target
      expect(button).toHaveClass('h-12', 'w-12');
    });

    it('does not render when feature flag is disabled', () => {
      vi.mocked(features.FEATURES).OFFLINE_READ = false;

      render(<SyncIndicator />);

      expect(screen.queryByTestId('sync-indicator')).not.toBeInTheDocument();
    });
  });

  describe('sync state colors', () => {
    it('shows green dot with sync-indicator-online test ID when fresh (AC#1)', () => {
      mockUseSyncStatus.mockReturnValue({
        lastSync: new Date(),
        syncState: 'fresh' as SyncState,
        timeSinceSync: 'just now',
        updateSyncTime: mockUpdateSyncTime,
      });

      render(<SyncIndicator />);

      const dot = screen.getByTestId('sync-indicator-online');
      expect(dot).toHaveClass('bg-green-500');
    });

    it('shows yellow dot with sync-indicator-stale test ID when stale (AC#2)', () => {
      mockUseSyncStatus.mockReturnValue({
        lastSync: new Date(Date.now() - 120000),
        syncState: 'stale' as SyncState,
        timeSinceSync: '2 min ago',
        updateSyncTime: mockUpdateSyncTime,
      });

      render(<SyncIndicator />);

      const dot = screen.getByTestId('sync-indicator-stale');
      expect(dot).toHaveClass('bg-yellow-500');
    });

    it('shows gray dot with sync-indicator-offline test ID when offline (AC#3)', () => {
      mockUseSyncStatus.mockReturnValue({
        lastSync: new Date(),
        syncState: 'offline' as SyncState,
        timeSinceSync: 'just now',
        updateSyncTime: mockUpdateSyncTime,
      });

      render(<SyncIndicator />);

      const dot = screen.getByTestId('sync-indicator-offline');
      expect(dot).toHaveClass('bg-gray-400');
    });
  });

  describe('tooltip', () => {
    it('shows time since sync in tooltip on hover', async () => {
      const user = userEvent.setup();
      mockUseSyncStatus.mockReturnValue({
        lastSync: new Date(),
        syncState: 'fresh' as SyncState,
        timeSinceSync: '5 min ago',
        updateSyncTime: mockUpdateSyncTime,
      });

      render(<SyncIndicator />);

      const trigger = screen.getByTestId('sync-indicator');
      await user.hover(trigger);

      // Tooltip content should show the time
      expect(await screen.findByText(/5 min ago/i)).toBeInTheDocument();
    });

    it('shows sync status label in tooltip', async () => {
      const user = userEvent.setup();
      mockUseSyncStatus.mockReturnValue({
        lastSync: new Date(),
        syncState: 'fresh' as SyncState,
        timeSinceSync: 'just now',
        updateSyncTime: mockUpdateSyncTime,
      });

      render(<SyncIndicator />);

      // Hover on the tooltip trigger (the inner div with cursor-default)
      const tooltipTrigger = screen.getByTestId('sync-indicator').querySelector('[data-state]');
      await user.hover(tooltipTrigger!);

      // Tooltip content includes both label and time (Radix renders multiple elements)
      const tooltipTexts = await screen.findAllByText(/Synced: just now/i);
      expect(tooltipTexts.length).toBeGreaterThan(0);
    });

    it('shows offline message in tooltip when offline', async () => {
      const user = userEvent.setup();
      mockUseSyncStatus.mockReturnValue({
        lastSync: new Date(),
        syncState: 'offline' as SyncState,
        timeSinceSync: 'just now',
        updateSyncTime: mockUpdateSyncTime,
      });

      render(<SyncIndicator />);

      const trigger = screen.getByTestId('sync-indicator');
      await user.hover(trigger);

      expect(await screen.findByText(/offline/i)).toBeInTheDocument();
    });
  });

  describe('refresh button', () => {
    it('calls onRefresh when provided and clicked', async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn();

      render(<SyncIndicator onRefresh={onRefresh} />);

      const button = screen.getByRole('button', { name: /refresh/i });
      await user.click(button);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('disables refresh button when offline', () => {
      mockUseSyncStatus.mockReturnValue({
        lastSync: new Date(),
        syncState: 'offline' as SyncState,
        timeSinceSync: 'just now',
        updateSyncTime: mockUpdateSyncTime,
      });

      render(<SyncIndicator onRefresh={vi.fn()} />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toBeDisabled();
    });

    it('shows spinning animation while refreshing', async () => {
      const user = userEvent.setup();
      let resolveRefresh: () => void;
      const onRefresh = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      render(<SyncIndicator onRefresh={onRefresh} />);

      const button = screen.getByRole('button', { name: /refresh/i });
      await user.click(button);

      // Icon should have animate-spin class while refreshing
      const icon = button.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');

      // Resolve the refresh (wrapped in act to suppress warning)
      await act(async () => {
        resolveRefresh!();
      });
    });
  });

  describe('accessibility', () => {
    it('has accessible name for the indicator', () => {
      render(<SyncIndicator />);

      const indicator = screen.getByTestId('sync-indicator');
      expect(indicator).toHaveAccessibleName();
    });

    it('has accessible name for refresh button', () => {
      render(<SyncIndicator onRefresh={vi.fn()} />);

      const button = screen.getByRole('button', { name: /refresh/i });
      expect(button).toBeInTheDocument();
    });

    it('announces state changes with aria-live', () => {
      render(<SyncIndicator />);

      const indicator = screen.getByTestId('sync-indicator');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });
  });
});
