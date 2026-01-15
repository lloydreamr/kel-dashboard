/**
 * GlobalSearchSkeleton Component
 *
 * Loading skeleton for search results.
 * Shows 3 skeleton items with animate-pulse.
 */

export function GlobalSearchSkeleton() {
  return (
    <div
      data-testid="mi-global-search-skeleton"
      className="space-y-2 p-2"
      role="status"
      aria-label="Loading search results"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex min-h-[48px] animate-pulse items-center gap-3 rounded-md px-2"
        >
          {/* Icon placeholder */}
          <div className="h-5 w-5 rounded bg-muted" />
          {/* Text placeholder */}
          <div className="flex-1 space-y-1">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
