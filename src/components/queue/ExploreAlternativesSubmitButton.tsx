'use client';

/**
 * ExploreAlternativesSubmitButton Component
 *
 * Submit button for the alternatives panel with:
 * - Warning haptic feedback (40, 30, 40 double pulse) on click
 * - Loading state during mutation
 * - Toast notifications (success: "Feedback sent to Maho", error with retry)
 *
 * Requirements: AC6, AC11 from Story 4.6
 */

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useExploreAlternatives } from '@/hooks/decisions';
import { useUndoToast } from '@/hooks/queue';
import { useHaptic } from '@/hooks/ui';

import type { SyncState } from './ApproveButton';

interface ExploreAlternativesSubmitButtonProps {
  questionId: string;
  reasoning: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Reports sync state changes for parent indicator */
  onSyncStateChange?: (state: SyncState) => void;
}

/**
 * Submit button with haptic feedback and toast notifications.
 * Triggers warning haptic (40, 30, 40 double pulse) per UX spec for acknowledgment pattern.
 */
export function ExploreAlternativesSubmitButton({
  questionId,
  reasoning,
  disabled = false,
  onSuccess,
  onError,
  onSyncStateChange,
}: ExploreAlternativesSubmitButtonProps) {
  const { trigger: triggerHaptic } = useHaptic();
  const { exploreAlternativesAsync, isPending, isSuccess, isError } =
    useExploreAlternatives();
  const { showUndoToast, isUndoing } = useUndoToast();

  // Ref for stable retry callback - used in toast action to avoid self-reference
  const retryRef = useRef<(() => void) | undefined>(undefined);

  // Define handleSubmit with useCallback so it can be used in useEffect
  const handleSubmit = useCallback(async () => {
    // Trigger warning haptic feedback (acknowledgment pattern per AC6)
    triggerHaptic('warning');

    try {
      const result = await exploreAlternativesAsync({
        questionId,
        reasoning: reasoning.trim(),
      });

      // Show success toast with undo action and progress bar (AC11, Story 4.13)
      showUndoToast({
        message: 'Feedback sent to Maho',
        decisionId: result.decision.id,
        questionId,
      });

      // Notify parent of successful completion
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      // Show error toast with retry
      // Use retryRef to avoid self-reference in useCallback
      toast.error("Couldn't send. Retry?", {
        id: `explore-alternatives-error-${questionId}`,
        action: {
          label: 'Retry',
          onClick: () => retryRef.current?.(),
        },
      });

      // Notify parent of error
      onError?.(err);
    }
  }, [triggerHaptic, exploreAlternativesAsync, questionId, reasoning, showUndoToast, onSuccess, onError]);

  // Keep retryRef updated with latest handleSubmit
  useEffect(() => {
    retryRef.current = handleSubmit;
  }, [handleSubmit]);

  // Report sync state changes to parent
  // Include retryFn when in error state so parent can pass to retry button
  useEffect(() => {
    onSyncStateChange?.({
      isPending,
      isSuccess,
      isError,
      retryFn: isError ? handleSubmit : undefined,
    });
  }, [isPending, isSuccess, isError, onSyncStateChange, handleSubmit]);

  const isDisabled = disabled || isPending || isUndoing || reasoning.trim().length === 0;

  return (
    <button
      type="button"
      data-testid="alternatives-submit-button"
      onClick={handleSubmit}
      disabled={isDisabled}
      className="min-h-[48px] px-4 py-2 rounded-lg bg-warning text-warning-foreground font-medium
        hover:bg-warning/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        flex items-center gap-2"
    >
      {isPending ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>Sending...</span>
        </>
      ) : (
        'Submit'
      )}
    </button>
  );
}
