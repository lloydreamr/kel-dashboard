'use client';

/**
 * SyncIndicator Component
 *
 * Displays sync status with a colored dot indicator and refresh button.
 * Shows time since last sync in a tooltip on hover/tap.
 * Respects the OFFLINE_READ feature flag.
 *
 * Story 10.4: Offline Detection & Sync Indicator (Task 2)
 *
 * Colors:
 * - Green: Data is fresh (synced within 1 minute)
 * - Yellow: Data is stale (synced more than 1 minute ago)
 * - Gray: Device is offline
 *
 * @example
 * ```tsx
 * <SyncIndicator onRefresh={handleRefresh} />
 * ```
 */

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSyncStatus } from '@/hooks/offline';
import { ANIMATION } from '@/lib/constants/animations';
import { FEATURES } from '@/lib/features';
import { cn } from '@/lib/utils';

import type { SyncState } from '@/hooks/offline';

export interface SyncIndicatorProps {
  /** Callback when refresh button is clicked. If not provided, refresh button is hidden. */
  onRefresh?: () => Promise<void> | void;
  /** Optional className for custom styling */
  className?: string;
}

/** Color mapping for sync states */
const SYNC_COLORS: Record<SyncState, string> = {
  fresh: 'bg-green-500',
  stale: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

/** Test ID mapping for sync states (per AC#1-3) */
const SYNC_TEST_IDS: Record<SyncState, string> = {
  fresh: 'sync-indicator-online',
  stale: 'sync-indicator-stale',
  offline: 'sync-indicator-offline',
};

/** Label mapping for sync states */
const SYNC_LABELS: Record<SyncState, string> = {
  fresh: 'Synced',
  stale: 'Last synced',
  offline: 'Offline',
};

/**
 * SyncIndicator - Visual indicator for data sync status.
 *
 * Features:
 * - Colored dot showing sync freshness (green/yellow/gray)
 * - Tooltip showing time since last sync
 * - Optional refresh button with 48px touch target
 * - Animated state transitions via Framer Motion
 *
 * Per AC#1: Shows sync status immediately on app load
 * Per AC#2: Includes refresh button with proper touch target
 * Per AC#3: Updates when online status changes
 * Per AC#5: Clearly shows when data might be stale
 */
export function SyncIndicator({ onRefresh, className }: SyncIndicatorProps) {
  const { syncState, timeSinceSync } = useSyncStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Don't render if feature flag is disabled
  if (!FEATURES.OFFLINE_READ) {
    return null;
  }

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing || syncState === 'offline') return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing, syncState]);

  const tooltipText =
    syncState === 'offline'
      ? 'Offline - viewing cached data'
      : `${SYNC_LABELS[syncState]}: ${timeSinceSync}`;

  return (
    <TooltipProvider>
      <div
        data-testid="sync-indicator"
        aria-live="polite"
        aria-label={tooltipText}
        className={cn('flex items-center gap-2', className)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-default">
              <AnimatePresence mode="wait">
                <motion.div
                  key={syncState}
                  data-testid={SYNC_TEST_IDS[syncState]}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={ANIMATION.fade}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    SYNC_COLORS[syncState]
                  )}
                  aria-hidden="true"
                />
              </AnimatePresence>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {syncState === 'offline' ? 'Offline' : timeSinceSync}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>

        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={syncState === 'offline' || isRefreshing}
            aria-label="Refresh data"
            data-testid="sync-refresh-button"
            className="h-12 w-12"
          >
            <RefreshCw
              className={cn('h-5 w-5', isRefreshing && 'animate-spin')}
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
