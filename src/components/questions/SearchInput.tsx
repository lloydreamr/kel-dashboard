'use client';

/**
 * SearchInput Component
 *
 * Search input for filtering questions by title and description.
 * Features:
 * - Search icon on the left
 * - Clear button (X) when text is present
 * - Debounced onChange to avoid excessive filtering
 */

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Called when search value changes (debounced) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search questions...',
  debounceMs = 300,
}: SearchInputProps) {
  // Internal state for immediate input updates
  const [internalValue, setInternalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync internal value when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounced call
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Clear search
  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" data-testid="search-input-container">
      {/* Search Icon */}
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      {/* Input */}
      <Input
        type="search"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
        data-testid="search-input"
        aria-label="Search questions"
      />

      {/* Clear Button */}
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="search-clear-button"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
