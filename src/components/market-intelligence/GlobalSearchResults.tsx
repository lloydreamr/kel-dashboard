'use client';

/**
 * GlobalSearchResults Component
 *
 * Displays search results grouped by entity type.
 * Each result navigates to entity detail page on click.
 */

import { Building2, FileText, Package } from 'lucide-react';
import Link from 'next/link';

import { GlobalSearchSkeleton } from './GlobalSearchSkeleton';

import type { GlobalSearchResults as GlobalSearchResultsType } from '@/lib/repositories';

interface GlobalSearchResultsProps {
  results: GlobalSearchResultsType | null;
  isLoading: boolean;
  query: string;
  onResultClick?: () => void;
}

const ICON_MAP = {
  company: Building2,
  product: Package,
  research: FileText,
} as const;

const LABEL_MAP = {
  company: 'Company',
  product: 'Product',
  research: 'Research',
} as const;

export function GlobalSearchResults({
  results,
  isLoading,
  query,
  onResultClick,
}: GlobalSearchResultsProps) {
  // Show skeleton while loading
  if (isLoading) {
    return <GlobalSearchSkeleton />;
  }

  // No results yet (query too short)
  if (!results) {
    return null;
  }

  // Empty results
  if (results.totalCount === 0) {
    return (
      <div
        data-testid="mi-global-search-empty"
        className="p-4 text-center text-sm text-muted-foreground"
      >
        No results found for &quot;{query}&quot;
      </div>
    );
  }

  return (
    <div data-testid="mi-global-search-results" className="p-2">
      {/* Companies */}
      {results.companies.length > 0 && (
        <ResultGroup
          heading="Companies"
          results={results.companies}
          onResultClick={onResultClick}
        />
      )}

      {/* Products */}
      {results.products.length > 0 && (
        <ResultGroup
          heading="Products"
          results={results.products}
          onResultClick={onResultClick}
        />
      )}

      {/* Research */}
      {results.research.length > 0 && (
        <ResultGroup
          heading="Research"
          results={results.research}
          onResultClick={onResultClick}
        />
      )}
    </div>
  );
}

interface ResultGroupProps {
  heading: string;
  results: GlobalSearchResultsType['companies'];
  onResultClick?: () => void;
}

function ResultGroup({ heading, results, onResultClick }: ResultGroupProps) {
  return (
    <div className="mb-2">
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {heading}
      </div>
      {results.map((result) => {
        const Icon = ICON_MAP[result.type];
        return (
          <Link
            key={result.id}
            href={result.href}
            onClick={onResultClick}
            data-testid={`mi-search-result-${result.type}-${result.id}`}
            className="flex min-h-[48px] items-center gap-3 rounded-md px-2 text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
          >
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <div className="font-medium">{result.name}</div>
              <div className="text-xs text-muted-foreground">
                {LABEL_MAP[result.type]}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
