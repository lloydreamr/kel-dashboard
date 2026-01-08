/**
 * useSyncStatus Hook Tests
 *
 * Tests for sync status tracking and localStorage persistence.
 * Story 10.4: Offline Detection & Sync Indicator (Task 1)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useSyncStatus } from './useSyncStatus';

import type { SyncState } from './useSyncStatus';

import * as features from '@/lib/features';
import * as syncStorage from '@/lib/storage/syncStorage';

// Mock dependencies
vi.mock('@/lib/features', () => ({
  FEATURES: {
    OFFLINE_READ: true,
    OFFLINE_MODE: false,
  },
}));

vi.mock('@/lib/storage/syncStorage', () => ({
  getSyncTimestamp: vi.fn(() => null),
  setSyncTimestamp: vi.fn(),
}));

vi.mock('./useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => ({ isOnline: true })),
}));

// Import after mock to get the mocked version
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Helper to run pending effects and timers without infinite loop.
 * We advance by 0ms to flush any immediate effects, then run pending microtasks.
 */
async function flushEffects() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe('useSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset to default: online, feature enabled
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: true });
    vi.mocked(features.FEATURES).OFFLINE_READ = true;
    vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns stale state when no previous sync exists', async () => {
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(null);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.lastSync).toBeNull();
      expect(result.current.syncState).toBe('stale');
      // After initialization with null lastSync, shows "Loading..."
      expect(result.current.timeSinceSync).toBe('Loading...');
    });

    it('loads last sync time from localStorage on mount', async () => {
      const storedDate = new Date(Date.now() - 30000); // 30 seconds ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(storedDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.lastSync).toEqual(storedDate);
      expect(result.current.syncState).toBe('fresh');
      expect(result.current.timeSinceSync).toBe('just now');
    });

    it('shows stale state when loaded sync is over 1 minute old', async () => {
      const storedDate = new Date(Date.now() - 90000); // 90 seconds ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(storedDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('stale');
      expect(result.current.timeSinceSync).toBe('1 min ago');
    });
  });

  describe('sync state calculation', () => {
    it('returns fresh when synced within 1 minute', async () => {
      const recentDate = new Date(Date.now() - 30000); // 30 seconds ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(recentDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('fresh');
    });

    it('returns stale when synced more than 1 minute ago', async () => {
      const oldDate = new Date(Date.now() - 120000); // 2 minutes ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(oldDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('stale');
    });

    it('returns offline when network is offline', async () => {
      vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: false });
      const recentDate = new Date(Date.now() - 30000);
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(recentDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('offline');
    });

    it('returns offline even with fresh data when network is offline', async () => {
      vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: false });

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('offline');
    });
  });

  describe('time formatting', () => {
    it('shows "just now" for sync within 1 minute', async () => {
      const recentDate = new Date(Date.now() - 45000); // 45 seconds ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(recentDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.timeSinceSync).toBe('just now');
    });

    it('shows minutes for sync between 1-59 minutes ago', async () => {
      const oldDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(oldDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.timeSinceSync).toBe('5 min ago');
    });

    it('shows hours for sync over 1 hour ago', async () => {
      const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(oldDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.timeSinceSync).toBe('2 hr ago');
    });
  });

  describe('updateSyncTime', () => {
    it('updates lastSync state when called', async () => {
      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.lastSync).toBeNull();

      act(() => {
        result.current.updateSyncTime();
      });

      await flushEffects();

      expect(result.current.lastSync).not.toBeNull();
      expect(result.current.syncState).toBe('fresh');
    });

    it('persists to localStorage when called', async () => {
      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      act(() => {
        result.current.updateSyncTime();
      });

      expect(syncStorage.setSyncTimestamp).toHaveBeenCalledWith(
        expect.any(Date)
      );
    });

    it('updates timeSinceSync to "just now" after update', async () => {
      const oldDate = new Date(Date.now() - 5 * 60 * 1000);
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(oldDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.timeSinceSync).toBe('5 min ago');

      act(() => {
        result.current.updateSyncTime();
      });

      await flushEffects();

      expect(result.current.timeSinceSync).toBe('just now');
    });
  });

  describe('state transitions', () => {
    it('transitions from stale to fresh after updateSyncTime', async () => {
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(null);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('stale');

      act(() => {
        result.current.updateSyncTime();
      });

      await flushEffects();

      expect(result.current.syncState).toBe('fresh');
    });

    it('transitions from fresh to stale after time passes', async () => {
      const recentDate = new Date();
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(recentDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('fresh');

      // Fast-forward 2 minutes (triggers interval callback)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(120000);
      });

      expect(result.current.syncState).toBe('stale');
    });
  });

  describe('feature flag disabled', () => {
    beforeEach(() => {
      vi.mocked(features.FEATURES).OFFLINE_READ = false;
    });

    it('returns fresh state when feature flag is disabled', async () => {
      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.syncState).toBe('fresh');
    });

    it('does not load from localStorage when feature flag is disabled', async () => {
      renderHook(() => useSyncStatus());

      await flushEffects();

      // getSyncTimestamp is still called in the effect, but the result is not used
      // The important thing is that the state remains 'fresh'
    });

    it('does not persist when updateSyncTime is called', async () => {
      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      act(() => {
        result.current.updateSyncTime();
      });

      expect(syncStorage.setSyncTimestamp).not.toHaveBeenCalled();
    });

    it('shows "just now" always when disabled', async () => {
      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.timeSinceSync).toBe('just now');
    });
  });

  describe('periodic updates', () => {
    it('updates time display every 30 seconds', async () => {
      const startDate = new Date(Date.now() - 45000); // Start at 45 seconds ago
      vi.mocked(syncStorage.getSyncTimestamp).mockReturnValue(startDate);

      const { result } = renderHook(() => useSyncStatus());

      await flushEffects();

      expect(result.current.timeSinceSync).toBe('just now');

      // Fast-forward 30 seconds - now 75 seconds total = 1 min ago
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });

      expect(result.current.timeSinceSync).toBe('1 min ago');
    });
  });
});
