'use client';

/**
 * ResearchCategoryTabs Component
 *
 * Tab-based category filter for research documents using shadcn/ui Tabs.
 * Shows count for each category.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { RESEARCH_CATEGORY_LABELS, type ResearchCategoryFilterKey } from '@/types';

interface ResearchCategoryTabsProps {
  value: ResearchCategoryFilterKey;
  onChange: (value: ResearchCategoryFilterKey) => void;
  counts: Record<ResearchCategoryFilterKey, number>;
}

export function ResearchCategoryTabs({
  value,
  onChange,
  counts,
}: ResearchCategoryTabsProps) {
  const categories: ResearchCategoryFilterKey[] = [
    'all',
    'consumers',
    'trends',
    'distribution',
    'regulatory',
    'general',
  ];

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as ResearchCategoryFilterKey)}
    >
      <TabsList
        className="flex-wrap h-auto gap-1"
        data-testid="research-category-tabs"
      >
        {categories.map((cat) => (
          <TabsTrigger
            key={cat}
            value={cat}
            className="min-h-[48px] min-w-[48px]"
            data-testid={`research-category-tab-${cat}`}
          >
            {RESEARCH_CATEGORY_LABELS[cat]} ({counts[cat]})
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
