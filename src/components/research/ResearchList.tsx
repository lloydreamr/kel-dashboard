'use client';

/**
 * ResearchList Component
 *
 * Displays a list of research doc cards with loading, error, and empty states.
 * Follows CompaniesList pattern but simpler - flat list without grouping.
 */

import { FileText } from 'lucide-react';

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
      <div
        data-testid="research-empty-state"
        role="status"
        aria-label="No research documents found"
        className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
      >
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">
          No research documents found in this category.
        </p>
      </div>
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
