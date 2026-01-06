/**
 * Offline Capture Queue
 *
 * IndexedDB-backed queue for storing quick captures when offline.
 * Captures are stored as base64 and synced when back online.
 *
 * Story 10-5: Quick Capture Mode (Task 7 - Offline Queue)
 *
 * @example
 * ```typescript
 * import { captureQueue } from '@/lib/storage/captureQueue';
 *
 * // Add capture to queue when offline
 * const id = await captureQueue.add({
 *   photoBase64: base64Data,
 *   fileName: 'photo.jpg',
 *   mimeType: 'image/jpeg',
 *   note: 'Market observation',
 *   userId: 'user123',
 *   questionId: 'q1', // optional
 * });
 *
 * // Get all pending captures
 * const pending = await captureQueue.getAll();
 *
 * // Remove after successful sync
 * await captureQueue.remove(id);
 * ```
 */

const DB_NAME = 'kel-capture-queue';
const DB_VERSION = 1;
const STORE_NAME = 'captures';

export interface QueuedCapture {
  /** Unique ID for this queued item */
  id: string;
  /** Base64-encoded photo data */
  photoBase64: string;
  /** Original file name */
  fileName: string;
  /** MIME type of the photo */
  mimeType: string;
  /** Optional note from user */
  note: string;
  /** User ID for storage path scoping */
  userId: string;
  /** Question ID to attach evidence to (optional) */
  questionId: string | null;
  /** Timestamp when capture was queued */
  createdAt: string;
  /** Number of sync attempts */
  attempts: number;
  /** Last error message if sync failed */
  lastError: string | null;
}

export type QueuedCaptureInput = Omit<QueuedCapture, 'id' | 'createdAt' | 'attempts' | 'lastError'>;

/**
 * Open the IndexedDB database, creating it if needed.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create the captures store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Index for querying by user
        store.createIndex('userId', 'userId', { unique: false });
        // Index for querying by creation time (oldest first for sync)
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Generate a unique ID for queue items.
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Capture Queue - IndexedDB operations for offline captures.
 */
export const captureQueue = {
  /**
   * Add a capture to the offline queue.
   *
   * @param input - Capture data to queue
   * @returns The generated ID for the queued capture
   */
  add: async (input: QueuedCaptureInput): Promise<string> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const capture: QueuedCapture = {
        ...input,
        id: generateId(),
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastError: null,
      };

      const request = store.add(capture);

      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to queue capture: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        db.close();
        resolve(capture.id);
      };
    });
  },

  /**
   * Get all pending captures from the queue.
   * Returns captures sorted by creation time (oldest first).
   */
  getAll: async (): Promise<QueuedCapture[]> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const request = index.getAll();

      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to get captures: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
    });
  },

  /**
   * Get a single capture by ID.
   */
  get: async (id: string): Promise<QueuedCapture | null> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to get capture: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        db.close();
        resolve(request.result ?? null);
      };
    });
  },

  /**
   * Get the count of pending captures.
   */
  count: async (): Promise<number> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to count captures: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
    });
  },

  /**
   * Remove a capture from the queue (after successful sync).
   */
  remove: async (id: string): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to remove capture: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        db.close();
        resolve();
      };
    });
  },

  /**
   * Update a capture's sync attempt info (after failed sync).
   */
  markAttempt: async (id: string, error: string): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onerror = () => {
        db.close();
        reject(new Error(`Failed to get capture: ${getRequest.error?.message}`));
      };

      getRequest.onsuccess = () => {
        const capture = getRequest.result as QueuedCapture | undefined;
        if (!capture) {
          db.close();
          reject(new Error('Capture not found'));
          return;
        }

        const updated: QueuedCapture = {
          ...capture,
          attempts: capture.attempts + 1,
          lastError: error,
        };

        const putRequest = store.put(updated);

        putRequest.onerror = () => {
          db.close();
          reject(new Error(`Failed to update capture: ${putRequest.error?.message}`));
        };

        putRequest.onsuccess = () => {
          db.close();
          resolve();
        };
      };
    });
  },

  /**
   * Clear all captures from the queue.
   * Use with caution - mainly for testing or user-initiated clear.
   */
  clear: async (): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        db.close();
        reject(new Error(`Failed to clear queue: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        db.close();
        resolve();
      };
    });
  },
};

/** Export constants for testing */
export const CAPTURE_QUEUE_DB_NAME = DB_NAME;
export const CAPTURE_QUEUE_STORE_NAME = STORE_NAME;
