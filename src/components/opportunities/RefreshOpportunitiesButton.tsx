'use client';

/**
 * RefreshOpportunitiesButton Component
 *
 * Button to manually trigger AI opportunity generation.
 * Shows loading state during generation, cooldown timer after success,
 * and last refreshed timestamp.
 *
 * Uses variant="outline" for secondary action styling - this is not
 * the primary page action (viewing opportunities is), so outline
 * provides appropriate visual hierarchy.
 *
 * Story 16-5: Manual Opportunity Refresh
 */

import { formatDistanceToNow } from 'date-fns';
import { Loader2, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useGenerateOpportunities } from '@/hooks/opportunities';

/**
 * Button to manually trigger AI opportunity generation.
 * Shows loading state during generation, cooldown timer after success,
 * and last refreshed timestamp.
 */
export function RefreshOpportunitiesButton() {
  const { mutate, isPending, isCooldown, cooldownSeconds, lastRefresh } =
    useGenerateOpportunities();

  const isDisabled = isPending || isCooldown;

  // Determine button text based on state
  const getButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      );
    }
    if (isCooldown) {
      return (
        <>
          <RotateCw className="mr-2 h-4 w-4" />
          Wait {cooldownSeconds}s
        </>
      );
    }
    return (
      <>
        <RotateCw className="mr-2 h-4 w-4" />
        Refresh Opportunities
      </>
    );
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={() => mutate()}
        disabled={isDisabled}
        variant="outline"
        className="min-h-[48px]"
        data-testid="refresh-opportunities-button"
      >
        {getButtonContent()}
      </Button>
      {lastRefresh && (
        <span className="text-xs text-muted-foreground">
          Last refreshed: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
        </span>
      )}
    </div>
  );
}
