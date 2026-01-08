'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StatusFilterKey,
  STATUS_FILTER_CONFIG,
  STATUS_FILTER_KEYS,
} from '@/types/question';

interface StatusFilterProps {
  /** Current active filter */
  value: StatusFilterKey;
  /** Count of questions for each filter option */
  counts: Record<StatusFilterKey, number>;
  /** Callback when filter changes */
  onChange: (value: StatusFilterKey) => void;
}

/**
 * Status filter tabs for filtering questions by status.
 * Uses underline style to differentiate from CategoryTabs (which uses pills).
 * Uses shadcn Tabs component with keyboard navigation.
 */
export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as StatusFilterKey)}
      data-testid="status-filter"
    >
      <TabsList
        aria-label="Filter questions by status"
        className="h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0"
      >
        {STATUS_FILTER_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`status-filter-${key}`}
            className="min-h-12 flex-1 rounded-none border-b-2 border-transparent bg-transparent shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <span className="hidden sm:inline">{STATUS_FILTER_CONFIG[key].label}</span>
            <span className="sm:hidden">{STATUS_FILTER_CONFIG[key].shortLabel}</span>
            <span className="ml-1 text-muted-foreground">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
