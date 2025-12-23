import { toast } from 'sonner';

import { useUpdateQuestion } from './useUpdateQuestion';

import type { QuestionStatus } from '@/types/question';

interface MarkReadyForKelOptions {
  onSuccess?: () => void;
}

/**
 * Hook for marking a question as ready for Kel.
 * Wraps useUpdateQuestion with status transition validation.
 *
 * Only allows: draft → ready_for_kel
 */
export function useMarkReadyForKel() {
  const { mutate: updateQuestion, isPending, ...rest } = useUpdateQuestion();

  const markReadyForKel = (
    questionId: string,
    currentStatus: QuestionStatus,
    options?: MarkReadyForKelOptions
  ) => {
    // Validate status transition
    if (currentStatus !== 'draft') {
      toast.error('Cannot send to Kel', {
        description:
          currentStatus === 'ready_for_kel'
            ? 'Question is already sent to Kel'
            : `Question must be in draft status (current: ${currentStatus})`,
      });
      return;
    }

    updateQuestion(
      {
        id: questionId,
        updates: { status: 'ready_for_kel' },
      },
      {
        onSuccess: () => {
          toast.success('Question sent to Kel');
          options?.onSuccess?.();
        },
      }
    );
  };

  return {
    markReadyForKel,
    isPending,
    ...rest,
  };
}
