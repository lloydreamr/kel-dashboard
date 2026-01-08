/**
 * StaleQuestionsClient Component
 *
 * Client component for displaying stale questions in a specific category.
 * Validates the category parameter before use to prevent runtime errors.
 */

'use client';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { QuestionCard } from '@/components/questions/QuestionCard';
import { QuestionCardSkeleton } from '@/components/questions/QuestionCardSkeleton';
import { Button } from '@/components/ui/button';
import { useStaleQuestionsByCategory } from '@/hooks/questions';
import { STALE_THRESHOLD_DAYS } from '@/lib/utils/staleness';
import {
  CATEGORY_LABELS,
  QUESTION_CATEGORIES,
} from '@/types/question';

import type { QuestionCategory } from '@/types/question';

interface StaleQuestionsClientProps {
  category: string;
}

export function StaleQuestionsClient({ category }: StaleQuestionsClientProps) {
  // Validate category parameter
  const isValidCategory = QUESTION_CATEGORIES.includes(category as QuestionCategory);

  // IMPORTANT: Hook must be called unconditionally (Rules of Hooks)
  // Pass a valid default category when invalid - the result won't be used
  const safeCategory = isValidCategory ? (category as QuestionCategory) : 'market';
  const { data, isLoading, error } = useStaleQuestionsByCategory(safeCategory);

  // Get category label for display (use safeCategory for consistency)
  const categoryLabel = isValidCategory
    ? CATEGORY_LABELS[category as QuestionCategory]
    : category;

  // Show error state for invalid categories (after hook call)
  if (!isValidCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/progress">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Progress
            </Link>
          </Button>
        </div>

        <div
          className="text-center py-8 text-destructive"
          data-testid="invalid-category-error"
        >
          Invalid category: {category}
        </div>
      </div>
    );
  }

  // Use skeleton loading per project-context.md requirement
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/progress">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Progress
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Stale {categoryLabel} Questions</h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="stale-definition">
            Questions not updated in {STALE_THRESHOLD_DAYS}+ days
          </p>
        </div>

        <div className="space-y-4" data-testid="stale-questions-loading">
          {[1, 2, 3].map((i) => (
            <QuestionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/progress">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Progress
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Stale {categoryLabel} Questions</h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="stale-definition">
            Questions not updated in {STALE_THRESHOLD_DAYS}+ days
          </p>
        </div>

        <div
          className="text-center py-8 text-destructive"
          data-testid="stale-questions-error"
        >
          Failed to load questions
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/progress">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Progress
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold" data-testid="stale-questions-title">
          Stale {categoryLabel} Questions
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="stale-definition">
          Questions not updated in {STALE_THRESHOLD_DAYS}+ days
        </p>
      </div>

      {data?.staleQuestions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-lg bg-muted/20"
          data-testid="stale-questions-empty"
        >
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">All caught up!</h2>
          <p className="text-muted-foreground max-w-sm">
            No {categoryLabel} questions have gone stale. Keep up the great research!
          </p>
        </div>
      ) : (
        <div className="space-y-4" data-testid="stale-questions-list">
          {data?.staleQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}
