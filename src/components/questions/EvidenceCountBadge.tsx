interface EvidenceCountBadgeProps {
  count: number;
}

/**
 * Displays count of evidence items attached to a question.
 * For Story 2.6, this is a placeholder showing 0.
 * Will be connected to real data in Epic 3.
 */
export function EvidenceCountBadge({ count }: EvidenceCountBadgeProps) {
  return (
    <span
      data-testid="evidence-count-badge"
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
    >
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {count} evidence
    </span>
  );
}
