/**
 * Quick Capture Storage Service
 *
 * Handles uploading and managing photos in Supabase Storage
 * for the quick capture feature (Story 10-5).
 *
 * File paths follow the pattern: {user_id}/{timestamp}_{random}.{ext}
 * This ensures user-scoped access via RLS policies.
 *
 * @example
 * ```typescript
 * import { uploadQuickCapture, getPublicUrl } from '@/lib/storage/quickCaptureStorage';
 *
 * // Upload a photo
 * const imageUrl = await uploadQuickCapture(file, userId);
 *
 * // Get a signed URL for display
 * const signedUrl = await getSignedUrl(imagePath);
 * ```
 */

import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'quick-captures';

export interface UploadResult {
  /** Path to the uploaded file in storage */
  path: string;
  /** Public URL for the file (if bucket is public) or signed URL */
  url: string;
}

export interface QuickCaptureStorageError extends Error {
  code: 'UPLOAD_FAILED' | 'DELETE_FAILED' | 'URL_FAILED' | 'INVALID_FILE';
}

/**
 * Generate a unique file path for the upload.
 * Format: {userId}/{timestamp}_{randomId}.{extension}
 */
function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${userId}/${timestamp}_${randomId}.${extension}`;
}

/**
 * Validate that the file is an acceptable image type and size.
 */
function validateFile(file: File): void {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  const maxSize = 10 * 1024 * 1024; // 10MB per story spec

  if (!validTypes.includes(file.type)) {
    const error = new Error(
      `Invalid file type: ${file.type}. Accepted: JPEG, PNG, WebP, HEIC`
    ) as QuickCaptureStorageError;
    error.code = 'INVALID_FILE';
    throw error;
  }

  if (file.size > maxSize) {
    const error = new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`
    ) as QuickCaptureStorageError;
    error.code = 'INVALID_FILE';
    throw error;
  }
}

/**
 * Upload a photo to the quick-captures bucket.
 *
 * @param file - The image file to upload
 * @param userId - The authenticated user's ID (for path scoping)
 * @returns Upload result with path and URL
 * @throws QuickCaptureStorageError on validation or upload failure
 */
export async function uploadQuickCapture(
  file: File,
  userId: string
): Promise<UploadResult> {
  // Validate file before upload
  validateFile(file);

  const supabase = createClient();
  const filePath = generateFilePath(userId, file.name);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    const storageError = new Error(
      `Upload failed: ${error.message}`
    ) as QuickCaptureStorageError;
    storageError.code = 'UPLOAD_FAILED';
    throw storageError;
  }

  // Get signed URL for the private bucket
  const url = await getSignedUrl(filePath);

  return { path: filePath, url };
}

/**
 * Get a signed URL for accessing a private file.
 * URLs expire after 1 hour by default.
 *
 * @param path - The file path in storage
 * @param expiresIn - Seconds until URL expires (default: 3600 = 1 hour)
 * @returns Signed URL for the file
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    const storageError = new Error(
      `Failed to get URL: ${error?.message || 'Unknown error'}`
    ) as QuickCaptureStorageError;
    storageError.code = 'URL_FAILED';
    throw storageError;
  }

  return data.signedUrl;
}

/**
 * Delete a photo from storage.
 *
 * @param path - The file path to delete
 */
export async function deleteQuickCapture(path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    const storageError = new Error(
      `Delete failed: ${error.message}`
    ) as QuickCaptureStorageError;
    storageError.code = 'DELETE_FAILED';
    throw storageError;
  }
}

/**
 * Convert a File/Blob to base64 for offline storage.
 * Used when storing captures in IndexedDB for later upload.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a base64 string back to a File for upload.
 * Used when uploading offline captures after reconnection.
 */
export function base64ToFile(
  base64: string,
  fileName: string,
  mimeType: string
): File {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], fileName, { type: mimeType });
}

/** Export bucket name for testing */
export const QUICK_CAPTURES_BUCKET = BUCKET_NAME;
