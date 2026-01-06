/**
 * useAddEvidence Hook
 *
 * TanStack Query mutation hook for adding evidence to a question.
 * Supports optimistic updates for immediate UI feedback.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useOfflineGuard, isOfflineError } from '@/hooks/offline';
import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import type { Evidence, CreateEvidenceInput } from '@/types/evidence';

/**
 * Hook for adding new evidence with optimistic updates.
 *
 * Features:
 * - Optimistic UI: Shows pending evidence immediately
 * - Auto-rollback on error
 * - Success toast
 * - Cache invalidation on settle
 *
 * @param questionId - Question ID to add evidence to
 *
 * @example
 * const { mutate: addEvidence, isPending } = useAddEvidence(questionId);
 * addEvidence({ title: 'Source', url: 'https://example.com', created_by: userId });
 */
export function useAddEvidence(questionId: string) {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: (input: Omit<CreateEvidenceInput, 'question_id'>) => {
      return evidenceRepo.create({ ...input, question_id: questionId });
    },

    // Optimistic update: Add pending evidence to list
    onMutate: async (newEvidence) => {
      // Check offline status FIRST before any async operations
      // This prevents mutation from getting stuck on cancelQueries when offline
      guardOffline(); // Throws OfflineError if offline

      const queryKey = queryKeys.evidence.byQuestion(questionId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value (default to empty array if cache is empty)
      const previousEvidence =
        queryClient.getQueryData<Evidence[]>(queryKey) ?? [];

      // Optimistically add the new evidence
      const now = new Date().toISOString();
      const optimisticEvidence: Evidence = {
        id: `temp-${Date.now()}`,
        question_id: questionId,
        title: newEvidence.title,
        url: newEvidence.url,
        section_anchor: newEvidence.section_anchor ?? null,
        excerpt: newEvidence.excerpt ?? null,
        created_by: newEvidence.created_by,
        created_at: now,
        updated_at: now,
      };
      queryClient.setQueryData(queryKey, [
        ...previousEvidence,
        optimisticEvidence,
      ]);

      return { previousEvidence };
    },

    // Rollback on error
    onError: (error, _newEvidence, context) => {
      const queryKey = queryKeys.evidence.byQuestion(questionId);
      if (context?.previousEvidence) {
        queryClient.setQueryData(queryKey, context.previousEvidence);
      }
      // Skip duplicate toast if offline error (guardOffline already showed toast)
      if (isOfflineError(error)) return;
      toast.error('Failed to add evidence', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Success toast
    onSuccess: () => {
      toast.success('Evidence added');
    },

    // Always invalidate to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.evidence.byQuestion(questionId),
      });
    },
  });
}
