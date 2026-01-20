'use client';

/**
 * CategoryFilterChips Component
 *
 * Filter chips for filtering companies by category.
 * Shows counts in parentheses for each category.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORY_LABELS, type CategoryFilterKey } from '@/types';

const CATEGORY_KEYS: CategoryFilterKey[] = ['all', 'local_major', 'multinational', 'importer', 'niche'];

interface CategoryFilterChipsProps {
  value: CategoryFilterKey;
  counts: Record<CategoryFilterKey, number>;
  onChange: (value: CategoryFilterKey) => void;
}

export function CategoryFilterChips({ value, counts, onChange }: CategoryFilterChipsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as CategoryFilterKey)}
      data-testid="category-filter-chips"
    >
      <TabsList
        aria-label="Filter companies by category"
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
      >
        {CATEGORY_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`category-filter-${key}`}
            className="min-h-10 rounded-full border border-border bg-background px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {CATEGORY_LABELS[key]}
            <span className="ml-1 opacity-70">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
