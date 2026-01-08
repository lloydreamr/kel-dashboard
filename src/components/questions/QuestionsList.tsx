'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { useProfile } from '@/hooks/auth';
import { useQuestions } from '@/hooks/questions/useQuestions';
import { QUESTION_CATEGORIES } from '@/types/question';

import { CategoryEmptyState } from './CategoryEmptyState';
import { CategorySection } from './CategorySection';
import { QuestionCard } from './QuestionCard';
import { QuestionsListSkeleton } from './QuestionsListSkeleton';
import { VirtualizedQuestionsList } from './VirtualizedQuestionsList';

import type { QuestionWithEvidenceCount, QuestionCategory } from '@/types/question';

/** Threshold for enabling virtualization (AC #7: 200+ questions) */
const VIRTUALIZATION_THRESHOLD = 200;

interface QuestionsListProps {
  /** Optional questions to display. If not provided, fetches from useQuestions. */
  questions?: QuestionWithEvidenceCount[];
  /** Optional loading state override. Only used when questions prop is provided. */
  isLoading?: boolean;
  /** Optional error override. Only used when questions prop is provided. */
  error?: Error | null;
  /** Optional refetch callback for error retry. Only used when questions prop is provided. */
  onRetry?: () => void;
  /** Render prop for custom empty state. Used when filtered results are empty. */
  renderEmptyState?: () => React.ReactNode;
  /**
   * View mode for the questions list.
   * - 'grouped': Questions grouped by category with section headers (default, AC #5)
   * - 'flat': Flat list without grouping, for single-category views (AC #4)
   */
  viewMode?: 'grouped' | 'flat';
}

function groupByCategory(questions: QuestionWithEvidenceCount[]): Record<QuestionCategory, QuestionWithEvidenceCount[]> {
  const grouped: Record<QuestionCategory, QuestionWithEvidenceCount[]> = {
    market: [],
    product: [],
    distribution: [],
  };

  for (const question of questions) {
    grouped[question.category].push(question);
  }

  return grouped;
}

export function QuestionsList({
  questions: propQuestions,
  isLoading: propIsLoading,
  error: propError,
  onRetry: propOnRetry,
  renderEmptyState,
  viewMode = 'grouped',
}: QuestionsListProps = {}) {
  const { data: profile } = useProfile();
  const {
    data: fetchedQuestions,
    isLoading: fetchIsLoading,
    error: fetchError,
    refetch,
  } = useQuestions();
  const isMaho = profile?.role === 'maho';

  // Use prop values if provided, otherwise use fetched values
  const questions = propQuestions ?? fetchedQuestions;
  const isLoading = propQuestions !== undefined ? (propIsLoading ?? false) : fetchIsLoading;
  const error = propQuestions !== undefined ? propError : fetchError;
  const handleRetry = propQuestions !== undefined ? propOnRetry : refetch;

  if (isLoading) {
    return <QuestionsListSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load questions"
        onRetry={handleRetry}
      />
    );
  }

  // Custom empty state for filtered results
  if ((!questions || questions.length === 0) && renderEmptyState) {
    return <>{renderEmptyState()}</>;
  }

  // Global empty state - role-specific messaging (AC: #3, #4, #5)
  if (!questions || questions.length === 0) {
    return (
      <div
        data-testid="questions-empty-state"
        role="status"
        aria-label="No questions available"
        className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
      >
        <p className="text-muted-foreground">
          {isMaho
            ? 'No questions yet. Create your first strategic question.'
            : 'No questions yet. Maho will add questions for your review.'}
        </p>
        {isMaho && (
          <Link href="/questions/new">
            <Button data-testid="empty-state-action" className="mt-4 min-h-12">
              New Question
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Flat view: render cards directly without category sections (AC #4)
  if (viewMode === 'flat') {
    // Use virtualization for large lists (AC #7)
    if (questions.length >= VIRTUALIZATION_THRESHOLD) {
      return <VirtualizedQuestionsList questions={questions} />;
    }

    return (
      <div data-testid="questions-list" className="space-y-3">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    );
  }

  // Grouped view: render by category with section headers (AC #5)
  const grouped = groupByCategory(questions);

  return (
    <div data-testid="questions-list" className="space-y-6">
      {QUESTION_CATEGORIES.map((category) => {
        const categoryQuestions = grouped[category];
        return (
          <CategorySection
            key={category}
            category={category}
            count={categoryQuestions.length}
          >
            {categoryQuestions.length === 0 ? (
              <CategoryEmptyState category={category} isMaho={isMaho} />
            ) : (
              <div className="space-y-3">
                {categoryQuestions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            )}
          </CategorySection>
        );
      })}
    </div>
  );
}
