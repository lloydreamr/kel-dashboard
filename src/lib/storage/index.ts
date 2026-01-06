/**
 * Storage Utilities Index
 *
 * Barrel export for storage-related utilities.
 * Import from '@/lib/storage' for localStorage and storage operations.
 *
 * @example
 * import { getSyncTimestamp, setSyncTimestamp } from '@/lib/storage';
 */

export {
  getSyncTimestamp,
  setSyncTimestamp,
  clearSyncTimestamp,
  SYNC_STORAGE_KEY_EXPORT,
} from './syncStorage';
