/**
 * QuestionCardSkeleton Component
 *
 * Loading placeholder for QuestionCard component.
 * Matches the visual structure of QuestionCard.
 */

export function QuestionCardSkeleton() {
  return (
    <div
      data-testid="question-card-skeleton"
      className="min-h-[48px] rounded-md border border-border bg-surface p-4 animate-pulse"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
      </div>
      <div className="mt-2 h-3 w-24 rounded bg-muted" />
    </div>
  );
}
