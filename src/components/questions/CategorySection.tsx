'use client';

import { CATEGORY_LABELS } from '@/types/question';

import type { QuestionCategory } from '@/types/question';

const CATEGORY_COLORS: Record<QuestionCategory, { bg: string; border: string; text: string }> = {
  market: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  product: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
  },
  distribution: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
  },
};

interface CategorySectionProps {
  category: QuestionCategory;
  count: number;
  children: React.ReactNode;
}

export function CategorySection({ category, count, children }: CategorySectionProps) {
  const colors = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  return (
    <section
      data-testid={`category-section-${category}`}
      className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
    >
      {/* Compact header on mobile, more spacious on larger screens */}
      <header className={`flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 ${colors.bg} ${colors.text}`}>
        <h2 className="font-semibold capitalize text-sm sm:text-base">{label}</h2>
        {/* Short count on mobile, full text on larger screens */}
        <span className="text-xs sm:text-sm font-medium">
          <span className="sm:hidden">({count})</span>
          <span className="hidden sm:inline">{count} {count === 1 ? 'question' : 'questions'}</span>
        </span>
      </header>
      <div className="bg-surface p-3 sm:p-4">
        {children}
      </div>
    </section>
  );
}
