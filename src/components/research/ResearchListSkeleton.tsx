/**
 * ResearchListSkeleton Component
 *
 * Loading skeleton for research docs list.
 * Shows 6 skeleton cards with shimmer animation.
 */

function ResearchCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
        <div className="h-5 w-20 rounded-full bg-muted shrink-0" />
      </div>
    </div>
  );
}

export function ResearchListSkeleton() {
  return (
    <div
      data-testid="research-list-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading research documents"
      className="space-y-3"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ResearchCardSkeleton key={i} />
      ))}
    </div>
  );
}
