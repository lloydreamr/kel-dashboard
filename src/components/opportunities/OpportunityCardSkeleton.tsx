/**
 * OpportunityCardSkeleton Component
 *
 * Loading skeleton for an opportunity card.
 * Matches the layout of OpportunityCard: badge, title, description, confidence.
 * Height ~180px to match card dimensions.
 */

export function OpportunityCardSkeleton() {
  return (
    <div
      className="p-4 rounded-lg border border-border animate-pulse"
      data-testid="opportunity-card-skeleton"
    >
      {/* Category badge placeholder */}
      <div className="h-5 w-24 rounded bg-muted" />

      {/* Title placeholder */}
      <div className="mt-2 h-5 w-3/4 rounded bg-muted" />

      {/* Description placeholders (2 lines) */}
      <div className="mt-2 space-y-1.5">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>

      {/* Confidence indicator placeholder */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-4 w-10 rounded bg-muted" />
      </div>
    </div>
  );
}
