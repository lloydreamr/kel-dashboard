import { CATEGORY_LABELS } from '@/types/question';

import type { QuestionCategory } from '@/types/question';

interface CategoryEmptyStateProps {
  category: QuestionCategory;
  /** User role determines the message (AC: #5) */
  isMaho?: boolean;
}

export function CategoryEmptyState({ category, isMaho = false }: CategoryEmptyStateProps) {
  const label = CATEGORY_LABELS[category];

  return (
    <div
      data-testid="category-empty-state"
      className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center"
    >
      <p className="text-sm text-muted-foreground">
        {isMaho
          ? `No ${label} questions yet. Add one to get started.`
          : `No ${label} questions yet.`}
      </p>
    </div>
  );
}
