/**
 * DetailPageSkeleton Component
 *
 * Loading skeleton for entity detail pages.
 * Shows placeholder content with shimmer animation.
 */

export function DetailPageSkeleton() {
  return (
    <div
      data-testid="detail-page-skeleton"
      className="animate-pulse space-y-8 max-w-4xl"
    >
      {/* Back button skeleton */}
      <div className="h-12 w-40 rounded-md bg-muted" />

      {/* Title and badge skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-6 w-20 rounded-full bg-muted" />
        </div>
      </div>

      {/* Main content sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <div className="space-y-2">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <div className="h-6 w-24 rounded bg-muted" />
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        </div>

        {/* Section 3 - Related entities */}
        <div className="space-y-2">
          <div className="h-6 w-28 rounded bg-muted" />
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex gap-2">
              <div className="h-8 w-24 rounded-full bg-muted" />
              <div className="h-8 w-32 rounded-full bg-muted" />
              <div className="h-8 w-20 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
