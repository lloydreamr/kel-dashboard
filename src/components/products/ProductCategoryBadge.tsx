'use client';

/**
 * ProductCategoryBadge Component
 *
 * Displays a colored badge for product category.
 * Uses design tokens for colors, not arbitrary hex values.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCategoryBadgeProps {
  category: string | null;
}

const categoryVariants: Record<string, string> = {
  puffed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  chips: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  nuts: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  crackers: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
};

export function ProductCategoryBadge({ category }: ProductCategoryBadgeProps) {
  if (!category) return null;

  const label = category.charAt(0).toUpperCase() + category.slice(1);
  const variantClass = categoryVariants[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  return (
    <Badge className={cn('text-xs', variantClass)}>
      {label}
    </Badge>
  );
}
