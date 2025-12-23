'use client';

import { Archive } from 'lucide-react';

import { useArchivedQuestions, useRestoreQuestion } from '@/hooks/questions';
import { formatRelativeTime } from '@/lib/utils/date';

import { RestoreButton } from './RestoreButton';

/**
 * ArchivedQuestionsList
 *
 * Displays archived questions in a flat list with restore functionality.
 * Unlike QuestionsList, this doesn't group by category since archived
 * questions are typically viewed chronologically for housekeeping.
 */
export function ArchivedQuestionsList() {
  const { data: questions, isLoading, error } = useArchivedQuestions();
  const { mutate: restoreQuestion, isPending } = useRestoreQuestion();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-surface p-4 animate-pulse"
          >
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="mt-2 h-4 w-1/4 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load archived questions</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div
        data-testid="archived-questions-empty"
        className="rounded-lg border border-border bg-surface p-8 text-center"
      >
        <Archive className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No archived questions</p>
      </div>
    );
  }

  return (
    <div data-testid="archived-questions-list" className="space-y-3">
      {questions.map((question) => (
        <div
          key={question.id}
          className="rounded-md border border-border bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground line-clamp-2">
                {question.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Archived {formatRelativeTime(question.updated_at)}
              </p>
            </div>
            <RestoreButton
              onRestore={() => restoreQuestion(question.id)}
              isPending={isPending}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
