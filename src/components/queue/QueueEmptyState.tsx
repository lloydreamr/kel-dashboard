/**
 * QueueEmptyState Component
 *
 * Displayed when Kel has no pending decisions.
 * Uses relaxed, positive language (anti-guilt pattern).
 */

export function QueueEmptyState() {
  return (
    <div
      data-testid="queue-empty-state"
      className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-12 text-center"
    >
      {/* Relaxed illustration - simple checkmark circle */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <span className="text-3xl">✓</span>
      </div>

      <h2 className="text-lg font-medium text-foreground">All caught up!</h2>

      <p className="mt-2 text-muted-foreground">No decisions waiting.</p>
    </div>
  );
}
