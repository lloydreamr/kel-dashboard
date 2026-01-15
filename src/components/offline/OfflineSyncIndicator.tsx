'use client';

/**
 * OfflineSyncIndicator Component
 *
 * Displays per-item sync status for actions queued in the offline queue.
 * Shows different icons and colors based on sync status:
 * - synced (✓): Green checkmark - successfully saved to server
 * - pending (↻): Gray animated spinner - waiting to sync
 * - retry (⚠): Amber warning - failed, will retry automatically
 * - conflict (✗): Red X - conflict detected, needs resolution
 *
 * IMPORTANT: This is DIFFERENT from SyncStatusIndicator in components/queue/
 * which is for online-first immediate sync (Story 4-12).
 * This component is for offline queue item status (Story 8.6).
 *
 * @see Story 8.6: Full Sync Status Indicators
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FEATURES } from '@/lib/features';
import { cn } from '@/lib/utils';

/**
 * Sync status for offline queue items.
 *
 * - synced: Item successfully saved to server (not in queue)
 * - pending: Waiting to sync (in queue with pending/syncing status)
 * - retry: Failed sync attempt, will retry (in queue with failed status)
 * - conflict: Conflict detected, needs manual resolution
 */
export type OfflineSyncStatus = 'synced' | 'pending' | 'retry' | 'conflict';

export interface OfflineSyncIndicatorProps {
  /** Current sync status of the item */
  status: OfflineSyncStatus;
  /** Callback when conflict indicator is clicked/tapped */
  onConflictClick?: () => void;
}

/**
 * Tooltip text for each status.
 * Per Story 8.6 Dev Notes - Tooltip Content section.
 */
const TOOLTIP_TEXT: Record<OfflineSyncStatus, string> = {
  synced: 'Saved to server',
  pending: 'Waiting to sync',
  retry: 'Sync failed. Will retry automatically.',
  conflict: 'Conflict detected. Tap to resolve.',
};

/**
 * Synced icon - green checkmark.
 * Per AC1: ✓ synced (green)
 */
function SyncedIcon() {
  return (
    <svg
      data-testid="sync-indicator-synced"
      className="h-4 w-4 text-success"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Pending icon - gray spinning refresh icon.
 * Per AC1: ↻ pending (gray, animated)
 */
function PendingIcon() {
  return (
    <svg
      data-testid="sync-indicator-pending"
      className="h-4 w-4 text-muted-foreground animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      {/* Refresh/rotate icon */}
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

/**
 * Retry icon - amber warning triangle.
 * Per AC1: ⚠ retry (amber)
 */
function RetryIcon() {
  return (
    <svg
      data-testid="sync-indicator-retry"
      className="h-4 w-4 text-warning"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      {/* Warning triangle */}
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Conflict icon - red X in circle.
 * Per AC1: ✗ conflict (red)
 */
function ConflictIcon() {
  return (
    <svg
      data-testid="sync-indicator-conflict"
      className="h-4 w-4 text-destructive"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      {/* X in circle */}
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

/**
 * Get the appropriate icon component for the status.
 */
function getStatusIcon(status: OfflineSyncStatus): React.ReactNode {
  switch (status) {
    case 'synced':
      return <SyncedIcon />;
    case 'pending':
      return <PendingIcon />;
    case 'retry':
      return <RetryIcon />;
    case 'conflict':
      return <ConflictIcon />;
  }
}

/**
 * Get aria-label for the status indicator.
 */
function getAriaLabel(status: OfflineSyncStatus): string {
  switch (status) {
    case 'synced':
      return 'Synced to server';
    case 'pending':
      return 'Waiting to sync';
    case 'retry':
      return 'Sync failed, will retry';
    case 'conflict':
      return 'Conflict detected, tap to resolve';
  }
}

/**
 * OfflineSyncIndicator - Per-item sync status indicator for offline queue.
 *
 * Per Story 8.6 Acceptance Criteria:
 * - AC1: Shows sync status indicator with semantic meaning (synced/pending/retry/conflict)
 * - AC2: Tooltip shows "Waiting to sync" for pending items
 * - AC3: Conflict indicator opens ConflictDialog when tapped
 * - AC4: All indicators have data-testid attributes
 * - AC5: Returns null when OFFLINE_MODE feature flag is disabled
 *
 * @example
 * ```tsx
 * // In a queue item:
 * <OfflineSyncIndicator
 *   status="pending"
 *   onConflictClick={() => setShowConflictDialog(true)}
 * />
 * ```
 */
export function OfflineSyncIndicator({
  status,
  onConflictClick,
}: OfflineSyncIndicatorProps) {
  // AC5: Feature flag guard - return null when offline mode is disabled
  if (!FEATURES.OFFLINE_MODE) {
    return null;
  }

  const isConflict = status === 'conflict';

  // Conflict indicator is a button for interactivity (AC3)
  if (isConflict) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent parent click handlers
                onConflictClick?.();
              }}
              role="status"
              aria-label={getAriaLabel(status)}
              className={cn(
                'inline-flex items-center justify-center',
                // 48px touch target per accessibility requirements
                'min-h-12 min-w-12 p-2',
                'rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'hover:bg-destructive/10 active:bg-destructive/20',
                'transition-colors'
              )}
            >
              {getStatusIcon(status)}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{TOOLTIP_TEXT[status]}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Non-interactive status indicator with tooltip (AC2)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="status"
            aria-label={getAriaLabel(status)}
            className="inline-flex items-center justify-center p-2"
          >
            {getStatusIcon(status)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{TOOLTIP_TEXT[status]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
