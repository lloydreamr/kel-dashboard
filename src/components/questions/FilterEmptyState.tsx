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
  /** Optional search query that returned no results */
  searchQuery?: string;
}

/**
 * Empty state shown when a filter or search returns no results.
 * Displays contextual message based on the selected filter and search query
 * with option to view all questions.
 */
export function FilterEmptyState({
  filter,
  totalCount,
  onShowAll,
  searchQuery,
}: FilterEmptyStateProps) {
  const filterLabel = STATUS_FILTER_CONFIG[filter].label.toLowerCase();
  const hasSearch = searchQuery && searchQuery.trim() !== '';

  // Build the empty state message
  let message: string;
  if (hasSearch && filter !== 'all') {
    message = `No ${filterLabel} questions matching "${searchQuery}".`;
  } else if (hasSearch) {
    message = `No questions matching "${searchQuery}".`;
  } else {
    message = `No ${filterLabel} questions.`;
  }

  return (
    <div
      data-testid="filter-empty-state"
      role="status"
      aria-label={hasSearch ? `No questions matching ${searchQuery}` : `No ${filterLabel} questions`}
      className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
    >
      <p className="text-muted-foreground">{message}</p>
      {totalCount > 0 && onShowAll && (
        <Button
          variant="link"
          onClick={onShowAll}
          data-testid="show-all-button"
          className="mt-2 text-primary"
        >
          {hasSearch ? 'Clear search and filters' : `Show all ${totalCount} question${totalCount !== 1 ? 's' : ''}`}
        </Button>
      )}
    </div>
  );
}
