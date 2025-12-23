'use client';

import type { QuestionStatus } from '@/types/question';

const STATUS_STYLES: Record<
  QuestionStatus,
  { bg: string; text: string; label: string }
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

interface StatusBadgeProps {
  status: QuestionStatus;
  isPending?: boolean;
}

export function StatusBadge({ status, isPending = false }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      data-testid="question-status"
      className={`rounded-full px-2 py-1 text-xs font-medium ${styles.bg} ${styles.text} ${
        isPending ? 'opacity-50' : ''
      }`}
    >
      {styles.label}
    </span>
  );
}
