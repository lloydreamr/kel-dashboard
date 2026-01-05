'use client';

import { STATUS_FILTER_CONFIG, StatusFilterKey } from '@/types/question';

interface FilterEmptyStateProps {
  /** Current filter that has no results */
  filter: StatusFilterKey;
  /** Total count of all questions (unfiltered) */
  totalCount: number;
}

/**
 * Empty state shown when a filter returns no results.
 * Displays contextual message based on the selected filter.
 */
export function FilterEmptyState({ filter, totalCount }: FilterEmptyStateProps) {
  const filterLabel = STATUS_FILTER_CONFIG[filter].label.toLowerCase();

  return (
    <div
      data-testid="filter-empty-state"
      role="status"
      aria-label={`No ${filterLabel} questions`}
      className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
    >
      <p className="text-muted-foreground">
        No {filterLabel} questions.
        {totalCount > 0 && (
          <span className="block mt-1 text-sm">
            Try a different filter to see your {totalCount} question{totalCount !== 1 ? 's' : ''}.
          </span>
        )}
      </p>
    </div>
  );
}
