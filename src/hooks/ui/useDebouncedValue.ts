'use client';

/**
 * useDebouncedValue Hook
 *
 * Returns a debounced version of a value that only updates after
 * the specified delay has passed without the value changing.
 *
 * Story 13.1: Used for search input debouncing in SearchableQuestionCombobox
 */

import { useState, useEffect } from 'react';

/**
 * Debounces a value, returning the debounced version.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 * @returns The debounced value
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 150);
 *
 * // debouncedSearch only updates 150ms after typing stops
 * useEffect(() => {
 *   filterItems(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebouncedValue<T>(value: T, delay = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
