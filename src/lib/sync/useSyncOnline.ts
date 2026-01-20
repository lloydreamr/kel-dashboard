/**
 * Hook to auto-start sync engine when coming back online.
 *
 * Integrates with existing useOnlineStatus pattern and TanStack Query.
 * Uses debouncing to prevent rapid start/stop cycles during network fluctuations.
 *
 * @see Story 8.3: Sync Engine - Task 6
 */

'use client';

import { useEffect, useRef } from 'react';

import { FEATURES } from '@/lib/features';
import { useQueryClient } from '@tanstack/react-query';

import { startSync, stopSync } from './engine';

/**
 * Debounce delay in milliseconds.
 * Prevents rapid sync start/stop during network fluctuations.
 */
const ONLINE_DEBOUNCE_MS = 1000;

/**
 * Hook that auto-triggers sync when the browser comes online.
 *
 * Should be called once at app root level (e.g., in providers.tsx).
 * Does nothing if OFFLINE_MODE feature is disabled.
 *
 * @example
 * ```tsx
 * // In app/providers.tsx
 * function Providers({ children }: { children: React.ReactNode }) {
 *   useSyncOnline(); // Auto-syncs when online
 *
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       {children}
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export function useSyncOnline(): void {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Guard: Skip if offline mode is disabled
    if (!FEATURES.OFFLINE_MODE) {
      return;
    }

    /**
     * Handler for browser 'online' event.
     * Debounces to avoid rapid start/stop cycles.
     */
    const handleOnline = () => {
      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the sync start
      debounceTimeoutRef.current = setTimeout(() => {
        if (navigator.onLine) {
          console.log('[sync/useSyncOnline] Online detected, starting sync...');
          startSync(queryClient);
        }
      }, ONLINE_DEBOUNCE_MS);
    };

    /**
     * Handler for browser 'offline' event.
     * Stops sync engine when going offline.
     */
    const handleOffline = () => {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      console.log('[sync/useSyncOnline] Offline detected, stopping sync...');
      stopSync();
    };

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If already online, trigger initial sync
    if (navigator.onLine) {
      handleOnline();
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [queryClient]);
}
