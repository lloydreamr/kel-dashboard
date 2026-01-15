'use client';

/**
 * CompanyDetailClient Component
 *
 * Client component for company detail page.
 * Fetches company data and renders the detail view.
 */

import Markdown from 'react-markdown';
import { Suspense } from 'react';

import { Badge } from '@/components/ui/badge';

import {
  DetailPageHeader,
  DetailPageSkeleton,
  DetailSection,
  EntityNotFound,
  RelatedEntitiesSection,
  SourceFileLink,
} from '@/components/shared';
import { useCompany } from '@/hooks/companies';
import { CATEGORY_LABELS } from '@/types';

import type { CategoryFilterKey } from '@/types';

type CompanyDetailClientProps = {
  id: string;
};

/**
 * Get badge variant based on category
 */
function getCategoryVariant(
  category: string | null
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (category) {
    case 'local_major':
      return 'default';
    case 'multinational':
      return 'secondary';
    case 'importer':
      return 'outline';
    case 'niche':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Format market share as percentage
 */
function formatMarketShare(share: number | null): string {
  if (share === null) return 'N/A';
  return `${share.toFixed(1)}%`;
}

export function CompanyDetailClient({ id }: CompanyDetailClientProps) {
  const { data: company, isLoading, error } = useCompany(id);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !company) {
    return (
      <EntityNotFound
        entityType="Company"
        backHref="/market-intelligence/companies"
        backLabel="Browse Companies"
      />
    );
  }

  const categoryLabel =
    company.category && company.category in CATEGORY_LABELS
      ? CATEGORY_LABELS[company.category as CategoryFilterKey]
      : company.category ?? 'Unknown';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with back button and title */}
      <DetailPageHeader
        title={company.name}
        backHref="/market-intelligence/companies"
        backLabel="Companies"
        badge={company.category ? categoryLabel : null}
        badgeVariant={getCategoryVariant(company.category)}
      />

      {/* Market Position - only show if we have data */}
      {(company.market_share != null || company.revenue_estimate) && (
        <DetailSection title="Market Position" defaultExpanded>
          <div className="grid gap-4 sm:grid-cols-2">
            {company.market_share != null && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Market Share
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {formatMarketShare(company.market_share)}
                </dd>
              </div>
            )}
            {company.revenue_estimate && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Revenue Estimate
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {company.revenue_estimate}
                </dd>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {/* Products */}
      {company.products && company.products.length > 0 && (
        <DetailSection title="Products">
          <div className="flex flex-wrap gap-2">
            {company.products.map((product) => (
              <Badge key={product} variant="secondary">
                {product}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Distribution Reach */}
      {company.distribution_reach && (
        <DetailSection title="Distribution Reach">
          <p className="text-sm text-foreground">{company.distribution_reach}</p>
        </DetailSection>
      )}

      {/* Strengths */}
      {company.strengths && company.strengths.length > 0 && (
        <DetailSection title="Strengths">
          <ul className="space-y-2">
            {company.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {/* Weaknesses */}
      {company.weaknesses && company.weaknesses.length > 0 && (
        <DetailSection title="Weaknesses">
          <ul className="space-y-2">
            {company.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {/* Full Profile Content (Markdown) */}
      {company.raw_content && (
        <DetailSection title="Full Profile">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{company.raw_content}</Markdown>
          </div>
        </DetailSection>
      )}

      {/* Related Entities */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
        <RelatedEntitiesSection entityType="company" entityId={id} />
      </Suspense>

      {/* Source File */}
      {company.source_file && (
        <SourceFileLink sourceFile={company.source_file} className="pt-4" />
      )}
    </div>
  );
}
