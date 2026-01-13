'use client';

/**
 * OpportunitiesList Component
 *
 * Displays a grid of opportunity cards with loading, error, and empty states.
 * Uses CSS grid for responsive layout.
 */

import { ErrorState } from '@/components/ui/error-state';
import type { Opportunity } from '@/lib/repositories/opportunities';

import { EmptyOpportunities } from './EmptyOpportunities';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityCardSkeleton } from './OpportunityCardSkeleton';

interface OpportunitiesListProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

export function OpportunitiesList({
  opportunities,
  isLoading,
  error,
  onRetry,
}: OpportunitiesListProps) {
  if (isLoading) {
    return (
      <div
        data-testid="opportunities-list-skeleton"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <OpportunityCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load opportunities" onRetry={onRetry} />;
  }

  if (opportunities.length === 0) {
    return <EmptyOpportunities />;
  }

  return (
    <div
      data-testid="opportunities-list"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {opportunities.map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
}
