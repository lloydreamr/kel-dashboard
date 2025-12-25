'use client';

/**
 * QueueView Component
 *
 * Main queue view for Kel showing pending decisions.
 * Combines headline, list, and handles all states.
 */

import { usePendingQuestions } from '@/hooks/questions/usePendingQuestions';

import { QueueCountHeadline } from './QueueCountHeadline';
import { QueueList } from './QueueList';

export function QueueView() {
  const { data: questions, isLoading, error } = usePendingQuestions();

  const pendingCount = questions?.length ?? 0;

  return (
    <main data-testid="queue-page" className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        {/* Header with count */}
        <div className="mb-6">
          {!isLoading && !error && <QueueCountHeadline count={pendingCount} />}
          {isLoading && (
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Failed to load queue</p>
          </div>
        )}

        {/* Queue list */}
        {!error && <QueueList questions={questions} isLoading={isLoading} />}
      </div>
    </main>
  );
}
