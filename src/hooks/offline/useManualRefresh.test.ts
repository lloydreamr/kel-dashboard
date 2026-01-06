/**
 * useManualRefresh Hook Tests
 *
 * Tests for manual data refresh functionality with sync time updates.
 * Story 10.4: Offline Detection & Sync Indicator (Task 3)
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useManualRefresh } from './useManualRefresh';
import * as features from '@/lib/features';

// Mock dependencies
vi.mock('@/lib/features', () => ({
  FEATURES: {
    OFFLINE_READ: true,
    OFFLINE_MODE: false,
  },
}));

const mockUpdateSyncTime = vi.fn();
vi.mock('./useSyncStatus', () => ({
  useSyncStatus: () => ({
    lastSync: new Date(),
    syncState: 'fresh',
    timeSinceSync: 'just now',
    updateSyncTime: mockUpdateSyncTime,
  }),
}));

const mockIsOnline = vi.fn(() => true);
vi.mock('./useOnlineStatus', () => ({
  useOnlineStatus: () => ({ isOnline: mockIsOnline() }),
}));

describe('useManualRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(features.FEATURES).OFFLINE_READ = true;
    mockIsOnline.mockReturnValue(true);
  });

  describe('basic functionality', () => {
    it('returns refresh function and loading state', () => {
      const { result } = renderHook(() => useManualRefresh(vi.fn()));

      expect(result.current.refresh).toBeDefined();
      expect(typeof result.current.refresh).toBe('function');
      expect(result.current.isRefreshing).toBe(false);
    });

    it('calls provided refresh function when refresh is called', async () => {
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRefreshFn).toHaveBeenCalledTimes(1);
    });

    it('sets isRefreshing to true while refreshing', async () => {
      let resolveRefresh: () => void;
      const mockRefreshFn = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      expect(result.current.isRefreshing).toBe(false);

      // Start refresh but don't await
      act(() => {
        result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      // Resolve the refresh
      await act(async () => {
        resolveRefresh!();
      });

      expect(result.current.isRefreshing).toBe(false);
    });
  });

  describe('sync time updates', () => {
    it('updates sync time after successful refresh', async () => {
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockUpdateSyncTime).toHaveBeenCalledTimes(1);
    });

    it('does not update sync time if refresh fails', async () => {
      const mockRefreshFn = vi.fn().mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      await act(async () => {
        try {
          await result.current.refresh();
        } catch {
          // Expected to throw
        }
      });

      expect(mockUpdateSyncTime).not.toHaveBeenCalled();
    });
  });

  describe('offline behavior', () => {
    it('does not call refresh function when offline', async () => {
      mockIsOnline.mockReturnValue(false);
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRefreshFn).not.toHaveBeenCalled();
    });

    it('returns early without error when offline', async () => {
      mockIsOnline.mockReturnValue(false);
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      // Should not throw
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(false);
    });
  });

  describe('error handling', () => {
    it('propagates errors from refresh function', async () => {
      const error = new Error('Refresh failed');
      const mockRefreshFn = vi.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      await expect(
        act(async () => {
          await result.current.refresh();
        })
      ).rejects.toThrow('Refresh failed');
    });

    it('resets isRefreshing to false after error', async () => {
      const mockRefreshFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      try {
        await act(async () => {
          await result.current.refresh();
        });
      } catch {
        // Expected
      }

      expect(result.current.isRefreshing).toBe(false);
    });
  });

  describe('feature flag disabled', () => {
    beforeEach(() => {
      vi.mocked(features.FEATURES).OFFLINE_READ = false;
    });

    it('still calls refresh function when feature flag is disabled', async () => {
      const mockRefreshFn = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      await act(async () => {
        await result.current.refresh();
      });

      // Refresh should still work - feature flag only affects sync indicator visibility
      expect(mockRefreshFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent refresh prevention', () => {
    it('prevents multiple concurrent refresh calls', async () => {
      let resolveRefresh: () => void;
      const mockRefreshFn = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      const { result } = renderHook(() => useManualRefresh(mockRefreshFn));

      // Start first refresh
      act(() => {
        result.current.refresh();
      });

      // Try to start second refresh while first is running
      act(() => {
        result.current.refresh();
      });

      // Only first call should have been made
      expect(mockRefreshFn).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolveRefresh!();
      });
    });
  });
});
