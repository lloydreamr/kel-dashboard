'use client';

/**
 * CompaniesList Component
 *
 * Displays a list of company cards with loading, error, and empty states.
 * Follows QuestionsList pattern but simpler - flat list without grouping.
 */

import { Building2 } from 'lucide-react';

import { EmptyState } from '@/components/empty-states';
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
      <EmptyState
        icon={Building2}
        message="No companies found matching your criteria."
        testId="companies-empty-state"
      />
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
