'use client';

/**
 * PriceTierFilterChips Component
 *
 * Filter chips for filtering products by price tier.
 * Shows counts in parentheses for each tier.
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRICE_TIER_LABELS, type PriceTierFilterKey } from '@/types';

const PRICE_TIER_KEYS: PriceTierFilterKey[] = ['all', 'value', 'mainstream', 'premium'];

interface PriceTierFilterChipsProps {
  value: PriceTierFilterKey;
  counts: Record<PriceTierFilterKey, number>;
  onChange: (value: PriceTierFilterKey) => void;
}

export function PriceTierFilterChips({ value, counts, onChange }: PriceTierFilterChipsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as PriceTierFilterKey)}
      data-testid="price-tier-filter-chips"
    >
      <TabsList
        aria-label="Filter products by price tier"
        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
      >
        {PRICE_TIER_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            data-testid={`price-tier-filter-${key}`}
            className="min-h-10 rounded-full border border-border bg-background px-4 shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {PRICE_TIER_LABELS[key]}
            <span className="ml-1 opacity-70">({counts[key]})</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
