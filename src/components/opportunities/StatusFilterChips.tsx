'use client';

/**
 * StatusFilterChips Component
 *
 * Filter chips for filtering opportunities by status.
 * Shows counts in parentheses for each status.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  OPPORTUNITY_STATUS_LABELS,
  type OpportunityStatusFilterKey,
} from '@/types';

const STATUS_KEYS: OpportunityStatusFilterKey[] = [
  'all',
  'new',
  'reviewing',
  'actionable',
  'dismissed',
];

interface StatusFilterChipsProps {
  value: OpportunityStatusFilterKey;
  counts: Record<OpportunityStatusFilterKey, number>;
  onChange: (value: OpportunityStatusFilterKey) => void;
}

export function StatusFilterChips({ value, counts, onChange }: StatusFilterChipsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as OpportunityStatusFilterKey)}
      data-testid="opportunity-status-filter-chips"
    >
      <TabsList
        aria-label="Filter opportunities by status"
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
      >
        {STATUS_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`opportunity-status-filter-${key}`}
            className="min-h-10 rounded-full border border-border bg-background px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {OPPORTUNITY_STATUS_LABELS[key]}
            <span className="ml-1 opacity-70">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
