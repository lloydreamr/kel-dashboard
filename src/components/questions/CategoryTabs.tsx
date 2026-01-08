'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CategoryCounts,
  CategoryFilterKey,
  CATEGORY_FILTER_CONFIG,
  CATEGORY_FILTER_KEYS,
} from '@/types/question';

interface CategoryTabsProps {
  /** Current active category filter */
  value: CategoryFilterKey;
  /** Count of questions for each category */
  counts: CategoryCounts;
  /** Callback when category changes */
  onChange: (value: CategoryFilterKey) => void;
}

/**
 * Category filter tabs for quick navigation between question categories.
 * Uses shadcn Tabs component with 48px touch targets.
 *
 * Story 13.3: Category Navigation for Questions
 * - Responsive labels (desktop: full, mobile: abbreviated)
 * - Displays count in each tab
 */
export function CategoryTabs({ value, counts, onChange }: CategoryTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as CategoryFilterKey)}
      data-testid="category-tabs"
    >
      <TabsList aria-label="Filter questions by category" className="grid w-full grid-cols-4">
        {CATEGORY_FILTER_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`category-tab-${key}`}
            className="min-h-[48px] flex-1"
          >
            <span className="hidden sm:inline">{CATEGORY_FILTER_CONFIG[key].label}</span>
            <span className="sm:hidden">{CATEGORY_FILTER_CONFIG[key].shortLabel}</span>
            <span className="ml-1">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
