'use client';

/**
 * CategoryFilterChips Component
 *
 * Filter chips for filtering opportunities by category.
 * Shows counts in parentheses for each category.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  OPPORTUNITY_CATEGORY_LABELS,
  type OpportunityCategoryFilterKey,
} from '@/types';

const CATEGORY_KEYS: OpportunityCategoryFilterKey[] = [
  'all',
  'market_gap',
  'product_opportunity',
  'competitive_weakness',
  'trend_alignment',
];

interface CategoryFilterChipsProps {
  value: OpportunityCategoryFilterKey;
  counts: Record<OpportunityCategoryFilterKey, number>;
  onChange: (value: OpportunityCategoryFilterKey) => void;
}

export function CategoryFilterChips({ value, counts, onChange }: CategoryFilterChipsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as OpportunityCategoryFilterKey)}
      data-testid="opportunity-category-filter-chips"
    >
      <TabsList
        aria-label="Filter opportunities by category"
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
      >
        {CATEGORY_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`opportunity-category-filter-${key}`}
            className="min-h-10 rounded-full border border-border bg-background px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {OPPORTUNITY_CATEGORY_LABELS[key]}
            <span className="ml-1 opacity-70">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
