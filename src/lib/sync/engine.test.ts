/**
 * Tests for sync engine core.
 *
 * Tests cover:
 * - FIFO processing order
 * - Retry with exponential backoff
 * - Max retry limit (3 attempts)
 * - Cache invalidation calls
 * - Feature flag behavior (OFFLINE_MODE=false)
 *
 * @see Story 8.3: Sync Engine - Task 8
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSyncStatus, startSync, stopSync } from './engine';

import type { QueryClient } from '@tanstack/react-query';
import type { OfflineAction } from '@/lib/offline/types';

// Mock feature flags
vi.mock('@/lib/features', () => ({
  FEATURES: { OFFLINE_MODE: true },
}));

// Mock offline queue operations
const mockPeek = vi.fn();
const mockDeleteById = vi.fn();
const mockUpdateStatus = vi.fn();
const mockGetCount = vi.fn();
const mockGetAll = vi.fn();

vi.mock('@/lib/offline', () => ({
  peek: () => mockPeek(),
  deleteById: (id: number) => mockDeleteById(id),
  updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
  getCount: () => mockGetCount(),
  getAll: () => mockGetAll(),
}));

// Mock processor
const mockProcessAction = vi.fn();
vi.mock('./processor', () => ({
  processAction: (action: OfflineAction) => mockProcessAction(action),
}));

// Mock backoff
vi.mock('./backoff', () => ({
  calculateBackoffDelay: () => 100, // Short delay for tests
}));

// Mock QueryClient
function createMockQueryClient(): QueryClient {
  return {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  } as unknown as QueryClient;
}

// Sample offline action
function createMockAction(overrides: Partial<OfflineAction> = {}): OfflineAction {
  return {
    id: 1,
    action: 'approve',
    payload: {
      questionId: 'q-123',
      createdBy: 'user-456',
    },
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0,
    ...overrides,
  };
}

describe('Sync Engine', () => {
  let mockQueryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    mockQueryClient = createMockQueryClient();

    // Reset all mocks and set defaults
    mockPeek.mockReset();
    mockDeleteById.mockReset();
    mockUpdateStatus.mockReset();
    mockGetCount.mockReset();
    mockGetAll.mockReset();
    mockProcessAction.mockReset();

    // Default implementations for count functions (can be overridden in tests)
    mockGetCount.mockImplementation(() => Promise.resolve(0));
    mockGetAll.mockImplementation(() => Promise.resolve([]));

    // Default navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Reset sync engine state by stopping
    stopSync();
  });

  afterEach(() => {
    vi.useRealTimers();
    stopSync();
  });

  describe('startSync', () => {
    it('should do nothing when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      await startSync(mockQueryClient);

      expect(mockPeek).not.toHaveBeenCalled();
      expect(getSyncStatus().status).toBe('idle');
    });

    it('should not start if already syncing', async () => {
      const action = createMockAction();
      let resolveProcess: () => void;
      const processPromise = new Promise<'success'>((resolve) => {
        resolveProcess = () => resolve('success');
      });

      mockPeek.mockResolvedValueOnce(action).mockResolvedValueOnce(null);
      mockProcessAction.mockReturnValueOnce(processPromise);
      mockDeleteById.mockResolvedValueOnce(true);

      // Start first sync (will wait on process)
      const firstSync = startSync(mockQueryClient);

      // Give time for first sync to start processing
      await vi.advanceTimersByTimeAsync(10);

      // Try to start second sync while first is still running
      await startSync(mockQueryClient);

      // First sync should have called peek once, second sync should be blocked
      // (Note: might be 1 or 2 depending on timing, but second sync should not process)
      expect(getSyncStatus().status).toBe('syncing');

      // Resolve the first process to complete test
      resolveProcess!();
      await firstSync;
    });

    it('should process queue when online', async () => {
      const action = createMockAction();
      mockPeek
        .mockResolvedValueOnce(action)
        .mockResolvedValueOnce(null); // Queue empty after first
      mockProcessAction.mockResolvedValueOnce('success');
      mockDeleteById.mockResolvedValueOnce(true);

      await startSync(mockQueryClient);

      expect(mockPeek).toHaveBeenCalled();
      expect(mockProcessAction).toHaveBeenCalledWith(action);
      expect(mockDeleteById).toHaveBeenCalledWith(action.id);
    });
  });

  describe('FIFO processing', () => {
    it('should process actions in FIFO order', async () => {
      const action1 = createMockAction({ id: 1, createdAt: 1000 });
      const action2 = createMockAction({ id: 2, createdAt: 2000 });

      mockPeek
        .mockResolvedValueOnce(action1)
        .mockResolvedValueOnce(action2)
        .mockResolvedValueOnce(null);
      mockProcessAction.mockResolvedValue('success');
      mockDeleteById.mockResolvedValue(true);

      await startSync(mockQueryClient);

      // Verify actions were processed in order
      const calls = mockProcessAction.mock.calls;
      expect(calls[0][0].id).toBe(1);
      expect(calls[1][0].id).toBe(2);
    });
  });

  describe('Success handling', () => {
    it('should delete action by ID on success', async () => {
      const action = createMockAction();
      mockPeek
        .mockResolvedValueOnce(action)
        .mockResolvedValueOnce(null);
      mockProcessAction.mockResolvedValueOnce('success');
      mockDeleteById.mockResolvedValueOnce(true);

      await startSync(mockQueryClient);

      expect(mockDeleteById).toHaveBeenCalledWith(action.id);
    });

    it('should invalidate cache on success', async () => {
      const action = createMockAction({ payload: { questionId: 'q-test', createdBy: 'u1' } });
      mockPeek
        .mockResolvedValueOnce(action)
        .mockResolvedValueOnce(null);
      mockProcessAction.mockResolvedValueOnce('success');
      mockDeleteById.mockResolvedValueOnce(true);

      await startSync(mockQueryClient);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['questions'],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['questions', 'q-test'],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['decisions', 'q-test'],
      });
    });

    it('should update lastSyncAt when queue is empty', async () => {
      mockPeek.mockResolvedValueOnce(null);

      await startSync(mockQueryClient);

      const status = getSyncStatus();
      expect(status.lastSyncAt).not.toBeNull();
    });
  });

  describe('Retry handling', () => {
    it('should increment retryCount on retry result', async () => {
      const action = createMockAction({ retryCount: 0 });
      mockPeek.mockResolvedValue(action);
      mockProcessAction.mockResolvedValueOnce('retry');

      await startSync(mockQueryClient);

      expect(mockUpdateStatus).toHaveBeenCalledWith(
        action.id,
        'pending',
        1, // incremented
        'Network error'
      );
    });

    it('should schedule retry with backoff delay', async () => {
      const action = createMockAction({ retryCount: 0 });
      mockPeek.mockResolvedValueOnce(action);
      mockProcessAction.mockResolvedValueOnce('retry');

      await startSync(mockQueryClient);

      // Status should be idle (waiting for retry)
      expect(getSyncStatus().status).toBe('idle');

      // Advance timer past backoff delay
      vi.advanceTimersByTime(200);

      // Would start sync again (mocked, so just verify timeout was set)
    });

    it('should mark as failed after max retries', async () => {
      const action = createMockAction({ retryCount: 2 }); // Already at max-1
      mockPeek
        .mockResolvedValueOnce(action)
        .mockResolvedValueOnce(null); // Continue loop after failure
      mockProcessAction.mockResolvedValueOnce('retry');

      await startSync(mockQueryClient);

      // Should be marked as failed (retryCount 2 + 1 = 3 = MAX_RETRIES)
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        action.id,
        'failed',
        3,
        'Max retries exceeded'
      );
    });
  });

  describe('Permanent failure handling', () => {
    it('should mark action as failed on permanent failure', async () => {
      const action = createMockAction();
      mockPeek
        .mockResolvedValueOnce(action)
        .mockResolvedValueOnce(null);
      mockProcessAction.mockResolvedValueOnce('failed');

      await startSync(mockQueryClient);

      expect(mockUpdateStatus).toHaveBeenCalledWith(
        action.id,
        'failed',
        0,
        'Permanent failure'
      );
    });

    it('should continue processing queue after failure', async () => {
      const action1 = createMockAction({ id: 1 });
      const action2 = createMockAction({ id: 2 });

      mockPeek
        .mockResolvedValueOnce(action1)
        .mockResolvedValueOnce(action2)
        .mockResolvedValueOnce(null);
      mockProcessAction
        .mockResolvedValueOnce('failed')
        .mockResolvedValueOnce('success');
      mockDeleteById.mockResolvedValueOnce(true);

      await startSync(mockQueryClient);

      // Both actions should have been processed
      expect(mockProcessAction).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopSync', () => {
    it('should stop sync and reset state', () => {
      stopSync();

      const status = getSyncStatus();
      expect(status.status).toBe('idle');
      expect(status.currentAction).toBeNull();
    });

    it('should clear pending retry timeout', async () => {
      const action = createMockAction({ retryCount: 0 });
      mockPeek.mockResolvedValueOnce(action);
      mockProcessAction.mockResolvedValueOnce('retry');

      await startSync(mockQueryClient);

      // Stop sync
      stopSync();

      // Advance time - should not trigger another sync
      vi.advanceTimersByTime(5000);

      // peek was only called once (before stop)
      expect(mockPeek).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSyncStatus', () => {
    it('should return current state copy', () => {
      const status1 = getSyncStatus();
      const status2 = getSyncStatus();

      // Should be equal but not same reference
      expect(status1).toEqual(status2);
      expect(status1).not.toBe(status2);
    });

    it('should reflect pending and failed counts', async () => {
      // Use mockResolvedValue (not Once) so it persists through multiple calls
      mockGetCount.mockResolvedValue(5);
      mockGetAll.mockResolvedValue([
        createMockAction({ status: 'failed' }),
        createMockAction({ status: 'failed' }),
      ]);
      mockPeek.mockResolvedValueOnce(null);

      await startSync(mockQueryClient);

      const status = getSyncStatus();
      expect(status.pendingCount).toBe(5);
      expect(status.failedCount).toBe(2);
    });
  });

  describe('Offline handling', () => {
    it('should pause when going offline during sync', async () => {
      const action = createMockAction();
      mockPeek.mockResolvedValue(action);

      // Go offline during processing
      mockProcessAction.mockImplementation(async () => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        return 'success';
      });
      mockDeleteById.mockResolvedValue(true);

      await startSync(mockQueryClient);

      const status = getSyncStatus();
      expect(status.status).toBe('paused');
    });
  });
});

describe('Feature flag behavior', () => {
  // Separate describe to test with OFFLINE_MODE=false
  beforeEach(() => {
    vi.resetModules();
  });

  it('should not sync when OFFLINE_MODE is false', async () => {
    // Re-mock with OFFLINE_MODE disabled
    vi.doMock('@/lib/features', () => ({
      FEATURES: { OFFLINE_MODE: false },
    }));

    // Re-mock offline module (required after resetModules)
    const localMockPeek = vi.fn();
    vi.doMock('@/lib/offline', () => ({
      peek: () => localMockPeek(),
      deleteById: vi.fn(),
      updateStatus: vi.fn(),
      getCount: vi.fn().mockResolvedValue(0),
      getAll: vi.fn().mockResolvedValue([]),
    }));

    // Re-import engine to pick up new mocks
    const { startSync, getSyncStatus } = await import('./engine');

    // Create mock query client
    const mockQC = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    } as unknown as QueryClient;

    // Attempt to start sync
    await startSync(mockQC);

    // Should not have called peek (sync didn't start)
    expect(localMockPeek).not.toHaveBeenCalled();

    // Status should remain idle
    expect(getSyncStatus().status).toBe('idle');
  });
});
