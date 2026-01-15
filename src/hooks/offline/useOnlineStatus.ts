/**
 * @fileoverview SSR-safe online/offline status hook
 *
 * Provides reactive online/offline status detection for the Kel Dashboard.
 * Used by OfflineBanner and useOfflineGuard to show UI feedback when offline.
 *
 * Story 10.3: Offline Read-Only Mode (Service Worker)
 *
 * @example
 * const { isOnline } = useOnlineStatus();
 * // isOnline: false when browser goes offline
 * // Updates within 3 seconds of network state change (browser event latency)
 */

import { useState, useEffect } from 'react';

import { FEATURES } from '@/lib/features';

export interface UseOnlineStatusResult {
  /**
   * True when browser is online, false when offline.
   * SSR-safe: defaults to `true` to prevent hydration mismatch.
   */
  isOnline: boolean;
}

/**
 * Hook for detecting online/offline network status.
 *
 * SSR-safe: Defaults to online (`true`) to prevent hydration mismatches.
 * Updates reactively when browser 'online'/'offline' events fire.
 *
 * @returns Object containing `isOnline` boolean
 */
export function useOnlineStatus(): UseOnlineStatusResult {
  // SSR-safe default: assume online to prevent hydration mismatch
  // navigator.onLine doesn't exist on server, so we can't use it for initial value
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Feature flag guard per Story 8.5 Task 1.5
    // Skip event listeners when offline features are disabled
    if (!FEATURES.OFFLINE_READ && !FEATURES.OFFLINE_MODE) {
      return;
    }

    // Client-side only: read actual online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
