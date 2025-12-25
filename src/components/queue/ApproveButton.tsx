'use client';

/**
 * ApproveButton Component
 *
 * Single-tap approve button for Kel's decision queue.
 * Triggers haptic feedback, shows loading state, and handles
 * success/error toasts with undo functionality.
 *
 * Requirements: AC1, AC7, AC8, AC9 from Story 4.4
 */

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useApproveDecision } from '@/hooks/decisions';
import { useUndoToast } from '@/hooks/queue';
import { useHaptic } from '@/hooks/ui';

import type { Question } from '@/types/question';

/** Sync state for lifting to parent component */
export interface SyncState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  /** Optional retry function for error recovery */
  retryFn?: () => void;
}

interface ApproveButtonProps {
  question: Question;
  onApproveStart?: () => void;
  onApproveComplete?: () => void;
  onApproveError?: (error: Error) => void;
  /** Reports sync state changes for parent indicator */
  onSyncStateChange?: (state: SyncState) => void;
}

/**
 * Approve button with haptic feedback and toast notifications.
 *
 * @example
 * ```tsx
 * <ApproveButton
 *   question={question}
 *   onApproveComplete={() => setShowCelebration(true)}
 * />
 * ```
 */
export function ApproveButton({
  question,
  onApproveStart,
  onApproveComplete,
  onApproveError,
  onSyncStateChange,
}: ApproveButtonProps) {
  const { trigger: triggerHaptic } = useHaptic();
  const { approveAsync, isPending, isSuccess, isError } = useApproveDecision();
  const { showUndoToast, isUndoing } = useUndoToast();

  // Ref for stable retry callback - used in toast action to avoid self-reference
  const retryRef = useRef<(() => void) | undefined>(undefined);

  // Define handleApprove with useCallback so it can be used in useEffect
  const handleApprove = useCallback(async () => {
    // Trigger haptic feedback immediately (AC1)
    triggerHaptic('light');

    // Notify parent that approval is starting
    onApproveStart?.();

    try {
      const result = await approveAsync({ questionId: question.id });

      // Show success toast with undo action and progress bar (AC7, Story 4.13)
      showUndoToast({
        message: 'Approved!',
        decisionId: result.decision.id,
        questionId: question.id,
      });

      // Notify parent of successful completion
      onApproveComplete?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      // Show error toast with retry (AC8)
      // Use retryRef to avoid self-reference in useCallback
      toast.error("Couldn't save. Retry?", {
        id: `approve-error-${question.id}`,
        action: {
          label: 'Retry',
          onClick: () => retryRef.current?.(),
        },
      });

      // Notify parent of error
      onApproveError?.(err);
    }
  }, [triggerHaptic, onApproveStart, approveAsync, question.id, showUndoToast, onApproveComplete, onApproveError]);

  // Keep retryRef updated with latest handleApprove
  useEffect(() => {
    retryRef.current = handleApprove;
  }, [handleApprove]);

  // Report sync state changes to parent - only when state actually changes
  // Use refs to track previous values and avoid unnecessary calls
  const prevStateRef = useRef({ isPending: false, isSuccess: false, isError: false });
  useEffect(() => {
    const prev = prevStateRef.current;
    // Only call if state actually changed
    if (prev.isPending !== isPending || prev.isSuccess !== isSuccess || prev.isError !== isError) {
      prevStateRef.current = { isPending, isSuccess, isError };
      onSyncStateChange?.({
        isPending,
        isSuccess,
        isError,
        retryFn: isError ? handleApprove : undefined,
      });
    }
  }, [isPending, isSuccess, isError, onSyncStateChange, handleApprove]);

  return (
    <button
      type="button"
      data-testid="approve-button"
      onClick={handleApprove}
      disabled={isPending || isUndoing}
      className="min-h-[48px] px-6 py-2 rounded-lg bg-success text-success-foreground font-medium
        hover:bg-success/90 active:scale-[0.98] transition-all
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Saving...
        </span>
      ) : (
        'Approve'
      )}
    </button>
  );
}
