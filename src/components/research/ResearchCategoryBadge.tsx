/**
 * ResearchCategoryBadge Component
 *
 * Displays research document category with category-specific color styling.
 * Each category has distinct colors for easy visual differentiation.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ResearchCategoryBadgeProps {
  category: string | null;
}

/** Category-specific color variants using design tokens */
const CATEGORY_VARIANTS: Record<string, string> = {
  consumers: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  trends: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  distribution: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  regulatory: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function ResearchCategoryBadge({ category }: ResearchCategoryBadgeProps) {
  if (!category) return null;

  const label = formatCategoryLabel(category);
  const variantClass = CATEGORY_VARIANTS[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  return (
    <Badge
      variant="secondary"
      className={cn('text-xs font-medium shrink-0', variantClass)}
    >
      {label}
    </Badge>
  );
}
