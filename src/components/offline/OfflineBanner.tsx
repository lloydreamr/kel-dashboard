'use client';

/**
 * OfflineBanner Component
 *
 * Displays a persistent warning banner when the user is offline.
 * Respects the OFFLINE_READ feature flag - hidden when flag is disabled.
 * Auto-dismisses when connection is restored.
 *
 * Story 10.3: Offline Read-Only Mode (Task 3)
 *
 * @example
 * ```tsx
 * // In layout:
 * <OfflineBanner />
 * {children}
 * ```
 */

import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

import { useOnlineStatus } from '@/hooks/offline';
import { FEATURES } from '@/lib/features';
import { ANIMATION } from '@/lib/constants/animations';

export interface OfflineBannerProps {
  /** Optional className for custom styling */
  className?: string;
}

/**
 * OfflineBanner - Persistent offline status indicator.
 *
 * Shows a yellow warning banner when offline and OFFLINE_READ is enabled.
 * Uses slide animation for smooth enter/exit.
 * Auto-dismisses when back online.
 *
 * Per AC#5: Uses bg-yellow-100 text-yellow-800 styling
 * Per AC#6: Only shows when FEATURES.OFFLINE_READ is true
 */
export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline } = useOnlineStatus();

  // Don't render if:
  // 1. Feature flag is disabled (AC#6)
  // 2. User is online (AC#5 - auto-dismiss)
  const shouldShow = FEATURES.OFFLINE_READ && !isOnline;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          data-testid="offline-banner"
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={ANIMATION.slideIn}
          className={`bg-yellow-100 text-yellow-800 px-4 py-3 flex items-center justify-center gap-2 ${
            className || ''
          }`}
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">
            You&apos;re offline - viewing cached data
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
