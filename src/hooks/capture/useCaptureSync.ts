/**
 * useCaptureSync Hook
 *
 * Syncs queued offline captures when the device comes back online.
 * Processes captures one at a time to avoid overwhelming the network.
 *
 * Story 10-5: Quick Capture Mode (Task 8 - Offline Sync)
 *
 * @example
 * ```typescript
 * import { useCaptureSync } from '@/hooks/capture';
 *
 * function App() {
 *   const { pendingCount, isSyncing, syncError, syncNow } = useCaptureSync({
 *     userId: user.id,
 *   });
 *
 *   return (
 *     <div>
 *       {pendingCount > 0 && (
 *         <Badge>
 *           {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
 *         </Badge>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useOnlineStatus } from '@/hooks/offline';
import {
  captureQueue,
  base64ToFile,
  uploadQuickCapture,
  type QueuedCapture,
} from '@/lib/storage';
import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

/** Maximum number of sync attempts before giving up on a capture */
const MAX_ATTEMPTS = 3;

export interface UseCapturesSyncOptions {
  /** User ID for storage path scoping */
  userId: string;
  /** Whether to auto-sync when coming online (default: true) */
  autoSync?: boolean;
  /** Callback when all captures are synced */
  onSyncComplete?: () => void;
}

export interface UseCapturesSyncResult {
  /** Number of captures waiting to sync */
  pendingCount: number;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last sync error if any */
  syncError: Error | null;
  /** Manually trigger sync */
  syncNow: () => Promise<void>;
  /** Refresh the pending count */
  refreshCount: () => Promise<void>;
}

/**
 * Hook for syncing offline captures when back online.
 *
 * Features:
 * - Automatically syncs when device comes online
 * - Processes captures one at a time (FIFO order)
 * - Retries failed captures up to MAX_ATTEMPTS times
 * - Invalidates evidence queries on successful sync
 */
export function useCaptureSync({
  userId,
  autoSync = true,
  onSyncComplete,
}: UseCapturesSyncOptions): UseCapturesSyncResult {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  /**
   * Refresh the count of pending captures.
   */
  const refreshCount = useCallback(async () => {
    try {
      const count = await captureQueue.count();
      setPendingCount(count);
    } catch {
      // Silently fail - IndexedDB may not be available
      setPendingCount(0);
    }
  }, []);

  /**
   * Process a single queued capture.
   * Returns true if successful, false if failed.
   */
  const processCapture = useCallback(
    async (capture: QueuedCapture): Promise<boolean> => {
      try {
        // Convert base64 back to File
        const file = base64ToFile(
          capture.photoBase64,
          capture.fileName,
          capture.mimeType
        );

        // Upload to Supabase Storage
        const { path } = await uploadQuickCapture(file, userId);

        // Create evidence record
        await evidenceRepo.createPhotoEvidence({
          question_id: capture.questionId,
          title: capture.note || 'Quick capture photo',
          image_url: path,
          source_type: 'photo',
          excerpt: capture.note || null,
          created_by: userId,
        });

        // Remove from queue on success
        await captureQueue.remove(capture.id);

        // Invalidate evidence queries
        if (capture.questionId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.evidence.byQuestion(capture.questionId),
          });
        }

        return true;
      } catch (error) {
        // Mark the attempt and store the error
        await captureQueue.markAttempt(
          capture.id,
          error instanceof Error ? error.message : 'Unknown error'
        );

        // If max attempts reached, we'll skip it in next sync
        // (The capture stays in queue for manual retry/inspection)

        return false;
      }
    },
    [userId, queryClient]
  );

  /**
   * Sync all pending captures.
   */
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      setSyncError(new Error('Cannot sync while offline'));
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    let successCount = 0;
    let failCount = 0;

    try {
      const captures = await captureQueue.getAll();

      for (const capture of captures) {
        // Skip captures that have exceeded max attempts
        if (capture.attempts >= MAX_ATTEMPTS) {
          continue;
        }

        const success = await processCapture(capture);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Refresh the count
      await refreshCount();

      // Show toast with results
      if (successCount > 0) {
        toast.success(
          `Synced ${successCount} capture${successCount > 1 ? 's' : ''}`,
          {
            description:
              failCount > 0 ? `${failCount} failed, will retry` : undefined,
          }
        );
      } else if (failCount > 0) {
        toast.error('Sync failed', {
          description: `${failCount} capture${failCount > 1 ? 's' : ''} could not be synced`,
        });
      }

      if (pendingCount === 0 || successCount > 0) {
        onSyncComplete?.();
      }
    } catch (error) {
      const syncErr =
        error instanceof Error ? error : new Error('Sync failed');
      setSyncError(syncErr);
      toast.error('Sync failed', {
        description: syncErr.message,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, processCapture, refreshCount, pendingCount, onSyncComplete]);

  // Initial count load
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Auto-sync when coming online
  useEffect(() => {
    if (autoSync && isOnline && pendingCount > 0 && !isSyncing) {
      syncNow();
    }
  }, [autoSync, isOnline, pendingCount, isSyncing, syncNow]);

  return {
    pendingCount,
    isSyncing,
    syncError,
    syncNow,
    refreshCount,
  };
}
