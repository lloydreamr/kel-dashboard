/**
 * Unit tests for offline queue operations.
 * Uses fake-indexeddb for IndexedDB mocking.
 *
 * @see Story 8.2: IndexedDB Offline Queue
 */

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock feature flag to enable offline mode for tests
vi.mock('@/lib/features', () => ({
  FEATURES: { OFFLINE_MODE: true, OFFLINE_READ: false },
}));

import {
  clear,
  deleteById,
  dequeue,
  enqueue,
  getAll,
  getAllPending,
  getCount,
  peek,
  updateStatus,
} from './queue';
import { closeDatabase, resetDatabaseInstance } from './db';
import { DB_CONFIG } from './types';

import type { ActionPayload } from './types';

/**
 * Helper to delete the entire IndexedDB database for clean test isolation.
 * This ensures no state leaks between tests even if clear() fails.
 */
async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_CONFIG.NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      // Database is still in use, close it and retry
      console.warn('[test] Database blocked during delete, closing...');
      resolve();
    };
  });
}

describe('offline queue', () => {
  const createTestPayload = (questionId: string): ActionPayload => ({
    questionId,
    createdBy: 'test-user',
  });

  beforeEach(async () => {
    // Close any existing connection and reset instance
    await closeDatabase();
    resetDatabaseInstance();
    // Delete database entirely for clean isolation
    await deleteDatabase();
  });

  afterEach(async () => {
    // Clean up after tests
    await closeDatabase();
    resetDatabaseInstance();
    await deleteDatabase();
  });

  describe('enqueue', () => {
    it('adds action with pending status', async () => {
      const id = await enqueue('approve', createTestPayload('q1'));

      expect(id).toBeGreaterThan(0);

      const actions = await getAll();
      expect(actions).toHaveLength(1);
      expect(actions[0].status).toBe('pending');
    });

    it('sets correct action type', async () => {
      await enqueue('approve', createTestPayload('q1'));
      await enqueue('approve_with_constraint', createTestPayload('q2'));
      await enqueue('explore_alternatives', createTestPayload('q3'));

      const actions = await getAll();
      expect(actions.map((a) => a.action)).toEqual([
        'approve',
        'approve_with_constraint',
        'explore_alternatives',
      ]);
    });

    it('stores payload correctly', async () => {
      const payload: ActionPayload = {
        questionId: 'q1',
        createdBy: 'user1',
        constraints: [{ type: 'budget', context: '10k limit' }],
        reasoning: 'test reason',
      };

      await enqueue('approve_with_constraint', payload);

      const actions = await getAll();
      expect(actions[0].payload).toEqual(payload);
    });

    it('sets createdAt timestamp', async () => {
      const before = Date.now();
      await enqueue('approve', createTestPayload('q1'));
      const after = Date.now();

      const actions = await getAll();
      expect(actions[0].createdAt).toBeGreaterThanOrEqual(before);
      expect(actions[0].createdAt).toBeLessThanOrEqual(after);
    });

    it('sets retryCount to 0', async () => {
      await enqueue('approve', createTestPayload('q1'));

      const actions = await getAll();
      expect(actions[0].retryCount).toBe(0);
    });

    it('auto-generates unique IDs', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      const id2 = await enqueue('approve', createTestPayload('q2'));

      expect(id1).not.toBe(id2);
    });
  });

  describe('dequeue', () => {
    it('returns oldest pending first (FIFO)', async () => {
      await enqueue('approve', createTestPayload('q1'));
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      await enqueue('approve', createTestPayload('q2'));

      const first = await dequeue();
      expect(first?.payload.questionId).toBe('q1');

      const second = await dequeue();
      expect(second?.payload.questionId).toBe('q2');
    });

    it('removes action from queue', async () => {
      await enqueue('approve', createTestPayload('q1'));

      const action = await dequeue();
      expect(action).not.toBeNull();

      const remaining = await getAll();
      expect(remaining).toHaveLength(0);
    });

    it('returns null when queue is empty', async () => {
      const action = await dequeue();
      expect(action).toBeNull();
    });

    it('skips non-pending actions', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      await enqueue('approve', createTestPayload('q2'));

      // Mark first action as syncing
      await updateStatus(id1!, 'syncing');

      const action = await dequeue();
      expect(action?.payload.questionId).toBe('q2');
    });
  });

  describe('peek', () => {
    it('returns oldest pending without removing', async () => {
      await enqueue('approve', createTestPayload('q1'));

      const first = await peek();
      expect(first?.payload.questionId).toBe('q1');

      // Should still be in queue
      const actions = await getAll();
      expect(actions).toHaveLength(1);

      // Peek again should return same action
      const second = await peek();
      expect(second?.payload.questionId).toBe('q1');
    });

    it('returns null when queue is empty', async () => {
      const action = await peek();
      expect(action).toBeNull();
    });

    it('skips non-pending actions', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      await enqueue('approve', createTestPayload('q2'));

      // Mark first action as failed
      await updateStatus(id1!, 'failed');

      const action = await peek();
      expect(action?.payload.questionId).toBe('q2');
    });
  });

  describe('clear', () => {
    it('removes all actions from queue', async () => {
      await enqueue('approve', createTestPayload('q1'));
      await enqueue('approve', createTestPayload('q2'));
      await enqueue('approve', createTestPayload('q3'));

      const result = await clear();
      expect(result).toBe(true);

      const actions = await getAll();
      expect(actions).toHaveLength(0);
    });

    it('returns true even when queue is empty', async () => {
      const result = await clear();
      expect(result).toBe(true);
    });
  });

  describe('getAll', () => {
    it('returns all actions regardless of status', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      const id2 = await enqueue('approve', createTestPayload('q2'));
      await enqueue('approve', createTestPayload('q3'));

      await updateStatus(id1!, 'syncing');
      await updateStatus(id2!, 'failed');

      const actions = await getAll();
      expect(actions).toHaveLength(3);
      expect(actions.map((a) => a.status)).toContain('pending');
      expect(actions.map((a) => a.status)).toContain('syncing');
      expect(actions.map((a) => a.status)).toContain('failed');
    });

    it('returns empty array when queue is empty', async () => {
      const actions = await getAll();
      expect(actions).toEqual([]);
    });
  });

  describe('getAllPending', () => {
    it('filters by pending status only', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      await enqueue('approve', createTestPayload('q2'));
      const id3 = await enqueue('approve', createTestPayload('q3'));

      await updateStatus(id1!, 'syncing');
      await updateStatus(id3!, 'failed');

      const pending = await getAllPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].payload.questionId).toBe('q2');
    });

    it('returns empty array when no pending actions', async () => {
      const id = await enqueue('approve', createTestPayload('q1'));
      await updateStatus(id!, 'syncing');

      const pending = await getAllPending();
      expect(pending).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('changes status correctly', async () => {
      const id = await enqueue('approve', createTestPayload('q1'));

      await updateStatus(id!, 'syncing');

      const actions = await getAll();
      expect(actions[0].status).toBe('syncing');
    });

    it('updates retryCount when provided', async () => {
      const id = await enqueue('approve', createTestPayload('q1'));

      await updateStatus(id!, 'failed', 3);

      const actions = await getAll();
      expect(actions[0].retryCount).toBe(3);
    });

    it('updates lastError when provided', async () => {
      const id = await enqueue('approve', createTestPayload('q1'));

      await updateStatus(id!, 'failed', 1, 'Network timeout');

      const actions = await getAll();
      expect(actions[0].lastError).toBe('Network timeout');
    });

    it('returns false for non-existent ID', async () => {
      const result = await updateStatus(99999, 'syncing');
      expect(result).toBe(false);
    });

    it('preserves other fields when updating', async () => {
      const payload = createTestPayload('q1');
      const id = await enqueue('approve', payload);

      await updateStatus(id!, 'syncing');

      const actions = await getAll();
      expect(actions[0].action).toBe('approve');
      expect(actions[0].payload).toEqual(payload);
      expect(actions[0].id).toBe(id);
    });
  });

  describe('getCount', () => {
    it('returns accurate count of pending actions', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      await enqueue('approve', createTestPayload('q2'));
      await enqueue('approve', createTestPayload('q3'));

      await updateStatus(id1!, 'syncing');

      const count = await getCount();
      expect(count).toBe(2);
    });

    it('returns 0 when queue is empty', async () => {
      const count = await getCount();
      expect(count).toBe(0);
    });

    it('returns 0 when all actions are non-pending', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      const id2 = await enqueue('approve', createTestPayload('q2'));

      await updateStatus(id1!, 'syncing');
      await updateStatus(id2!, 'failed');

      const count = await getCount();
      expect(count).toBe(0);
    });
  });

  describe('deleteById', () => {
    it('deletes action by specific ID', async () => {
      const id1 = await enqueue('approve', createTestPayload('q1'));
      const id2 = await enqueue('approve', createTestPayload('q2'));

      const result = await deleteById(id1!);
      expect(result).toBe(true);

      const remaining = await getAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].payload.questionId).toBe('q2');
    });

    it('returns false for non-existent ID', async () => {
      const result = await deleteById(99999);
      expect(result).toBe(false);
    });

    it('deletes regardless of status', async () => {
      const id = await enqueue('approve', createTestPayload('q1'));
      await updateStatus(id!, 'syncing');

      const result = await deleteById(id!);
      expect(result).toBe(true);

      const remaining = await getAll();
      expect(remaining).toHaveLength(0);
    });
  });
});

describe('offline queue with OFFLINE_MODE=false', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('functions no-op when FEATURES.OFFLINE_MODE = false', async () => {
    // Re-mock with OFFLINE_MODE disabled
    vi.doMock('@/lib/features', () => ({
      FEATURES: { OFFLINE_MODE: false, OFFLINE_READ: false },
    }));

    // Re-import queue to pick up new mock
    const queue = await import('./queue');

    // All operations should return null/empty/false
    expect(await queue.enqueue('approve', { questionId: 'q1', createdBy: 'u1' })).toBeNull();
    expect(await queue.dequeue()).toBeNull();
    expect(await queue.peek()).toBeNull();
    expect(await queue.getAll()).toEqual([]);
    expect(await queue.getAllPending()).toEqual([]);
    expect(await queue.getCount()).toBe(0);
    expect(await queue.clear()).toBe(false);
    expect(await queue.updateStatus(1, 'syncing')).toBe(false);
    expect(await queue.deleteById(1)).toBe(false);
  });
});
