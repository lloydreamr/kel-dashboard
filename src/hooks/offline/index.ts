/**
 * Offline Hooks Index
 *
 * Barrel export for offline-related hooks.
 * Import from '@/hooks/offline' for offline status and guards.
 *
 * @example
 * import { useOnlineStatus, useOfflineGuard } from '@/hooks/offline';
 */

export { useOnlineStatus } from './useOnlineStatus';
export type { UseOnlineStatusResult } from './useOnlineStatus';

export {
  useOfflineGuard,
  OFFLINE_TOAST_ID,
  OFFLINE_MESSAGE,
  OfflineError,
  isOfflineError,
} from './useOfflineGuard';
export type { UseOfflineGuardResult } from './useOfflineGuard';

export { useServiceWorkerUpdate } from './useServiceWorkerUpdate';

export { useSyncStatus } from './useSyncStatus';
export type { SyncState, SyncStatusResult } from './useSyncStatus';

export { useManualRefresh } from './useManualRefresh';
export type { UseManualRefreshResult } from './useManualRefresh';

export { useSyncOnQuerySuccess } from './useSyncOnQuerySuccess';

export {
  useItemSyncStatus,
  dispatchQueueChangeEvent,
  QUEUE_CHANGE_EVENT,
} from './useItemSyncStatus';
export type { UseItemSyncStatusResult } from './useItemSyncStatus';
