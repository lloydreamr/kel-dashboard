/**
 * MarkCurrentButton Component
 *
 * Button to mark question data as "current" without changing content.
 * This clears stale data warnings by refreshing the updated_at timestamp.
 * Only renders when the question data is stale (>14 days old).
 */

'use client';

import { CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useMarkQuestionCurrent } from '@/hooks/questions/useMarkQuestionCurrent';
import { isStale } from '@/lib/utils/staleness';

interface MarkCurrentButtonProps {
  /** The question ID to mark as current */
  questionId: string;
  /** The updated_at timestamp to check for staleness */
  updatedAt: string | null | undefined;
}

/**
 * Button for marking question data as current without content changes.
 *
 * Features:
 * - Conditional rendering: Only shows when data is stale
 * - Loading state with spinner while mutation is pending
 * - Disabled during mutation to prevent double-clicks
 * - 48px touch target (handled by Button base styles)
 */
export function MarkCurrentButton({ questionId, updatedAt }: MarkCurrentButtonProps) {
  const { mutate: markCurrent, isPending } = useMarkQuestionCurrent();

  // Only render if data is stale
  if (!isStale(updatedAt)) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="min-h-[48px] gap-2"
      data-testid="mark-current-button"
      disabled={isPending}
      onClick={() => markCurrent(questionId)}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      <span>Mark as Current</span>
    </Button>
  );
}
