'use client';

/**
 * ProductsSearch Component
 *
 * Search input for filtering products by name.
 * Uses debouncing (300ms) to avoid excessive re-renders.
 */

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

interface ProductsSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function ProductsSearch({
  value,
  onChange,
  placeholder = 'Search products...',
  debounceMs = 300,
}: ProductsSearchProps) {
  const [internalValue, setInternalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync internal value when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
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
    <div className="relative" data-testid="products-search">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        type="search"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Search products"
      />

      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
