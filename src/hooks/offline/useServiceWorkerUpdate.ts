/**
 * useServiceWorkerUpdate Hook
 *
 * Detects service worker updates and prompts users to refresh.
 * Uses @serwist/window for lifecycle event handling.
 *
 * Flow:
 * 1. Registers service worker on mount (if not already)
 * 2. Listens for 'waiting' event (new SW installed but waiting)
 * 3. Shows toast with "Refresh" action
 * 4. On refresh, sends SKIP_WAITING message to activate new SW
 * 5. Reloads page when new SW takes control
 *
 * Note: Only runs in production (SW disabled in development via next.config.ts)
 */

'use client';

import { Serwist } from '@serwist/window';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Hook to detect and handle service worker updates.
 *
 * Shows a toast notification when a new version is available,
 * allowing users to refresh to apply the update.
 *
 * @example
 * // In a provider or layout component:
 * function AppProviders({ children }) {
 *   useServiceWorkerUpdate();
 *   return <>{children}</>;
 * }
 */
export function useServiceWorkerUpdate(): void {
  const serwistRef = useRef<Serwist | null>(null);

  useEffect(() => {
    // Only run in browser with service worker support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Skip in development (SW is disabled anyway)
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // Create Serwist instance for SW management
    const serwist = new Serwist('/sw.js', { scope: '/' });
    serwistRef.current = serwist;

    /**
     * Handle waiting service worker.
     * This fires when a new SW is installed but waiting to activate.
     */
    const handleWaiting = () => {
      toast.info('A new version is available', {
        id: 'sw-update-available',
        duration: Infinity, // Stay until dismissed or acted upon
        action: {
          label: 'Refresh',
          onClick: () => {
            // Tell the waiting SW to skip waiting and activate
            serwist.messageSkipWaiting();
          },
        },
        description: 'Refresh to get the latest features.',
      });
    };

    /**
     * Handle when the new SW takes control.
     * This fires after SKIP_WAITING succeeds.
     */
    const handleControlling = () => {
      // Dismiss the update toast before reload
      toast.dismiss('sw-update-available');
      // Reload to use the new SW
      window.location.reload();
    };

    // Listen for SW lifecycle events
    serwist.addEventListener('waiting', handleWaiting);
    serwist.addEventListener('controlling', handleControlling);

    // Register the service worker
    // Note: @serwist/next auto-registers, but this ensures we have the instance
    serwist.register().catch((error) => {
      // Registration failures are non-critical, just log
      console.warn('Service worker registration failed:', error);
    });

    // Cleanup listeners on unmount
    return () => {
      serwist.removeEventListener('waiting', handleWaiting);
      serwist.removeEventListener('controlling', handleControlling);
    };
  }, []);
}
