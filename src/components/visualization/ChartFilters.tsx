'use client';

/**
 * @fileoverview Filter controls for scatter chart visualization
 *
 * Allows filtering competitors by category and distribution channel.
 * Positioned above chart with responsive layout.
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COMPETITOR_CATEGORIES, DISTRIBUTION_CHANNELS, type CompetitorCategory, type DistributionChannel } from './competitorSchema';

export interface ChartFiltersValue {
  category: CompetitorCategory | null;
  channel: DistributionChannel | null;
}

interface ChartFiltersProps {
  value: ChartFiltersValue;
  onChange: (value: ChartFiltersValue) => void;
  /** Hide filters in certain modes (e.g., pitch mode) */
  isHidden?: boolean;
  /** Number of competitors after filtering */
  filteredCount?: number;
  /** Total number of competitors (before filtering) */
  totalCount?: number;
}

// Friendly labels for distribution channels
const CHANNEL_LABELS: Record<DistributionChannel, string> = {
  supermarket: 'Supermarket',
  convenience: 'Convenience Store',
  'sari-sari': 'Sari-sari Store',
  online: 'Online / E-commerce',
  wholesale: 'Wholesale',
  foodservice: 'Foodservice / HoReCa',
};

/**
 * ChartFilters Component
 *
 * Provides filter controls for the scatter chart visualization.
 * Filters by product category and distribution channel.
 *
 * Features:
 * - Category filter (Chips, Crackers, Puffs, Other)
 * - Channel filter (supermarket, convenience, etc.)
 * - Clear all button when filters are active
 * - Responsive layout
 */
export function ChartFilters({ value, onChange, isHidden = false, filteredCount, totalCount }: ChartFiltersProps) {
  if (isHidden) return null;

  const hasActiveFilters = value.category !== null || value.channel !== null;
  const showCountIndicator = hasActiveFilters && filteredCount !== undefined && totalCount !== undefined;

  const handleCategoryChange = (newValue: string) => {
    onChange({
      ...value,
      category: newValue === 'all' ? null : (newValue as CompetitorCategory),
    });
  };

  const handleChannelChange = (newValue: string) => {
    onChange({
      ...value,
      channel: newValue === 'all' ? null : (newValue as DistributionChannel),
    });
  };

  const handleClearAll = () => {
    onChange({ category: null, channel: null });
  };

  return (
    <div
      data-testid="chart-filters"
      className="flex flex-wrap items-center gap-3 mb-4"
    >
      <span className="text-sm text-muted-foreground">Filter by:</span>

      {/* Category Filter */}
      <Select
        value={value.category ?? 'all'}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-[140px] h-8 text-sm" data-testid="filter-category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {COMPETITOR_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Channel Filter */}
      <Select
        value={value.channel ?? 'all'}
        onValueChange={handleChannelChange}
      >
        <SelectTrigger className="w-[180px] h-8 text-sm" data-testid="filter-channel">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Channels</SelectItem>
          {DISTRIBUTION_CHANNELS.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {CHANNEL_LABELS[channel]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={handleClearAll}
          data-testid="filter-clear"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}

      {/* Filter Results Indicator */}
      {showCountIndicator && (
        <span
          data-testid="filter-count"
          className="text-xs text-muted-foreground ml-auto"
        >
          Showing <span className="font-medium text-foreground">{filteredCount}</span> of {totalCount} competitors
        </span>
      )}
    </div>
  );
}
