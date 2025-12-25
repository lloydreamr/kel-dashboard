'use client';

/**
 * ConstraintEditButton Component
 *
 * Save Changes button for editing constraints on an existing decision:
 * - Medium haptic feedback (40ms) on click
 * - Loading state during mutation
 * - Uses useUpdateConstraints hook for optimistic updates
 *
 * Story 4-7: View and Edit Constraints (Kel)
 */

import { useUpdateConstraints } from '@/hooks/decisions/useUpdateConstraints';
import { useHaptic } from '@/hooks/ui';

import type { Constraint } from '@/types/decision';

interface ConstraintEditButtonProps {
  /** Decision ID to update */
  decisionId: string;
  /** Question ID for cache invalidation */
  questionId: string;
  /** Updated constraints array */
  constraints: Constraint[];
  /** Optional context text */
  context?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback when update succeeds */
  onSuccess?: () => void;
  /** Callback when update fails */
  onError?: (error: Error) => void;
}

/**
 * Save Changes button for editing constraints.
 * Triggers medium haptic feedback and uses optimistic updates.
 */
export function ConstraintEditButton({
  decisionId,
  questionId,
  constraints,
  context,
  disabled = false,
  onSuccess,
  onError,
}: ConstraintEditButtonProps) {
  const { trigger: triggerHaptic } = useHaptic();
  const { updateConstraintsAsync, isPending } = useUpdateConstraints();

  const handleSave = async () => {
    // Trigger medium haptic feedback
    triggerHaptic('medium');

    try {
      await updateConstraintsAsync({
        decisionId,
        questionId,
        constraints,
        context,
      });

      // Notify parent of successful completion
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      // Toast is handled by useUpdateConstraints hook
      onError?.(err);
    }
  };

  const isDisabled = disabled || isPending;

  return (
    <button
      type="button"
      data-testid="constraint-edit-button"
      onClick={handleSave}
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
        'Save Changes'
      )}
    </button>
  );
}
