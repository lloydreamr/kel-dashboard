interface EvidenceEmptyStateProps {
  /** User role determines the message */
  role: 'maho' | 'kel';
}

/**
 * Empty state for evidence list.
 * Shows different messages for Maho (actionable) vs Kel (informational).
 */
export function EvidenceEmptyState({ role }: EvidenceEmptyStateProps) {
  const message =
    role === 'maho'
      ? 'No evidence attached. Add sources to support your recommendation.'
      : 'No supporting evidence provided.';

  return (
    <div
      data-testid="evidence-empty-state"
      className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
