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
