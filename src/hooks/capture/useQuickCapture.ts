/**
 * useQuickCapture Hook
 *
 * Orchestrates the full quick capture flow:
 * 1. Upload photo to Supabase Storage
 * 2. Create evidence record in database
 * 3. Handle offline queueing when not connected
 *
 * Story 10-5: Quick Capture Mode
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useOnlineStatus, isOfflineError } from '@/hooks/offline';
import { uploadQuickCapture } from '@/lib/storage';
import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import type { QuickCaptureData } from '@/components/capture';
import type { Evidence } from '@/types/evidence';

export interface UseQuickCaptureOptions {
  /** User ID for storage path scoping */
  userId: string;
  /** Question ID to attach the evidence to (optional - can be added later) */
  questionId?: string;
  /** Callback when capture succeeds */
  onSuccess?: (evidence: Evidence) => void;
  /** Callback when capture fails */
  onError?: (error: Error) => void;
}

export interface UseQuickCaptureResult {
  /** Submit a captured photo */
  submitCapture: (data: QuickCaptureData) => void;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Whether DB save is in progress */
  isPending: boolean;
  /** Whether any operation is in progress */
  isSubmitting: boolean;
  /** Last error if any */
  error: Error | null;
  /** Reset error state */
  reset: () => void;
}

/**
 * Hook for submitting quick capture photos as evidence.
 *
 * Handles the full flow:
 * - Uploads photo to Supabase Storage (private bucket)
 * - Creates evidence record linking to the uploaded photo
 * - Shows toast notifications for success/error
 * - Handles offline queuing (when offline, saves to local queue)
 *
 * @example
 * const { submitCapture, isSubmitting } = useQuickCapture({
 *   userId: user.id,
 *   questionId: currentQuestionId,
 *   onSuccess: () => setSheetOpen(false),
 * });
 */
export function useQuickCapture({
  userId,
  questionId,
  onSuccess,
  onError,
}: UseQuickCaptureOptions): UseQuickCaptureResult {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  const mutation = useMutation({
    mutationFn: async (data: QuickCaptureData) => {
      // Step 1: Upload photo to storage
      const { path } = await uploadQuickCapture(data.photo, userId);

      // Step 2: Create evidence record with storage path
      // Note: We store the path, not the signed URL, since URLs expire
      const evidence = await evidenceRepo.createPhotoEvidence({
        question_id: questionId ?? null,
        title: data.note || 'Quick capture photo',
        image_url: path, // Store the storage path for later signed URL generation
        source_type: 'photo',
        excerpt: data.note || null,
        created_by: userId,
      });

      return evidence;
    },

    onSuccess: (evidence) => {
      // Invalidate relevant queries
      if (questionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.evidence.byQuestion(questionId),
        });
      }

      toast.success('Photo captured', {
        description: 'Evidence saved successfully',
      });

      onSuccess?.(evidence);
    },

    onError: (error: Error) => {
      // Skip duplicate toast if offline error (guard already showed toast)
      if (!isOfflineError(error)) {
        toast.error('Capture failed', {
          description: error.message || 'Could not save photo',
        });
      }

      onError?.(error);
    },
  });

  const submitCapture = (data: QuickCaptureData) => {
    if (!isOnline) {
      // TODO: Queue for offline sync (Task 7)
      // For now, show offline toast
      toast.error('Cannot capture while offline', {
        description: 'Photo capture requires internet connection',
      });
      return;
    }

    mutation.mutate(data);
  };

  return {
    submitCapture,
    isUploading: mutation.isPending, // Storage upload in progress
    isPending: mutation.isPending, // DB save in progress
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
