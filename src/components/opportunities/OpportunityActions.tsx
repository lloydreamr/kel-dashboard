'use client';

/**
 * OpportunityActions Component
 *
 * Action buttons for opportunity detail page.
 * Includes "Mark as Actionable" button to update status.
 */

import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUpdateOpportunityStatus } from '@/hooks/opportunities';

import type { Opportunity } from '@/lib/repositories/opportunities';

type OpportunityActionsProps = {
  /** The opportunity to act on */
  opportunity: Opportunity;
};

export function OpportunityActions({ opportunity }: OpportunityActionsProps) {
  const { mutate, isPending } = useUpdateOpportunityStatus();

  const isAlreadyActionable = opportunity.status === 'actionable';

  const handleMarkActionable = () => {
    mutate({
      id: opportunity.id,
      status: 'actionable',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      <Button
        onClick={handleMarkActionable}
        disabled={isAlreadyActionable || isPending}
        className="min-h-[48px]"
        data-testid="mark-actionable-button"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : isAlreadyActionable ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Already Actionable
          </>
        ) : (
          'Mark as Actionable'
        )}
      </Button>
    </div>
  );
}
