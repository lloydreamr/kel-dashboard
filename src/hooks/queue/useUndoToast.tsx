/**
 * useUndoToast Hook
 *
 * Hook for showing custom undo toast with progress bar countdown.
 * Uses toast.custom() from Sonner to render UndoToast component.
 *
 * Requirements: AC1, AC2 from Story 4.13
 */

import { useCallback } from 'react';
import { toast } from 'sonner';

import { UndoToast } from '@/components/queue/UndoToast';
import { useUndoDecision } from '@/hooks/decisions';

interface ShowUndoToastParams {
  /** Success message to display */
  message: string;
  /** ID of the decision to potentially undo */
  decisionId: string;
  /** ID of the question associated with the decision */
  questionId: string;
}

interface UseUndoToastResult {
  /** Function to show the undo toast */
  showUndoToast: (params: ShowUndoToastParams) => string | number;
  /** Whether an undo operation is currently in progress */
  isUndoing: boolean;
}

/**
 * Hook for showing undo toast with progress bar.
 *
 * @example
 * ```tsx
 * const { showUndoToast, isUndoing } = useUndoToast();
 *
 * // After a successful decision
 * showUndoToast({
 *   message: 'Approved!',
 *   decisionId: result.decision.id,
 *   questionId: question.id,
 * });
 * ```
 */
export function useUndoToast(): UseUndoToastResult {
  const { mutate: undoDecision, isPending } = useUndoDecision();

  const showUndoToast = useCallback(
    ({ message, decisionId, questionId }: ShowUndoToastParams) => {
      const toastId = toast.custom(
        (t) => (
          <UndoToast
            message={message}
            onUndo={() => {
              undoDecision({ decisionId, questionId });
              toast.dismiss(t);
            }}
            onDismiss={() => toast.dismiss(t)}
          />
        ),
        {
          duration: Infinity, // We manage dismissal via UndoToast's internal timer
        }
      );

      return toastId;
    },
    [undoDecision]
  );

  return {
    showUndoToast,
    isUndoing: isPending,
  };
}
