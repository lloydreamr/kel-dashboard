'use client';

import { Button } from '@/components/ui/button';
import { STATUS_FILTER_CONFIG, StatusFilterKey } from '@/types/question';

interface FilterEmptyStateProps {
  /** Current filter that has no results */
  filter: StatusFilterKey;
  /** Total count of all questions (unfiltered) */
  totalCount: number;
  /** Callback to clear filter and show all questions */
  onShowAll?: () => void;
}

/**
 * Empty state shown when a filter returns no results.
 * Displays contextual message based on the selected filter
 * with option to view all questions.
 */
export function FilterEmptyState({ filter, totalCount, onShowAll }: FilterEmptyStateProps) {
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
      </p>
      {totalCount > 0 && onShowAll && (
        <Button
          variant="link"
          onClick={onShowAll}
          data-testid="show-all-button"
          className="mt-2 text-primary"
        >
          Show all {totalCount} question{totalCount !== 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
}
