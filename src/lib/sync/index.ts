/**
 * Sync Engine Module - Public API
 *
 * Exports the sync engine functions and types for offline action synchronization.
 * Internal modules (processor.ts, backoff.ts) are not exported.
 *
 * @example
 * ```typescript
 * import { startSync, stopSync, getSyncStatus } from '@/lib/sync';
 * import type { SyncEngineState, SyncEngineStatus } from '@/lib/sync';
 *
 * // Start sync when online
 * await startSync(queryClient);
 *
 * // Check status
 * const status = getSyncStatus();
 * if (status.status === 'syncing') {
 *   showSyncingIndicator();
 * }
 *
 * // Stop sync before logout
 * stopSync();
 * ```
 *
 * @see Story 8.3: Sync Engine
 */

// Engine functions
export { getSyncStatus, startSync, stopSync } from './engine';

// Types
export type {
  SyncConfig,
  SyncEngineState,
  SyncEngineStatus,
  SyncResult,
} from './types';

export { SYNC_CONFIG } from './types';

// Hook for auto-sync on online
export { useSyncOnline } from './useSyncOnline';
