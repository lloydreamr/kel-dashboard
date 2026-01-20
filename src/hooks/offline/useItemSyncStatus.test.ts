/**
 * useItemSyncStatus Hook Tests
 *
 * Tests for per-item sync status tracking from offline queue.
 * Story 8.6: Full Sync Status Indicators
 * - Returns correct status based on queue state
 * - Feature flag guard
 * - Null questionId handling
 * - Queue change event handling
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  useItemSyncStatus,
  dispatchQueueChangeEvent,
  QUEUE_CHANGE_EVENT,
} from './useItemSyncStatus';

import type { OfflineAction } from '@/lib/offline';

// Mock FEATURES
const mockOfflineMode = vi.fn();
vi.mock('@/lib/features', () => ({
  FEATURES: {
    get OFFLINE_MODE() {
      return mockOfflineMode();
    },
  },
}));

// Mock offline queue
const mockGetAll = vi.fn();
vi.mock('@/lib/offline', () => ({
  getAll: () => mockGetAll(),
}));

/**
 * Helper to create mock offline actions
 */
function createMockAction(
  questionId: string,
  status: 'pending' | 'syncing' | 'failed',
  lastError?: string
): OfflineAction {
  return {
    id: 1,
    action: 'approve',
    payload: { questionId, createdBy: 'test-user' },
    status,
    retryCount: 0,
    createdAt: Date.now(),
    lastError,
  };
}

/**
 * Helper to flush effects and microtasks with fake timers.
 */
async function flushEffects() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe('useItemSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Default: feature enabled
    mockOfflineMode.mockReturnValue(true);
    // Default: empty queue
    mockGetAll.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('feature flag guard', () => {
    it('returns null status when OFFLINE_MODE is disabled', async () => {
      mockOfflineMode.mockReturnValue(false);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null status when questionId is null', async () => {
      const { result } = renderHook(() => useItemSyncStatus(null));

      await flushEffects();

      expect(result.current.status).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns status when OFFLINE_MODE is enabled', async () => {
      mockOfflineMode.mockReturnValue(true);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBe('synced');
    });
  });

  describe('status mapping', () => {
    it('returns synced when item is not in queue', async () => {
      mockGetAll.mockResolvedValue([]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('synced');
    });

    it('returns pending when queue status is pending', async () => {
      mockGetAll.mockResolvedValue([createMockAction('question-123', 'pending')]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('pending');
    });

    it('returns pending when queue status is syncing', async () => {
      mockGetAll.mockResolvedValue([createMockAction('question-123', 'syncing')]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('pending');
    });

    it('returns retry when queue status is failed', async () => {
      mockGetAll.mockResolvedValue([
        createMockAction('question-123', 'failed', 'Network error'),
      ]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('retry');
    });

    it('returns conflict when lastError contains "conflict"', async () => {
      mockGetAll.mockResolvedValue([
        createMockAction('question-123', 'failed', 'Conflict detected: version mismatch'),
      ]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('conflict');
    });

    it('conflict status takes priority over failed status', async () => {
      // Even if status is failed, conflict takes priority when detected
      mockGetAll.mockResolvedValue([
        createMockAction('question-123', 'failed', 'CONFLICT: server has newer version'),
      ]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('conflict');
    });
  });

  describe('multiple items in queue', () => {
    it('returns status for the correct questionId', async () => {
      mockGetAll.mockResolvedValue([
        createMockAction('question-111', 'pending'),
        createMockAction('question-222', 'failed'),
        createMockAction('question-333', 'syncing'),
      ]);

      const { result: result1 } = renderHook(() => useItemSyncStatus('question-111'));
      const { result: result2 } = renderHook(() => useItemSyncStatus('question-222'));
      const { result: result3 } = renderHook(() => useItemSyncStatus('question-333'));
      const { result: result4 } = renderHook(() => useItemSyncStatus('question-444'));

      await flushEffects();

      expect(result1.current.status).toBe('pending');
      expect(result2.current.status).toBe('retry');
      expect(result3.current.status).toBe('pending');
      expect(result4.current.status).toBe('synced'); // Not in queue
    });
  });

  describe('polling and events', () => {
    it('polls for updates every 2 seconds', async () => {
      mockGetAll.mockResolvedValue([createMockAction('question-123', 'pending')]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('pending');

      // Clear call count
      mockGetAll.mockClear();

      // Change queue state
      mockGetAll.mockResolvedValue([]);

      // Advance timer by 2 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Should have polled
      expect(mockGetAll).toHaveBeenCalled();
      expect(result.current.status).toBe('synced');
    });

    it('responds to QUEUE_CHANGE_EVENT', async () => {
      mockGetAll.mockResolvedValue([createMockAction('question-123', 'pending')]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.status).toBe('pending');

      // Clear call count
      mockGetAll.mockClear();

      // Change queue state
      mockGetAll.mockResolvedValue([]);

      // Dispatch queue change event
      await act(async () => {
        dispatchQueueChangeEvent();
        // Allow promise to resolve
        await vi.advanceTimersByTimeAsync(0);
      });

      // Should have re-fetched
      expect(mockGetAll).toHaveBeenCalled();
      expect(result.current.status).toBe('synced');
    });

    it('cleans up interval and event listener on unmount', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        QUEUE_CHANGE_EVENT,
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        QUEUE_CHANGE_EVENT,
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('returns synced on queue fetch error (graceful degradation)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAll.mockRejectedValue(new Error('IndexedDB error'));

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBe('synced');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[useItemSyncStatus] Failed to check queue status'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('loading state', () => {
    it('starts with isLoading true', () => {
      // Make getAll never resolve during this test
      mockGetAll.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading false after fetch completes', async () => {
      mockGetAll.mockResolvedValue([]);

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading false even on error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAll.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useItemSyncStatus('question-123'));

      await flushEffects();

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('dispatchQueueChangeEvent utility', () => {
    it('dispatches custom event on window', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      dispatchQueueChangeEvent();

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QUEUE_CHANGE_EVENT,
        })
      );

      dispatchSpy.mockRestore();
    });
  });
});
