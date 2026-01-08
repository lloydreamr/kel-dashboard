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
 * Uses shadcn Tabs component with keyboard navigation.
 */
export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as StatusFilterKey)}
      data-testid="status-filter"
    >
      <TabsList aria-label="Filter questions by status" className="w-full">
        {STATUS_FILTER_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`status-filter-${key}`}
            className="min-h-[48px] flex-1"
          >
            <span className="hidden sm:inline">{STATUS_FILTER_CONFIG[key].label}</span>
            <span className="sm:hidden">{STATUS_FILTER_CONFIG[key].shortLabel}</span>
            <span className="ml-1">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
