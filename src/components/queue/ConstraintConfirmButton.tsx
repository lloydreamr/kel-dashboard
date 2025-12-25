'use client';

/**
 * ConstraintConfirmButton Component
 *
 * Confirm button for the constraint panel with:
 * - Medium haptic feedback (40ms) on click
 * - Loading state during mutation
 * - Toast notifications (success with undo, error with retry)
 *
 * Requirements: AC6, AC9, AC10 from Story 4.5
 */

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useApproveWithConstraints } from '@/hooks/decisions';
import { useUndoToast } from '@/hooks/queue';
import { useHaptic } from '@/hooks/ui';

import type { SyncState } from './ApproveButton';
import type { Constraint } from '@/types/decision';

interface ConstraintConfirmButtonProps {
  questionId: string;
  constraints: Constraint[];
  context?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Reports sync state changes for parent indicator */
  onSyncStateChange?: (state: SyncState) => void;
}

/**
 * Confirm button with haptic feedback and toast notifications.
 * Triggers medium haptic (40ms) per UX spec for constraint confirmation.
 */
export function ConstraintConfirmButton({
  questionId,
  constraints,
  context,
  disabled = false,
  onSuccess,
  onError,
  onSyncStateChange,
}: ConstraintConfirmButtonProps) {
  const { trigger: triggerHaptic } = useHaptic();
  const { approveWithConstraintsAsync, isPending, isSuccess, isError } =
    useApproveWithConstraints();
  const { showUndoToast, isUndoing } = useUndoToast();

  // Ref for stable retry callback - used in toast action to avoid self-reference
  const retryRef = useRef<(() => void) | undefined>(undefined);

  // Define handleConfirm with useCallback so it can be used in useEffect
  const handleConfirm = useCallback(async () => {
    // Trigger medium haptic feedback (40ms per AC6)
    triggerHaptic('medium');

    try {
      const result = await approveWithConstraintsAsync({
        questionId,
        constraints,
        context,
      });

      // Show success toast with undo action and progress bar (AC10, Story 4.13)
      showUndoToast({
        message: 'Approved with constraints',
        decisionId: result.decision.id,
        questionId,
      });

      // Notify parent of successful completion
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      // Show error toast with retry
      // Use retryRef to avoid self-reference in useCallback
      toast.error("Couldn't save. Retry?", {
        id: `approve-constraint-error-${questionId}`,
        action: {
          label: 'Retry',
          onClick: () => retryRef.current?.(),
        },
      });

      // Notify parent of error
      onError?.(err);
    }
  }, [triggerHaptic, approveWithConstraintsAsync, questionId, constraints, context, showUndoToast, onSuccess, onError]);

  // Keep retryRef updated with latest handleConfirm
  useEffect(() => {
    retryRef.current = handleConfirm;
  }, [handleConfirm]);

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
        retryFn: isError ? handleConfirm : undefined,
      });
    }
  }, [isPending, isSuccess, isError, onSyncStateChange, handleConfirm]);

  const isDisabled = disabled || isPending || isUndoing;

  return (
    <button
      type="button"
      data-testid="constraint-confirm-button"
      onClick={handleConfirm}
      disabled={isDisabled}
      className="min-h-[48px] px-6 py-2 rounded-md font-medium bg-primary text-primary-foreground
        hover:bg-primary/90 active:scale-[0.98] transition-all
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
        'Confirm'
      )}
    </button>
  );
}
