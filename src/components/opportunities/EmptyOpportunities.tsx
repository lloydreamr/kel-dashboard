/**
 * EmptyOpportunities Component
 *
 * Empty state shown when no opportunities match filter criteria.
 */

import { Lightbulb } from 'lucide-react';

interface EmptyOpportunitiesProps {
  message?: string;
}

export function EmptyOpportunities({ message }: EmptyOpportunitiesProps) {
  return (
    <div
      data-testid="opportunities-empty-state"
      role="status"
      aria-label="No opportunities found"
      className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
    >
      <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-muted-foreground">
        {message || 'No opportunities found matching your criteria.'}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try adjusting your filters or check back later for new AI-generated insights.
      </p>
    </div>
  );
}
