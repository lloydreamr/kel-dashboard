'use client';

/**
 * ConflictDialog Component
 *
 * Displays a dialog when a sync conflict is detected between an offline action
 * and server state. Shows both versions side-by-side with timestamps and
 * provides resolution options.
 *
 * Features:
 * - Displays "Your Version" (offline action) and "Server Version" (current state)
 * - Shows timestamp comparison
 * - Provides three resolution buttons: Keep Mine, Keep Server, Cancel
 * - Auto-resolves to "Keep Server" after 30 seconds (configurable)
 * - Accessible with proper ARIA attributes
 *
 * @see Story 8.4: AC2 - ConflictDialog Display
 * @see Story 8.4: AC3 - User Resolution Options
 * @see Story 8.4: AC4 - Server-Wins Default
 */

import { AlertTriangle } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FEATURES } from '@/lib/features';
import { CONFLICT_CONFIG } from '@/lib/sync';
import { cn } from '@/lib/utils';

import type { ConflictData, ConflictResolution } from '@/lib/sync';

/**
 * Props for ConflictDialog component.
 */
export interface ConflictDialogProps {
  /** The conflict data to display. If null, dialog is closed. */
  conflict: ConflictData | null;
  /** Callback when user selects a resolution */
  onResolve: (resolution: ConflictResolution) => void;
  /** Whether resolution is in progress (disables buttons) */
  isResolving?: boolean;
  /** Auto-resolve timeout in milliseconds. Defaults to CONFLICT_CONFIG.AUTO_RESOLVE_TIMEOUT_MS */
  autoResolveTimeoutMs?: number;
}

/**
 * Maps offline action types to human-readable labels.
 */
const ACTION_LABELS: Record<string, string> = {
  approve: 'Approved',
  approve_with_constraint: 'Approved with Constraint',
  explore_alternatives: 'Explore Alternatives',
};

/**
 * Formats a timestamp for display.
 * Shows date and time in user's locale.
 */
function formatTimestamp(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * ConflictDialog - Modal for resolving sync conflicts.
 *
 * Per AC#2: Shows both versions with timestamps
 * Per AC#3: Provides Keep Mine, Keep Server, Cancel options
 * Per AC#4: Auto-resolves to server after timeout
 */
export function ConflictDialog({
  conflict,
  onResolve,
  isResolving = false,
  autoResolveTimeoutMs = CONFLICT_CONFIG.AUTO_RESOLVE_TIMEOUT_MS,
}: ConflictDialogProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.ceil(autoResolveTimeoutMs / 1000)
  );

  // Reset timer when conflict changes
  useEffect(() => {
    if (conflict) {
      setSecondsRemaining(Math.ceil(autoResolveTimeoutMs / 1000));
    }
  }, [conflict, autoResolveTimeoutMs]);

  // Countdown timer
  useEffect(() => {
    if (!conflict || isResolving) return;

    const intervalId = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Auto-resolve to server wins
          onResolve(CONFLICT_CONFIG.DEFAULT_RESOLUTION);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [conflict, isResolving, onResolve]);

  const handleResolve = useCallback(
    (resolution: ConflictResolution) => {
      if (!isResolving) {
        onResolve(resolution);
      }
    },
    [isResolving, onResolve]
  );

  // Don't render if feature flag is disabled
  if (!FEATURES.OFFLINE_MODE) {
    return null;
  }

  const isOpen = conflict !== null;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent
        data-testid="conflict-dialog"
        className="max-w-md"
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
            <AlertDialogTitle>Data Conflict Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Your offline decision conflicts with changes made on the server.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {conflict && (
          <div className="space-y-4 py-4">
            {/* Your Version (Offline) */}
            <div
              data-testid="conflict-your-version"
              className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950"
            >
              <h4 className="mb-2 font-semibold text-blue-700 dark:text-blue-300">
                YOUR VERSION (Offline)
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Action:</span>{' '}
                  <span className="font-medium">
                    {ACTION_LABELS[conflict.offlineAction.action] || conflict.offlineAction.action}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  <span className="font-medium">
                    {formatTimestamp(conflict.offlineAction.createdAt)}
                  </span>
                </p>
                {conflict.offlineAction.payload.constraints &&
                  conflict.offlineAction.payload.constraints.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Constraints:</span>{' '}
                    <span className="font-medium">
                      {conflict.offlineAction.payload.constraints
                        .map((c) => c.type + (c.context ? `: ${c.context}` : ''))
                        .join(', ')}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Server Version (Current) */}
            <div
              data-testid="conflict-server-version"
              className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950"
            >
              <h4 className="mb-2 font-semibold text-green-700 dark:text-green-300">
                SERVER VERSION (Current)
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className="font-medium capitalize">
                    {conflict.serverState.status?.replace(/_/g, ' ') || 'Unknown'}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Updated:</span>{' '}
                  <span className="font-medium">
                    {formatTimestamp(conflict.serverState.updated_at)}
                  </span>
                </p>
              </div>
            </div>

            {/* Auto-resolve countdown */}
            <p
              data-testid="conflict-countdown"
              className={cn(
                'text-center text-sm',
                secondsRemaining <= 10 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'
              )}
            >
              Auto-resolving in {secondsRemaining} second{secondsRemaining !== 1 ? 's' : ''}...
            </p>
          </div>
        )}

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            data-testid="conflict-keep-mine"
            variant="outline"
            onClick={() => handleResolve('keep-mine')}
            disabled={isResolving}
            className="w-full sm:w-auto"
          >
            Keep Mine
          </Button>
          <Button
            data-testid="conflict-keep-server"
            variant="default"
            onClick={() => handleResolve('keep-server')}
            disabled={isResolving}
            className="w-full sm:w-auto"
          >
            Keep Server
          </Button>
          <Button
            data-testid="conflict-cancel"
            variant="ghost"
            onClick={() => handleResolve('cancel')}
            disabled={isResolving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
