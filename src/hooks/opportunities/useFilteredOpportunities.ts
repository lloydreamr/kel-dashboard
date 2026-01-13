'use client';

/**
 * useFilteredOpportunities Hook
 *
 * Hook for filtering opportunities by category and status.
 * Performs client-side filtering on the full opportunities list.
 */

import { useMemo } from 'react';

import type { Opportunity } from '@/lib/repositories/opportunities';
import type { OpportunityCategoryFilterKey, OpportunityStatusFilterKey } from '@/types';

import { useOpportunities } from './useOpportunities';

interface OpportunityCounts {
  all: number;
  market_gap: number;
  product_opportunity: number;
  competitive_weakness: number;
  trend_alignment: number;
  // Status counts
  new: number;
  reviewing: number;
  actionable: number;
  dismissed: number;
}

interface FilteredOpportunitiesResult {
  opportunities: Opportunity[];
  counts: OpportunityCounts;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for filtering opportunities by category and status.
 * Returns filtered list and counts for each category/status.
 *
 * @param categoryFilter - Category filter key ('all' shows everything)
 * @param statusFilter - Status filter key ('all' shows everything)
 * @returns Filtered opportunities, counts, loading state, and error
 *
 * @example
 * const { opportunities, counts, isLoading } = useFilteredOpportunities('market_gap', 'new');
 */
export function useFilteredOpportunities(
  categoryFilter: OpportunityCategoryFilterKey = 'all',
  statusFilter: OpportunityStatusFilterKey = 'all'
): FilteredOpportunitiesResult {
  const { data: allOpportunities, isLoading, error, refetch } = useOpportunities();

  const filtered = useMemo(() => {
    if (!allOpportunities) return [];

    let result = allOpportunities;

    if (categoryFilter !== 'all') {
      result = result.filter((o) => o.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    return result;
  }, [allOpportunities, categoryFilter, statusFilter]);

  // useMemo prevents recalculation on every render
  const counts = useMemo((): OpportunityCounts => {
    if (!allOpportunities) {
      return {
        all: 0,
        market_gap: 0,
        product_opportunity: 0,
        competitive_weakness: 0,
        trend_alignment: 0,
        new: 0,
        reviewing: 0,
        actionable: 0,
        dismissed: 0,
      };
    }

    return {
      all: allOpportunities.length,
      // Category counts
      market_gap: allOpportunities.filter((o) => o.category === 'market_gap').length,
      product_opportunity: allOpportunities.filter((o) => o.category === 'product_opportunity').length,
      competitive_weakness: allOpportunities.filter((o) => o.category === 'competitive_weakness').length,
      trend_alignment: allOpportunities.filter((o) => o.category === 'trend_alignment').length,
      // Status counts
      new: allOpportunities.filter((o) => o.status === 'new').length,
      reviewing: allOpportunities.filter((o) => o.status === 'reviewing').length,
      actionable: allOpportunities.filter((o) => o.status === 'actionable').length,
      dismissed: allOpportunities.filter((o) => o.status === 'dismissed').length,
    };
  }, [allOpportunities]);

  return {
    opportunities: filtered,
    counts,
    isLoading,
    error: error ?? null,
    refetch,
  };
}
