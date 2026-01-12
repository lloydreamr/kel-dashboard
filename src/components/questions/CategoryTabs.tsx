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
 * - Responsive design: horizontal scroll on mobile with full labels
 * - Displays count in each tab
 */
export function CategoryTabs({ value, counts, onChange }: CategoryTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as CategoryFilterKey)}
      data-testid="category-tabs"
    >
      {/* Mobile: horizontal scroll wrapper, Desktop: no scroll needed */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <TabsList
          aria-label="Filter questions by category"
          className="inline-flex h-auto w-max items-center gap-1 sm:grid sm:w-full sm:grid-cols-4 sm:gap-0"
        >
          {CATEGORY_FILTER_KEYS.map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              data-testid={`category-tab-${key}`}
              className="min-h-12 shrink-0 whitespace-nowrap px-4 sm:flex-1 sm:px-4"
            >
              {/* Show full labels on all screen sizes for better UX */}
              <span>{CATEGORY_FILTER_CONFIG[key].label}</span>
              <span className="ml-1">({counts[key]})</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
