'use client';

/**
 * GlobalSearch Component
 *
 * Search input with dropdown results for the Market Intelligence dashboard.
 * Searches across companies, products, and research docs.
 * Uses debounced input (300ms) for performance.
 */

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { useGlobalSearch } from '@/hooks/market-intelligence';
import { cn } from '@/lib/utils';

import { GlobalSearchResults } from './GlobalSearchResults';

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, isLoading, error } = useGlobalSearch(debouncedQuery);

  // Debounce input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setDebouncedQuery(value);
      }, 300);

      // Open dropdown when typing
      if (value.length >= 2) {
        setIsOpen(true);
      }
    },
    []
  );

  // Clear search
  const handleClear = useCallback(() => {
    setInputValue('');
    setDebouncedQuery('');
    setIsOpen(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Close dropdown when clicking result
  const handleResultClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Show error toast would be handled by parent - log for now
  useEffect(() => {
    if (error) {
      console.error('Global search error:', error);
    }
  }, [error]);

  const showDropdown = isOpen && inputValue.length >= 2;

  return (
    <div
      ref={containerRef}
      data-testid="mi-global-search"
      className={cn('relative', className)}
    >
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />

        <Input
          type="search"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          placeholder="Search companies, products, research..."
          className="pl-9 pr-12"
          aria-label="Search knowledge base"
          data-testid="mi-global-search-input"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            data-testid="mi-global-search-clear"
            className="absolute right-1 top-1/2 flex min-h-[48px] min-w-[48px] -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-md border bg-popover shadow-md">
          <GlobalSearchResults
            results={results}
            isLoading={isLoading}
            query={debouncedQuery}
            onResultClick={handleResultClick}
          />
        </div>
      )}
    </div>
  );
}
