'use client';

/**
 * OfflineBanner Component
 *
 * Displays a persistent warning banner when the user is offline.
 * Shows a brief "Back online" message when reconnected before auto-dismissing.
 * Respects the OFFLINE_READ feature flag - hidden when flag is disabled.
 *
 * Story 10.3: Offline Read-Only Mode (Task 3)
 * Story 10.4: Offline Detection & Sync Indicator (Task 4 - AC#4)
 *
 * @example
 * ```tsx
 * // In layout:
 * <OfflineBanner />
 * {children}
 * ```
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useOnlineStatus } from '@/hooks/offline';
import { ANIMATION } from '@/lib/constants/animations';
import { FEATURES } from '@/lib/features';
import { cn } from '@/lib/utils';

export interface OfflineBannerProps {
  /** Optional className for custom styling */
  className?: string;
  /** Auto-dismiss delay in milliseconds for reconnection message (default: 2000) */
  reconnectDismissDelay?: number;
}

/** Banner state: offline (yellow), reconnecting (green), or hidden */
type BannerState = 'offline' | 'reconnecting' | 'hidden';

/**
 * OfflineBanner - Persistent offline status indicator with reconnection feedback.
 *
 * Shows a yellow warning banner when offline and OFFLINE_READ is enabled.
 * Shows a green "Back online" message briefly when reconnected (AC#4).
 * Uses slide animation for smooth enter/exit.
 * Auto-dismisses when back online.
 *
 * Per AC#5: Uses bg-yellow-100 text-yellow-800 styling when offline
 * Per AC#4: Uses bg-green-100 text-green-800 styling when reconnected
 * Per AC#6: Only shows when FEATURES.OFFLINE_READ is true
 */
export function OfflineBanner({
  className,
  reconnectDismissDelay = 2000,
}: OfflineBannerProps) {
  const { isOnline } = useOnlineStatus();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const wasOfflineRef = useRef(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track offline/online transitions
  useEffect(() => {
    // Clear any existing timeout
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    if (!FEATURES.OFFLINE_READ) {
      setBannerState('hidden');
      return;
    }

    if (!isOnline) {
      // Currently offline
      setBannerState('offline');
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Just came back online after being offline
      setBannerState('reconnecting');

      // Auto-dismiss after delay
      dismissTimeoutRef.current = setTimeout(() => {
        setBannerState('hidden');
        wasOfflineRef.current = false;
      }, reconnectDismissDelay);
    } else {
      // Online and was never offline
      setBannerState('hidden');
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [isOnline, reconnectDismissDelay]);

  const shouldShow = bannerState !== 'hidden';
  const isReconnecting = bannerState === 'reconnecting';

  const bannerClasses = isReconnecting
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800';

  const Icon = isReconnecting ? Wifi : WifiOff;
  const message = isReconnecting
    ? 'Back online – syncing...'
    : "You're offline - viewing cached data";

  // Per AC#4: Use offline-banner-reconnected when reconnecting
  const testId = isReconnecting ? 'offline-banner-reconnected' : 'offline-banner';

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          data-testid={testId}
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={ANIMATION.slideIn}
          className={cn(
            bannerClasses,
            'px-4 py-3 flex items-center justify-center gap-2',
            className
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
