'use client';

/**
 * SuggestedQuestions Component
 *
 * Displays clickable question chips in the empty state.
 * Users click to directly submit the question (not just populate input).
 *
 * Story 15.4: Suggested Questions
 * AC: 1, 2, 3, 5
 */

import { Button } from '@/components/ui/button';

export type SuggestedQuestionsProps = {
  questions: string[];
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
};

export function SuggestedQuestions({
  questions,
  onQuestionClick,
  disabled = false,
}: SuggestedQuestionsProps) {
  return (
    <div
      role="group"
      aria-label="Suggested questions"
      className="flex flex-wrap justify-center gap-2"
      data-testid="suggested-questions-group"
    >
      {questions.map((question) => (
        <Button
          key={question}
          variant="outline"
          disabled={disabled}
          onClick={() => onQuestionClick(question)}
          className="min-h-[48px] rounded-full px-4 py-2 text-sm whitespace-normal text-left"
          data-testid={`suggestion-chip-${question.slice(0, 10).replace(/\s/g, '-').toLowerCase()}`}
        >
          {question}
        </Button>
      ))}
    </div>
  );
}
