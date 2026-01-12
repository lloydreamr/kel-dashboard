'use client';

/**
 * ResearchPageClient Component
 *
 * Client component for the research docs browse page.
 * Handles search, category filtering via tabs, and displays research list.
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import {
  ResearchCategoryTabs,
  ResearchList,
  ResearchSearch,
} from '@/components/research';
import { useFilteredResearchDocs } from '@/hooks/research';
import { type ResearchCategoryFilterKey } from '@/types';

const CATEGORY_KEYS: ResearchCategoryFilterKey[] = [
  'all',
  'consumers',
  'trends',
  'distribution',
  'regulatory',
  'general',
];

export function ResearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Parse and validate category filter from URL
  const rawCategory = searchParams.get('category');
  const categoryFilter: ResearchCategoryFilterKey =
    rawCategory && CATEGORY_KEYS.includes(rawCategory as ResearchCategoryFilterKey)
      ? (rawCategory as ResearchCategoryFilterKey)
      : 'all';

  // Get filtered research docs with counts
  const { docs, categoryCounts, isLoading, error, refetch } = useFilteredResearchDocs(
    categoryFilter,
    searchQuery
  );

  // Update URL without page reload
  const handleCategoryChange = useCallback(
    (category: ResearchCategoryFilterKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category === 'all') {
        params.delete('category');
      } else {
        params.set('category', category);
      }
      const newUrl = params.toString()
        ? `/market-intelligence/research?${params.toString()}`
        : '/market-intelligence/research';
      router.push(newUrl, { scroll: false });
    },
    [searchParams, router]
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div data-testid="research-page" className="container py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Research</h1>
          <p className="text-muted-foreground mt-1">
            Browse research documents from the knowledge base
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <ResearchSearch value={searchQuery} onChange={handleSearchChange} />
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <ResearchCategoryTabs
            value={categoryFilter}
            counts={categoryCounts}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Research List */}
        <ResearchList
          docs={docs}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </div>
  );
}
