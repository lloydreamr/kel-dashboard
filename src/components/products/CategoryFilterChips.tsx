'use client';

/**
 * CategoryFilterChips Component
 *
 * Filter chips for filtering products by category.
 * Shows counts in parentheses for each category.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRODUCT_CATEGORY_LABELS, type ProductCategoryFilterKey } from '@/types';

const CATEGORY_KEYS: ProductCategoryFilterKey[] = ['all', 'puffed', 'chips', 'nuts', 'crackers', 'others'];

interface CategoryFilterChipsProps {
  value: ProductCategoryFilterKey;
  counts: Record<ProductCategoryFilterKey, number>;
  onChange: (value: ProductCategoryFilterKey) => void;
}

export function CategoryFilterChips({ value, counts, onChange }: CategoryFilterChipsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as ProductCategoryFilterKey)}
      data-testid="category-filter-chips"
    >
      <TabsList
        aria-label="Filter products by category"
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
      >
        {CATEGORY_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`category-filter-${key}`}
            className="min-h-10 rounded-full border border-border bg-background px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {PRODUCT_CATEGORY_LABELS[key]}
            <span className="ml-1 opacity-70">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
