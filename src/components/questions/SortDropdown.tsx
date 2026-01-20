'use client';

import { ArrowUpDown } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SORT_CONFIG, SORT_KEYS, SortKey } from '@/types/question';

interface SortDropdownProps {
  /** Current sort option */
  value: SortKey;
  /** Callback when sort changes */
  onChange: (value: SortKey) => void;
}

/**
 * Dropdown for selecting question sort order.
 * Uses shadcn Select component with accessible labeling.
 *
 * UX Audit: Added sorting options for Questions List
 */
export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2" data-testid="sort-dropdown">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
        <SelectTrigger
          className="w-40 min-h-10"
          aria-label="Sort questions by"
          data-testid="sort-dropdown-trigger"
        >
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_KEYS.map((key) => (
            <SelectItem
              key={key}
              value={key}
              data-testid={`sort-option-${key}`}
            >
              {SORT_CONFIG[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
