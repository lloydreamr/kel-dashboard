/**
 * Capture Queue Tests
 *
 * Tests for the IndexedDB-backed offline capture queue.
 * Uses fake-indexeddb to simulate IndexedDB in Node.js.
 */

import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  captureQueue,
  CAPTURE_QUEUE_DB_NAME,
  type QueuedCaptureInput,
} from './captureQueue';

describe('captureQueue', () => {
  const mockCapture: QueuedCaptureInput = {
    photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
    note: 'Market shelf observation',
    category: 'market',
    userId: 'user123',
    questionId: 'q1',
  };

  beforeEach(async () => {
    // Clear the queue before each test
    await captureQueue.clear();
  });

  afterEach(() => {
    // Clean up database connections
    indexedDB.deleteDatabase(CAPTURE_QUEUE_DB_NAME);
  });

  describe('add', () => {
    it('adds a capture to the queue and returns ID', async () => {
      const id = await captureQueue.add(mockCapture);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates unique IDs for each capture', async () => {
      const id1 = await captureQueue.add(mockCapture);
      const id2 = await captureQueue.add(mockCapture);
      const id3 = await captureQueue.add(mockCapture);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('stores capture with initial metadata', async () => {
      const id = await captureQueue.add(mockCapture);
      const stored = await captureQueue.get(id);

      expect(stored).toBeDefined();
      expect(stored!.id).toBe(id);
      expect(stored!.photoBase64).toBe(mockCapture.photoBase64);
      expect(stored!.fileName).toBe(mockCapture.fileName);
      expect(stored!.mimeType).toBe(mockCapture.mimeType);
      expect(stored!.note).toBe(mockCapture.note);
      expect(stored!.userId).toBe(mockCapture.userId);
      expect(stored!.questionId).toBe(mockCapture.questionId);
      expect(stored!.createdAt).toBeDefined();
      expect(stored!.attempts).toBe(0);
      expect(stored!.lastError).toBeNull();
    });

    it('handles null questionId', async () => {
      const captureWithoutQuestion: QueuedCaptureInput = {
        ...mockCapture,
        questionId: null,
      };

      const id = await captureQueue.add(captureWithoutQuestion);
      const stored = await captureQueue.get(id);

      expect(stored!.questionId).toBeNull();
    });
  });

  describe('getAll', () => {
    it('returns empty array when queue is empty', async () => {
      const captures = await captureQueue.getAll();

      expect(captures).toEqual([]);
    });

    it('returns all queued captures', async () => {
      await captureQueue.add(mockCapture);
      await captureQueue.add({ ...mockCapture, note: 'Second capture' });
      await captureQueue.add({ ...mockCapture, note: 'Third capture' });

      const captures = await captureQueue.getAll();

      expect(captures).toHaveLength(3);
    });

    it('returns captures sorted by creation time (oldest first)', async () => {
      const id1 = await captureQueue.add({ ...mockCapture, note: 'First' });
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      const id2 = await captureQueue.add({ ...mockCapture, note: 'Second' });
      await new Promise((r) => setTimeout(r, 10));
      const id3 = await captureQueue.add({ ...mockCapture, note: 'Third' });

      const captures = await captureQueue.getAll();

      expect(captures[0].id).toBe(id1);
      expect(captures[1].id).toBe(id2);
      expect(captures[2].id).toBe(id3);
    });
  });

  describe('get', () => {
    it('returns capture by ID', async () => {
      const id = await captureQueue.add(mockCapture);
      const capture = await captureQueue.get(id);

      expect(capture).toBeDefined();
      expect(capture!.id).toBe(id);
    });

    it('returns null for non-existent ID', async () => {
      const capture = await captureQueue.get('non-existent-id');

      expect(capture).toBeNull();
    });
  });

  describe('count', () => {
    it('returns 0 when queue is empty', async () => {
      const count = await captureQueue.count();

      expect(count).toBe(0);
    });

    it('returns correct count', async () => {
      await captureQueue.add(mockCapture);
      await captureQueue.add(mockCapture);
      await captureQueue.add(mockCapture);

      const count = await captureQueue.count();

      expect(count).toBe(3);
    });
  });

  describe('remove', () => {
    it('removes capture from queue', async () => {
      const id = await captureQueue.add(mockCapture);
      await captureQueue.remove(id);

      const capture = await captureQueue.get(id);
      expect(capture).toBeNull();
    });

    it('only removes specified capture', async () => {
      const id1 = await captureQueue.add(mockCapture);
      const id2 = await captureQueue.add(mockCapture);

      await captureQueue.remove(id1);

      const count = await captureQueue.count();
      expect(count).toBe(1);

      const remaining = await captureQueue.get(id2);
      expect(remaining).toBeDefined();
    });

    it('does not throw for non-existent ID', async () => {
      await expect(captureQueue.remove('non-existent')).resolves.not.toThrow();
    });
  });

  describe('markAttempt', () => {
    it('increments attempt count', async () => {
      const id = await captureQueue.add(mockCapture);

      await captureQueue.markAttempt(id, 'Network error');

      const capture = await captureQueue.get(id);
      expect(capture!.attempts).toBe(1);
    });

    it('increments on each call', async () => {
      const id = await captureQueue.add(mockCapture);

      await captureQueue.markAttempt(id, 'Error 1');
      await captureQueue.markAttempt(id, 'Error 2');
      await captureQueue.markAttempt(id, 'Error 3');

      const capture = await captureQueue.get(id);
      expect(capture!.attempts).toBe(3);
    });

    it('stores last error message', async () => {
      const id = await captureQueue.add(mockCapture);

      await captureQueue.markAttempt(id, 'First error');
      await captureQueue.markAttempt(id, 'Second error');

      const capture = await captureQueue.get(id);
      expect(capture!.lastError).toBe('Second error');
    });

    it('throws for non-existent ID', async () => {
      await expect(
        captureQueue.markAttempt('non-existent', 'Error')
      ).rejects.toThrow('Capture not found');
    });
  });

  describe('clear', () => {
    it('removes all captures', async () => {
      await captureQueue.add(mockCapture);
      await captureQueue.add(mockCapture);
      await captureQueue.add(mockCapture);

      await captureQueue.clear();

      const count = await captureQueue.count();
      expect(count).toBe(0);
    });

    it('does not throw when already empty', async () => {
      await expect(captureQueue.clear()).resolves.not.toThrow();
    });
  });
});
