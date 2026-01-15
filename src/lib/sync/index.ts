/**
 * Sync Engine Module - Public API
 *
 * Exports the sync engine functions and types for offline action synchronization.
 * Internal modules (processor.ts, backoff.ts) are not exported.
 *
 * @example
 * ```typescript
 * import { startSync, stopSync, getSyncStatus, clearConflictAndResume } from '@/lib/sync';
 * import { detectConflict, resolveConflict } from '@/lib/sync';
 * import type { SyncEngineState, SyncEngineStatus, ConflictData, ConflictResolution } from '@/lib/sync';
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
 * // Handle conflicts
 * if (status.currentConflict) {
 *   await resolveConflict(status.currentConflict, 'keep-server', profileId);
 *   clearConflictAndResume(queryClient);
 * }
 *
 * // Stop sync before logout
 * stopSync();
 * ```
 *
 * @see Story 8.3: Sync Engine
 * @see Story 8.4: Conflict Detection & Resolution
 */

// Engine functions
export { clearConflictAndResume, getSyncStatus, startSync, stopSync } from './engine';

// Conflict functions
export { detectConflict, resolveConflict } from './conflicts';

// Types
export type {
  ConflictConfig,
  ConflictData,
  ConflictResolution,
  SyncConfig,
  SyncEngineState,
  SyncEngineStatus,
  SyncResult,
} from './types';

export { CONFLICT_CONFIG, SYNC_CONFIG } from './types';

// Hook for auto-sync on online
export { useSyncOnline } from './useSyncOnline';
