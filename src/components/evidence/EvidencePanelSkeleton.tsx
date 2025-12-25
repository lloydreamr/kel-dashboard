/**
 * Loading skeleton for evidence panel content.
 * Displayed while evidence details are loading.
 * Matches the EvidencePanel layout structure.
 */
export function EvidencePanelSkeleton() {
  return (
    <div
      data-testid="evidence-panel-skeleton"
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading evidence details"
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
        </div>
      </div>

      {/* URL skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 rounded bg-muted" />
          <div className="h-10 w-16 rounded bg-muted" />
        </div>
      </div>

      {/* Excerpt skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-20 rounded bg-muted" />
      </div>

      {/* Button skeleton */}
      <div className="h-12 w-full rounded bg-muted" />
    </div>
  );
}
