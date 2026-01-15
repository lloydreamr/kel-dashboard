'use client';

/**
 * OfflineBanner Component
 *
 * Displays a persistent warning banner when the user is offline.
 * Shows pending action count when OFFLINE_MODE is enabled.
 * Shows a brief "Back online" message when reconnected before auto-dismissing.
 *
 * Created: Story 10.3 (Offline Read-Only Mode) - basic offline banner
 * Enhanced: Story 8.5 (Offline Banner Component) - added queue count, syncing state, test IDs
 *
 * @example
 * ```tsx
 * // In layout:
 * <OfflineBanner />
 * {children}
 * ```
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { useOnlineStatus } from '@/hooks/offline';
import { ANIMATION } from '@/lib/constants/animations';
import { FEATURES } from '@/lib/features';
import { getCount } from '@/lib/offline';
import { cn } from '@/lib/utils';

export interface OfflineBannerProps {
  /** Optional className for custom styling */
  className?: string;
  /** Auto-dismiss delay in milliseconds for success message (default: 3000 per AC3) */
  successDismissDelay?: number;
}

/**
 * Banner state machine:
 * - offline: Yellow banner, shows pending actions count
 * - syncing: Yellow banner with spinner, shows "Syncing..." (AC3)
 * - online: Green banner, shows "✓ Back online" briefly (AC3)
 * - hidden: No banner shown
 */
type BannerState = 'offline' | 'syncing' | 'online' | 'hidden';

/**
 * OfflineBanner - Persistent offline status indicator with queue count and sync feedback.
 *
 * Per Story 8.5 Acceptance Criteria:
 * - AC1: Appears when offline detected (via navigator.onLine/events)
 * - AC2: Shows amber/orange banner with message and queue count
 * - AC3: Shows "Syncing..." with progress, then "✓ Back online" for ~3s
 * - AC4: Hidden when online with no pending actions
 * - AC5: All elements have data-testid attributes
 *
 * Feature flags:
 * - OFFLINE_READ: Shows basic offline message (read-only mode)
 * - OFFLINE_MODE: Shows queue count from IndexedDB (full offline mode)
 */
export function OfflineBanner({
  className,
  successDismissDelay = 3000,
}: OfflineBannerProps) {
  const { isOnline } = useOnlineStatus();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const wasOfflineRef = useRef(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch pending action count from IndexedDB queue
  const refreshPendingCount = useCallback(async () => {
    if (!FEATURES.OFFLINE_MODE) {
      setPendingCount(0);
      return;
    }
    const count = await getCount();
    setPendingCount(count);
  }, []);

  // Refresh pending count when offline or periodically
  useEffect(() => {
    if (!isOnline && (FEATURES.OFFLINE_MODE || FEATURES.OFFLINE_READ)) {
      refreshPendingCount();
      // Refresh count every 5 seconds while offline
      const interval = setInterval(refreshPendingCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline, refreshPendingCount]);

  // Track offline/online transitions
  useEffect(() => {
    // Clear any existing timeout
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    // Check if either offline feature flag is enabled
    const offlineEnabled = FEATURES.OFFLINE_READ || FEATURES.OFFLINE_MODE;
    if (!offlineEnabled) {
      setBannerState('hidden');
      return;
    }

    if (!isOnline) {
      // Currently offline
      setBannerState('offline');
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Just came back online after being offline
      // Per AC3: Show "Syncing..." state first
      setBannerState('syncing');

      // TODO: Integrate with useSyncStatus hook when Story 8.3 sync engine is enabled
      // Currently simulating sync completion after 1 second as a placeholder.
      // When OFFLINE_MODE is fully enabled with the sync engine, replace this
      // timeout with actual sync status monitoring from useSyncStatus().
      dismissTimeoutRef.current = setTimeout(() => {
        setBannerState('online');

        // Auto-dismiss success message after delay (AC3: ~3 seconds)
        dismissTimeoutRef.current = setTimeout(() => {
          setBannerState('hidden');
          wasOfflineRef.current = false;
        }, successDismissDelay);
      }, 1000);
    } else {
      // Online and was never offline (AC4)
      setBannerState('hidden');
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [isOnline, successDismissDelay]);

  const shouldShow = bannerState !== 'hidden';
  const isSyncing = bannerState === 'syncing';
  const isOnlineSuccess = bannerState === 'online';

  // Per AC2: Amber/orange background for offline, green for success
  const bannerClasses = isOnlineSuccess
    ? 'bg-green-100 text-green-800'
    : 'bg-amber-100 text-amber-800';

  // Select appropriate icon
  const renderIcon = () => {
    if (isSyncing) {
      return (
        <Loader2
          data-testid="offline-banner-syncing"
          className="h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      );
    }
    if (isOnlineSuccess) {
      return <Wifi className="h-4 w-4" aria-hidden="true" />;
    }
    return <WifiOff className="h-4 w-4" aria-hidden="true" />;
  };

  // Build message based on state (AC2, AC3)
  const renderMessage = () => {
    if (isSyncing) {
      return 'Syncing...';
    }
    if (isOnlineSuccess) {
      return '✓ Back online';
    }
    // Per AC2: Show queue count when OFFLINE_MODE is enabled
    return "You're offline. Actions will sync when connected.";
  };

  // Per AC2: Show pending count when offline and OFFLINE_MODE enabled
  const showQueueCount = bannerState === 'offline' && FEATURES.OFFLINE_MODE && pendingCount > 0;

  // Per AC5: Test IDs for all interactive elements
  const getTestId = () => {
    if (isOnlineSuccess) return 'offline-banner-online';
    return 'offline-banner';
  };

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          data-testid={getTestId()}
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={ANIMATION.slideIn}
          className={cn(
            bannerClasses,
            'px-4 py-3 flex items-center justify-center gap-2 min-h-[48px]',
            className
          )}
        >
          {renderIcon()}
          <span data-testid="offline-banner-message" className="text-sm font-medium">
            {renderMessage()}
          </span>
          {showQueueCount && (
            <span
              data-testid="offline-banner-queue-count"
              className="text-sm font-medium ml-1"
            >
              {pendingCount} pending {pendingCount === 1 ? 'action' : 'actions'}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
