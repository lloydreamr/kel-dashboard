'use client';

/**
 * PriceTierBadge Component
 *
 * Displays a colored badge for product price tier.
 * Uses design tokens for colors, not arbitrary hex values.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriceTierBadgeProps {
  tier: string | null;
}

const tierVariants: Record<string, string> = {
  value: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300',
  mainstream: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  premium: 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export function PriceTierBadge({ tier }: PriceTierBadgeProps) {
  if (!tier) return null;

  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  const variantClass = tierVariants[tier] || '';

  return (
    <Badge variant="outline" className={cn('text-xs', variantClass)}>
      {label}
    </Badge>
  );
}
