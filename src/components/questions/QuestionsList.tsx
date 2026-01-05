'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/auth';
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
  const { data: profile } = useProfile();
  const { data: questions, isLoading, error } = useQuestions();
  const isMaho = profile?.role === 'maho';

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

  // Global empty state - role-specific messaging (AC: #3, #4, #5)
  if (!questions || questions.length === 0) {
    return (
      <div
        data-testid="questions-empty-state"
        className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
      >
        <p className="text-muted-foreground">
          {isMaho
            ? 'No questions yet. Create your first strategic question.'
            : 'No questions yet. Maho will add questions for your review.'}
        </p>
        {isMaho && (
          <Link href="/questions/new">
            <Button data-testid="empty-state-action" className="mt-4 min-h-[48px]">
              New Question
            </Button>
          </Link>
        )}
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
