/**
 * Loading skeleton for evidence list.
 * Shows 3 placeholder items to indicate loading state.
 */
export function EvidenceListSkeleton() {
  return (
    <div
      data-testid="evidence-list-skeleton"
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading evidence"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
        >
          {/* Number skeleton */}
          <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
          {/* Favicon skeleton */}
          <div className="h-4 w-4 mt-0.5 animate-pulse rounded bg-muted" />
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
