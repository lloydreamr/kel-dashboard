/**
 * MarkIncorporatedButton Component
 *
 * Button for Maho to mark that she has incorporated Kel's constraint feedback.
 * Only visible to Maho and only when the decision is not yet incorporated.
 *
 * Accessibility:
 * - 48px touch target for tablet use
 * - Disabled state with visual indication
 * - Loading state with "Marking..." text
 *
 * Story 4-9: Mark Constraint as Incorporated
 */

'use client';

import { Button } from '@/components/ui/button';
import { useMarkIncorporated } from '@/hooks/decisions/useMarkIncorporated';

export interface MarkIncorporatedButtonProps {
  /** Decision ID to mark as incorporated */
  decisionId: string;
  /** Question ID for query invalidation */
  questionId: string;
}

/**
 * MarkIncorporatedButton - Triggers the mark incorporated mutation.
 *
 * Uses success color scheme to indicate positive action.
 * Button is disabled during pending state to prevent double-clicks.
 */
export function MarkIncorporatedButton({
  decisionId,
  questionId,
}: MarkIncorporatedButtonProps) {
  const { markIncorporated, isPending } = useMarkIncorporated();

  const handleClick = () => {
    markIncorporated({ decisionId, questionId });
  };

  return (
    <Button
      type="button"
      data-testid="mark-incorporated-button"
      onClick={handleClick}
      disabled={isPending}
      variant="secondary"
      className="text-success bg-success/10 hover:bg-success/20"
    >
      {isPending ? 'Marking...' : 'Mark Incorporated'}
    </Button>
  );
}
