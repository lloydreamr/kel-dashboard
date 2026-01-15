'use client';

/**
 * ResearchList Component
 *
 * Displays a list of research doc cards with loading, error, and empty states.
 * Follows CompaniesList pattern but simpler - flat list without grouping.
 */

import { FileText } from 'lucide-react';

import { EmptyState } from '@/components/empty-states';
import { ErrorState } from '@/components/ui/error-state';

import { ResearchCard } from './ResearchCard';
import { ResearchListSkeleton } from './ResearchListSkeleton';

import type { ResearchDoc } from '@/types';

interface ResearchListProps {
  docs: ResearchDoc[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

export function ResearchList({
  docs,
  isLoading,
  error,
  onRetry,
}: ResearchListProps) {
  if (isLoading) {
    return <ResearchListSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load research documents"
        onRetry={onRetry}
      />
    );
  }

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        message="No research documents found in this category."
        testId="research-empty-state"
      />
    );
  }

  return (
    <div data-testid="research-list" className="space-y-3">
      {docs.map((doc) => (
        <ResearchCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}
