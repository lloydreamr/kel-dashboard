'use client';

/**
 * RecommendationDisplay Component
 *
 * Displays an existing recommendation with rationale and edit button.
 * Supports pending state for optimistic UI (opacity reduction).
 */

interface RecommendationDisplayProps {
  /** The recommendation text */
  recommendation: string;
  /** Optional rationale explaining the recommendation */
  rationale?: string | null;
  /** Callback when edit button is clicked */
  onEdit: () => void;
  /** Show at reduced opacity during optimistic update */
  isPending?: boolean;
}

export function RecommendationDisplay({
  recommendation,
  rationale,
  onEdit,
  isPending = false,
}: RecommendationDisplayProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-4 ${
        isPending ? 'opacity-50' : ''
      }`}
      data-testid="recommendation-display"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recommendation
          </h3>
          <p className="text-foreground">{recommendation}</p>
          {rationale && (
            <div data-testid="question-rationale">
              <h4 className="text-sm font-medium text-muted-foreground mt-3">
                Rationale
              </h4>
              <p className="text-foreground text-sm">{rationale}</p>
            </div>
          )}
        </div>
        <button
          onClick={onEdit}
          data-testid="edit-recommendation-button"
          className="rounded-md border border-border px-3 py-2 min-h-[48px] text-sm font-medium text-foreground hover:bg-muted"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
