import { CATEGORY_LABELS } from '@/types/question';

import type { QuestionCategory } from '@/types/question';

interface CategoryEmptyStateProps {
  category: QuestionCategory;
}

export function CategoryEmptyState({ category }: CategoryEmptyStateProps) {
  const label = CATEGORY_LABELS[category];

  return (
    <p
      data-testid="category-empty-state"
      className="py-4 text-center text-sm text-muted-foreground"
    >
      No {label} questions yet
    </p>
  );
}
