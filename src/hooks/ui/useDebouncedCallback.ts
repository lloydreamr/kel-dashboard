'use client';

/**
 * useDebouncedCallback Hook
 *
 * Creates a debounced version of a callback function.
 * Automatically cleans up on unmount to prevent memory leaks.
 * Used for auto-save functionality where we want to save after typing pauses.
 */

import { useCallback, useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseDebouncedCallbackResult<T extends (...args: any[]) => void> {
  /** The debounced version of the callback */
  debouncedFn: (...args: Parameters<T>) => void;
  /** Cancels any pending invocation */
  cancel: () => void;
}

/**
 * Creates a debounced version of a callback.
 * Automatically cleans up on unmount.
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 2000)
 * @returns Object with debouncedFn and cancel method
 *
 * @example
 * const { debouncedFn, cancel } = useDebouncedCallback((value: string) => {
 *   saveDraft(value);
 * }, 2000);
 *
 * // Call debouncedFn on each keystroke
 * onChange={(e) => debouncedFn(e.target.value)}
 *
 * // Cancel on unmount or when done
 * cancel();
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay = 2000
): UseDebouncedCallbackResult<T> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated to always call latest version
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      // Clear any existing timeout
      cancel();

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel]
  );

  return { debouncedFn, cancel };
}
