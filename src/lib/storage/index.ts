/**
 * Storage Utilities Index
 *
 * Barrel export for storage-related utilities.
 * Import from '@/lib/storage' for localStorage and Supabase storage operations.
 *
 * @example
 * // localStorage sync tracking
 * import { getSyncTimestamp, setSyncTimestamp } from '@/lib/storage';
 *
 * // Supabase photo storage
 * import { uploadQuickCapture, getSignedUrl } from '@/lib/storage';
 *
 * // Offline capture queue (IndexedDB)
 * import { captureQueue } from '@/lib/storage';
 */

// localStorage utilities for sync tracking
export {
  getSyncTimestamp,
  setSyncTimestamp,
  clearSyncTimestamp,
  SYNC_STORAGE_KEY_EXPORT,
} from './syncStorage';

// Supabase Storage utilities for quick capture photos
export {
  uploadQuickCapture,
  getSignedUrl,
  deleteQuickCapture,
  fileToBase64,
  base64ToFile,
  QUICK_CAPTURES_BUCKET,
  type UploadResult,
  type QuickCaptureStorageError,
} from './quickCaptureStorage';

// IndexedDB queue for offline captures
export {
  captureQueue,
  CAPTURE_QUEUE_DB_NAME,
  CAPTURE_QUEUE_STORE_NAME,
  type QueuedCapture,
  type QueuedCaptureInput,
} from './captureQueue';
