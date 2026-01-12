/**
 * CategoryBadge Component
 *
 * Displays company category with design-token-based styling.
 * Uses semantic design tokens for consistent theming.
 */

import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category: string | null;
}

function formatCategoryLabel(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) return null;

  const label = formatCategoryLabel(category);

  // Use design tokens: bg-muted for background, text-muted-foreground for text
  // Consistent with questions/CategoryBadge.tsx pattern
  return (
    <Badge
      variant="secondary"
      className="text-xs font-medium"
    >
      {label}
    </Badge>
  );
}
