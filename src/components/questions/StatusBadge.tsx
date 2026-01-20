'use client';

import type { DecisionType } from '@/types/decision';
import type { QuestionStatus } from '@/types/question';

/**
 * Style configuration for each status/display variant.
 * Includes optional icon indicator for constrained approval.
 */
const STATUS_STYLES: Record<
  QuestionStatus | 'approved_with_constraint',
  { bg: string; text: string; label: string; icon?: 'chip' }
> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Draft' },
  ready_for_kel: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    label: 'Sent to Kel',
  },
  approved: {
    bg: 'bg-success',
    text: 'text-success-foreground',
    label: 'Approved',
  },
  approved_with_constraint: {
    bg: 'bg-success',
    text: 'text-success-foreground',
    label: 'Approved',
    icon: 'chip',
  },
  exploring_alternatives: {
    bg: 'bg-warning',
    text: 'text-warning-foreground',
    label: 'Exploring',
  },
  archived: {
    bg: 'bg-muted',
    text: 'text-muted-foreground line-through',
    label: 'Archived',
  },
};

/**
 * Maps status (and decision type) to unique test IDs for E2E testing.
 */
const TEST_ID_MAP: Record<QuestionStatus | 'approved_with_constraint', string> =
  {
    draft: 'status-badge-draft',
    ready_for_kel: 'status-badge-ready',
    approved: 'status-badge-approved',
    approved_with_constraint: 'status-badge-constrained',
    exploring_alternatives: 'status-badge-exploring',
    archived: 'status-badge-archived',
  };

export interface StatusBadgeProps {
  /** Question status from the database */
  status: QuestionStatus;
  /** Optional decision type for enriched display (shows constraint icon) */
  decisionType?: DecisionType;
  /** When true, applies reduced opacity for pending state */
  isPending?: boolean;
}

/**
 * StatusBadge displays the current question status with semantic colors.
 *
 * When `status='approved'` and `decisionType='approved_with_constraint'`,
 * shows a special variant with a constraint chip icon.
 */
export function StatusBadge({
  status,
  decisionType,
  isPending = false,
}: StatusBadgeProps) {
  // Determine display key: use constraint variant when applicable
  const displayKey: QuestionStatus | 'approved_with_constraint' =
    status === 'approved' && decisionType === 'approved_with_constraint'
      ? 'approved_with_constraint'
      : status;

  const styles = STATUS_STYLES[displayKey];
  const testId = TEST_ID_MAP[displayKey];

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${styles.bg} ${styles.text} ${
        isPending ? 'opacity-50' : ''
      }`}
    >
      {styles.icon === 'chip' && <ChipIcon />}
      {styles.label}
    </span>
  );
}

/**
 * Small constraint chip indicator icon.
 * Shown for approved_with_constraint status.
 */
function ChipIcon() {
  return (
    <svg
      data-testid="constraint-chip-icon"
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
