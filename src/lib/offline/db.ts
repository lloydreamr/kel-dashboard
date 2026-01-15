/**
 * IndexedDB database initialization and management.
 * Internal module - not exported from package index.
 *
 * @see Story 8.2: IndexedDB Offline Queue
 */

import { openDB } from 'idb';

import { FEATURES } from '@/lib/features';

import type { IDBPDatabase } from 'idb';
import type { KelDB } from './types';
import { DB_CONFIG } from './types';

/**
 * Global reference for database instance to survive HMR in development.
 * In production, this is just a regular module-scoped variable.
 *
 * This pattern is used by Next.js for things like Prisma client to prevent
 * multiple instances being created during hot module replacement.
 */
const globalForDb = globalThis as unknown as {
  kelDbInstance: IDBPDatabase<KelDB> | null | undefined;
};

/**
 * Singleton database instance.
 * Lazily initialized on first access.
 * Uses globalThis in development to survive HMR.
 */
let dbInstance: IDBPDatabase<KelDB> | null =
  process.env.NODE_ENV === 'development'
    ? (globalForDb.kelDbInstance ?? null)
    : null;

/**
 * Opens the IndexedDB database, creating it if it doesn't exist.
 *
 * Uses idb library for Promise-based API and full TypeScript support.
 * Database is only created when OFFLINE_MODE feature flag is enabled.
 *
 * @returns The database instance, or null if offline mode is disabled
 *
 * @example
 * ```typescript
 * const db = await openDatabase();
 * if (db) {
 *   await db.add('offline-queue', action);
 * }
 * ```
 */
export async function openDatabase(): Promise<IDBPDatabase<KelDB> | null> {
  // Check feature flag - don't create database if offline mode is disabled
  if (!FEATURES.OFFLINE_MODE) {
    return null;
  }

  // Return cached instance if available
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<KelDB>(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
      upgrade(db) {
        // Create offline-queue store if it doesn't exist
        if (!db.objectStoreNames.contains(DB_CONFIG.STORE_NAME)) {
          const store = db.createObjectStore(DB_CONFIG.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes for efficient querying
          // by-status: Filter actions by sync status
          store.createIndex('by-status', 'status');
          // by-created: Order actions by creation time (FIFO)
          store.createIndex('by-created', 'createdAt');
        }
      },
    });

    // Store in globalThis for HMR survival in development
    if (process.env.NODE_ENV === 'development') {
      globalForDb.kelDbInstance = dbInstance;
    }

    return dbInstance;
  } catch (error) {
    console.error('[offline/db] Failed to open database:', error);
    return null;
  }
}

/**
 * Closes the database connection and clears the cached instance.
 * Useful for testing and cleanup.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    if (process.env.NODE_ENV === 'development') {
      globalForDb.kelDbInstance = null;
    }
  }
}

/**
 * Resets the database instance for testing.
 * Only clears the cached reference - doesn't delete the database.
 *
 * @internal Used by tests only
 */
export function resetDatabaseInstance(): void {
  dbInstance = null;
  if (process.env.NODE_ENV === 'development') {
    globalForDb.kelDbInstance = null;
  }
}
