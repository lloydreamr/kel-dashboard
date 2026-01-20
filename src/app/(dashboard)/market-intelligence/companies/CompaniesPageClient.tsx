'use client';

/**
 * CompaniesPageClient Component
 *
 * Client component for the companies browse page.
 * Handles search, category filtering, and displays company list.
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import {
  CategoryFilterChips,
  CompaniesList,
  CompaniesSearch,
} from '@/components/companies';
import { useFilteredCompanies } from '@/hooks/companies';
import { type CategoryFilterKey } from '@/types';

const CATEGORY_KEYS: CategoryFilterKey[] = ['all', 'local_major', 'multinational', 'importer', 'niche'];

export function CompaniesPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Parse and validate category filter from URL
  const rawCategory = searchParams.get('category');
  const categoryFilter: CategoryFilterKey =
    rawCategory && CATEGORY_KEYS.includes(rawCategory as CategoryFilterKey)
      ? (rawCategory as CategoryFilterKey)
      : 'all';

  // Get filtered companies with counts
  const { companies, counts, isLoading, error, refetch } = useFilteredCompanies(
    categoryFilter,
    searchQuery
  );

  // Update URL without page reload
  const handleCategoryChange = useCallback(
    (category: CategoryFilterKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category === 'all') {
        params.delete('category');
      } else {
        params.set('category', category);
      }
      const newUrl = params.toString()
        ? `/market-intelligence/companies?${params.toString()}`
        : '/market-intelligence/companies';
      router.push(newUrl, { scroll: false });
    },
    [searchParams, router]
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div data-testid="companies-page" className="container py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Browse company profiles from the knowledge base
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <CompaniesSearch value={searchQuery} onChange={handleSearchChange} />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <CategoryFilterChips
            value={categoryFilter}
            counts={counts}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Companies List */}
        <CompaniesList
          companies={companies}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </div>
  );
}
