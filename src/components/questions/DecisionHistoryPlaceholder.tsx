interface DecisionHistoryPlaceholderProps {
  questionId: string;
}

/**
 * Placeholder for decision history section.
 * Will be replaced with real DecisionHistory component in Epic 4.
 */
export function DecisionHistoryPlaceholder({
  questionId,
}: DecisionHistoryPlaceholderProps) {
  // Suppress unused variable warning - will be used in Epic 4
  void questionId;

  return (
    <div
      data-testid="decision-history-placeholder"
      className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center"
    >
      <p className="text-sm text-muted-foreground">
        Decision history will appear here
      </p>
    </div>
  );
}
