'use client';

/**
 * DecisionSection Component
 *
 * Displays the decision status for a question, including:
 * - Constraints (for approved_with_constraint decisions)
 * - Edit capability (if not incorporated and user is Kel)
 * - Incorporated badge (when Maho has addressed constraints)
 * - Mark Incorporated button (for Maho when not yet incorporated)
 * - Reasoning (for explore_alternatives decisions)
 *
 * Story 4-7: View and Edit Constraints (Kel)
 * Story 4-9: Mark Constraint as Incorporated (Maho)
 */

import { useState } from 'react';

import { ConstraintPanel } from '@/components/queue/ConstraintPanel';
import { useProfile } from '@/hooks/auth';
import { useDecision } from '@/hooks/decisions';

import { ConstraintDisplay } from './ConstraintDisplay';
import { DecisionTimestamp } from './DecisionTimestamp';
import { IncorporatedBadge } from './IncorporatedBadge';
import { MarkIncorporatedButton } from './MarkIncorporatedButton';

import type { Constraint, DecisionType } from '@/types/decision';
import type { QuestionStatus } from '@/types/question';

export interface DecisionSectionProps {
  /** Question ID to fetch decision for */
  questionId: string;
  /** Current question status */
  questionStatus: QuestionStatus;
}

/**
 * Skeleton loader for DecisionSection.
 */
function DecisionSectionSkeleton() {
  return (
    <div
      data-testid="decision-section-skeleton"
      className="rounded-lg border border-border p-4 animate-pulse"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-5 w-20 bg-muted rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-16 bg-muted rounded-full" />
        <div className="h-7 w-20 bg-muted rounded-full" />
      </div>
    </div>
  );
}

/**
 * DecisionSection - Displays and allows editing of Kel's decision.
 *
 * Handles three states:
 * 1. Loading: Shows skeleton
 * 2. No decision: Shows "Waiting for decision" if status is ready_for_kel
 * 3. Has decision: Shows constraints or reasoning based on type
 */
export function DecisionSection({
  questionId,
  questionStatus,
}: DecisionSectionProps) {
  const { data: decision, isLoading } = useDecision(questionId);
  const { data: profile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  const isKel = profile?.role === 'kel';
  const isMaho = profile?.role === 'maho';
  const isIncorporated = !!decision?.incorporated_at;
  const canEdit = isKel && !isIncorporated;
  const canMarkIncorporated = isMaho && !isIncorporated;

  // Loading state
  if (isLoading) {
    return <DecisionSectionSkeleton />;
  }

  // No decision yet
  if (!decision) {
    if (questionStatus === 'ready_for_kel') {
      return (
        <div
          data-testid="decision-section"
          className="rounded-lg border border-border border-dashed p-4"
        >
          <p
            data-testid="decision-status-waiting"
            className="text-sm text-muted-foreground"
          >
            Waiting for Kel&apos;s decision
          </p>
        </div>
      );
    }
    // Draft status or other - no decision expected, return nothing
    return null;
  }

  // Approved with constraints
  if (decision.decision_type === 'approved_with_constraint') {
    return (
      <div
        data-testid="decision-section"
        className="rounded-lg border border-border p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">Kel&apos;s Decision</h3>
            <DecisionTimestamp createdAt={decision.created_at} />
          </div>
          {isIncorporated && (
            <IncorporatedBadge incorporatedAt={decision.incorporated_at!} />
          )}
        </div>

        <ConstraintDisplay
          constraints={(decision.constraints as unknown as Constraint[]) ?? []}
          context={decision.constraint_context ?? undefined}
        />

        {/* Kel can edit if not incorporated */}
        {canEdit && (
          <button
            type="button"
            data-testid="edit-constraints-button"
            onClick={() => setIsEditing(true)}
            className="mt-4 min-h-[48px] px-3 py-2 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            Edit Constraints
          </button>
        )}

        {/* Maho can mark incorporated if not already */}
        {canMarkIncorporated && (
          <div className="mt-4">
            <MarkIncorporatedButton
              decisionId={decision.id}
              questionId={questionId}
            />
          </div>
        )}

        {/* Edit panel - reuses ConstraintPanel in edit mode */}
        <ConstraintPanel
          open={isEditing}
          onOpenChange={setIsEditing}
          questionId={questionId}
          mode="edit"
          decisionId={decision.id}
          initialConstraints={(decision.constraints as unknown as Constraint[]) ?? []}
          initialContext={decision.constraint_context ?? undefined}
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // Explore alternatives
  if (decision.decision_type === 'explore_alternatives') {
    return (
      <div
        data-testid="decision-section"
        className="rounded-lg border border-warning/30 bg-warning/5 p-4"
      >
        <div className="flex flex-col gap-1 mb-3">
          <h3 className="text-sm font-medium text-warning">
            Exploring Alternatives
          </h3>
          <DecisionTimestamp createdAt={decision.created_at} />
        </div>

        {decision.reasoning && (
          <p
            data-testid="decision-reasoning"
            className="text-sm text-muted-foreground"
          >
            {decision.reasoning}
          </p>
        )}
      </div>
    );
  }

  // Approved (no constraints) - simple display
  if (decision.decision_type === ('approved' as DecisionType)) {
    return (
      <div
        data-testid="decision-section"
        className="rounded-lg border border-success/30 bg-success/5 p-4"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-success"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <h3 className="text-sm font-medium text-success">Approved</h3>
          </div>
          <DecisionTimestamp createdAt={decision.created_at} />
        </div>
      </div>
    );
  }

  // Unknown decision type - fallback
  return null;
}
