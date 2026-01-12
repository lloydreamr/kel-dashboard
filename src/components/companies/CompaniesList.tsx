'use client';

/**
 * CompaniesList Component
 *
 * Displays a list of company cards with loading, error, and empty states.
 * Follows QuestionsList pattern but simpler - flat list without grouping.
 */

import { Building2 } from 'lucide-react';

import { ErrorState } from '@/components/ui/error-state';

import { CompaniesListSkeleton } from './CompaniesListSkeleton';
import { CompanyCard } from './CompanyCard';

import type { Company } from '@/types';

interface CompaniesListProps {
  companies: Company[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

export function CompaniesList({
  companies,
  isLoading,
  error,
  onRetry,
}: CompaniesListProps) {
  if (isLoading) {
    return <CompaniesListSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load companies"
        onRetry={onRetry}
      />
    );
  }

  if (companies.length === 0) {
    return (
      <div
        data-testid="companies-empty-state"
        role="status"
        aria-label="No companies found"
        className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
      >
        <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">
          No companies found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="companies-list" className="space-y-3">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
