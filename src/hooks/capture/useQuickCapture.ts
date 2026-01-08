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
import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';
import { uploadQuickCapture, fileToBase64 } from '@/lib/storage';
import { captureQueue } from '@/lib/storage/captureQueue';

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
      // Use questionId from data (user's selection in sheet) over prop default
      const effectiveQuestionId = data.questionId ?? questionId ?? null;

      // Step 1: Upload photo to storage
      const { path } = await uploadQuickCapture(data.photo, userId);

      // Step 2: Create evidence record with storage path
      // Note: We store the path, not the signed URL, since URLs expire
      const evidence = await evidenceRepo.createPhotoEvidence({
        question_id: effectiveQuestionId,
        title: data.note || 'Quick capture photo',
        image_url: path, // Store the storage path for later signed URL generation
        source_type: 'photo',
        excerpt: data.note || null,
        created_by: userId,
      });

      return { evidence, questionId: effectiveQuestionId };
    },

    onSuccess: ({ evidence, questionId: effectiveQuestionId }) => {
      // Invalidate relevant queries
      if (effectiveQuestionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.evidence.byQuestion(effectiveQuestionId),
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

  const submitCapture = async (data: QuickCaptureData) => {
    if (!isOnline) {
      // Use questionId from data (user's selection in sheet) over prop default
      const effectiveQuestionId = data.questionId ?? questionId ?? null;

      // Queue for offline sync - convert file to base64 and store in IndexedDB
      try {
        const photoBase64 = await fileToBase64(data.photo);
        await captureQueue.add({
          photoBase64,
          fileName: data.photo.name,
          mimeType: data.photo.type,
          note: data.note || '',
          category: data.category,
          userId,
          questionId: effectiveQuestionId,
        });

        toast.success('Photo queued', {
          description: 'Will sync when back online',
        });

        // Call onSuccess with a placeholder - the real evidence will be created on sync
        // Using null cast to satisfy the callback type since we don't have a real evidence record yet
        onSuccess?.(null as unknown as Evidence);
      } catch (error) {
        toast.error('Failed to queue capture', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        onError?.(error instanceof Error ? error : new Error('Queue failed'));
      }
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
