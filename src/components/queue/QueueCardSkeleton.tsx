/**
 * QueueCardSkeleton Component
 *
 * Loading skeleton for queue cards.
 * Matches the visual structure of QueueCard.
 */

export function QueueCardSkeleton() {
  return (
    <div
      data-testid="queue-card-skeleton"
      className="rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title skeleton */}
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          {/* Description skeleton */}
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        {/* Category badge skeleton */}
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton group - shows 3 placeholder cards
 */
export function QueueLoadingSkeleton() {
  return (
    <div data-testid="queue-loading-skeleton" className="space-y-3">
      <QueueCardSkeleton />
      <QueueCardSkeleton />
      <QueueCardSkeleton />
    </div>
  );
}
