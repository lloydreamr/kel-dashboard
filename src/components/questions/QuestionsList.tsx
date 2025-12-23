'use client';

import { useQuestions } from '@/hooks/questions/useQuestions';
import { QUESTION_CATEGORIES } from '@/types/question';

import { CategoryEmptyState } from './CategoryEmptyState';
import { CategorySection } from './CategorySection';
import { QuestionCard } from './QuestionCard';
import { QuestionsListSkeleton } from './QuestionsListSkeleton';


import type { Question, QuestionCategory } from '@/types/question';

function groupByCategory(questions: Question[]): Record<QuestionCategory, Question[]> {
  const grouped: Record<QuestionCategory, Question[]> = {
    market: [],
    product: [],
    distribution: [],
  };

  for (const question of questions) {
    grouped[question.category].push(question);
  }

  return grouped;
}

export function QuestionsList() {
  const { data: questions, isLoading, error } = useQuestions();

  if (isLoading) {
    return <QuestionsListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load questions</p>
      </div>
    );
  }

  // Global empty state - no questions at all
  if (!questions || questions.length === 0) {
    return (
      <div
        data-testid="questions-empty-state"
        className="rounded-lg border border-border bg-surface p-8 text-center"
      >
        <p className="text-muted-foreground">
          No questions yet. Create your first strategic question.
        </p>
      </div>
    );
  }

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
              <CategoryEmptyState category={category} />
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
