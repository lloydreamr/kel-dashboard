'use client';

/**
 * OpportunitiesPageClient Component
 *
 * Client component for the opportunities dashboard page.
 * Handles category and status filtering with URL param persistence.
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import {
  CategoryFilterChips,
  StatusFilterChips,
  OpportunitiesList,
} from '@/components/opportunities';
import { useFilteredOpportunities } from '@/hooks/opportunities';
import {
  type OpportunityCategoryFilterKey,
  type OpportunityStatusFilterKey,
} from '@/types';

const CATEGORY_KEYS: OpportunityCategoryFilterKey[] = [
  'all',
  'market_gap',
  'product_opportunity',
  'competitive_weakness',
  'trend_alignment',
];

const STATUS_KEYS: OpportunityStatusFilterKey[] = [
  'all',
  'new',
  'reviewing',
  'actionable',
  'dismissed',
];

export function OpportunitiesPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse and validate category filter from URL
  const rawCategory = searchParams.get('category');
  const categoryFilter: OpportunityCategoryFilterKey =
    rawCategory && CATEGORY_KEYS.includes(rawCategory as OpportunityCategoryFilterKey)
      ? (rawCategory as OpportunityCategoryFilterKey)
      : 'all';

  // Parse and validate status filter from URL
  const rawStatus = searchParams.get('status');
  const statusFilter: OpportunityStatusFilterKey =
    rawStatus && STATUS_KEYS.includes(rawStatus as OpportunityStatusFilterKey)
      ? (rawStatus as OpportunityStatusFilterKey)
      : 'all';

  // Get filtered opportunities with counts
  const { opportunities, counts, isLoading, error, refetch } =
    useFilteredOpportunities(categoryFilter, statusFilter);

  // Update URL without page reload
  const updateUrlParams = useCallback(
    (category: OpportunityCategoryFilterKey, status: OpportunityStatusFilterKey) => {
      const params = new URLSearchParams();

      if (category !== 'all') {
        params.set('category', category);
      }
      if (status !== 'all') {
        params.set('status', status);
      }

      const newUrl = params.toString()
        ? `/market-intelligence/opportunities?${params.toString()}`
        : '/market-intelligence/opportunities';
      router.push(newUrl, { scroll: false });
    },
    [router]
  );

  const handleCategoryChange = useCallback(
    (category: OpportunityCategoryFilterKey) => {
      updateUrlParams(category, statusFilter);
    },
    [statusFilter, updateUrlParams]
  );

  const handleStatusChange = useCallback(
    (status: OpportunityStatusFilterKey) => {
      updateUrlParams(categoryFilter, status);
    },
    [categoryFilter, updateUrlParams]
  );

  return (
    <div data-testid="opportunities-page" className="container py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Opportunities</h1>
          <p className="mt-1 text-muted-foreground">
            AI-generated market opportunities and insights
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilterChips
            value={categoryFilter}
            counts={counts}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <StatusFilterChips
            value={statusFilter}
            counts={counts}
            onChange={handleStatusChange}
          />
        </div>

        {/* Opportunities List */}
        <OpportunitiesList
          opportunities={opportunities}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </div>
  );
}
