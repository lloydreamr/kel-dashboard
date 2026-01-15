'use client';

/**
 * EmptyOpportunities Component
 *
 * Empty state shown when no opportunities exist or match filter criteria.
 * Shows different content based on whether opportunities need to be generated
 * or if filters are hiding results.
 */

import { Lightbulb, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useGenerateOpportunities } from '@/hooks/opportunities';

interface EmptyOpportunitiesProps {
  /** Total opportunities in database (before filtering) */
  totalCount?: number;
  /** Custom message override */
  message?: string;
}

export function EmptyOpportunities({ totalCount = 0, message }: EmptyOpportunitiesProps) {
  const { mutate, isPending, isCooldown, cooldownSeconds } = useGenerateOpportunities();

  // No opportunities exist at all - prompt user to generate
  if (totalCount === 0) {
    return (
      <div
        data-testid="opportunities-empty-state"
        role="status"
        aria-label="No opportunities generated"
        className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
      >
        <Sparkles className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 text-lg font-medium text-foreground">
          No Opportunities Yet
        </h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Generate AI-powered market opportunities based on your knowledge base.
          The AI will analyze companies, products, consumers, and trends to identify gaps and opportunities.
        </p>
        <Button
          onClick={() => mutate()}
          disabled={isPending || isCooldown}
          className="mt-4"
          size="lg"
          data-testid="generate-opportunities-cta"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Opportunities...
            </>
          ) : isCooldown ? (
            <>Wait {cooldownSeconds}s</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Opportunities
            </>
          )}
        </Button>
      </div>
    );
  }

  // Opportunities exist but filters hide them
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
        Try adjusting your filters to see more results.
      </p>
    </div>
  );
}
