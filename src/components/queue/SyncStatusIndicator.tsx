'use client';

/**
 * SyncStatusIndicator Component
 *
 * Displays visual sync feedback for decision actions.
 * Shows saving, success, or error states with appropriate icons.
 * Error state includes optional retry button.
 *
 * Story 4-12: Sync Status Indicator (Online-First)
 */

import { AnimatePresence, motion } from 'framer-motion';

import { ANIMATION } from '@/lib/constants/animations';

/**
 * Sync status values for the indicator.
 */
export type SyncStatus = 'idle' | 'saving' | 'success' | 'error';

export interface SyncStatusIndicatorProps {
  /** Current sync status */
  status: SyncStatus;
  /**
   * Trigger counter - increment to show indicator.
   * Use 0 to hide initially. Only shows when trigger > 0 AND status !== 'idle'.
   */
  trigger: number;
  /** Optional retry callback for error state */
  onRetry?: () => void;
}

/**
 * Spinner icon for saving state.
 */
function SpinnerIcon() {
  return (
    <svg
      data-testid="sync-spinner"
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Checkmark icon for success state.
 */
function CheckmarkIcon() {
  return (
    <svg
      data-testid="sync-checkmark"
      className="h-4 w-4"
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
 * Error icon for error state.
 */
function ErrorIcon() {
  return (
    <svg
      data-testid="sync-error-icon"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/**
 * Get the appropriate color class for the status.
 */
function getStatusColor(status: SyncStatus): string {
  switch (status) {
    case 'saving':
      return 'text-muted-foreground';
    case 'success':
      return 'text-success';
    case 'error':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Get the text label for the status.
 */
function getStatusText(status: SyncStatus): string {
  switch (status) {
    case 'saving':
      return 'Saving...';
    case 'success':
      return 'Saved';
    case 'error':
      return '⚠ Retry';
    default:
      return '';
  }
}

/**
 * Get the icon component for the status.
 */
function getStatusIcon(status: SyncStatus): React.ReactNode {
  switch (status) {
    case 'saving':
      return <SpinnerIcon />;
    case 'success':
      return <CheckmarkIcon />;
    case 'error':
      return <ErrorIcon />;
    default:
      return null;
  }
}

/**
 * SyncStatusIndicator - Visual feedback for sync operations.
 *
 * Shows appropriate state (saving, success, error) with icons and text.
 * Error state includes optional retry button with 48px touch target.
 * Uses AnimatePresence for smooth transitions between states.
 *
 * @example
 * ```tsx
 * <SyncStatusIndicator
 *   status={syncStatus}
 *   trigger={syncTrigger}
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function SyncStatusIndicator({
  status,
  trigger,
  onRetry,
}: SyncStatusIndicatorProps) {
  // Don't render if idle or trigger is 0 (initial state)
  const shouldShow = trigger > 0 && status !== 'idle';

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          key={status}
          data-testid="sync-status-indicator"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={ANIMATION.fade}
          className={`inline-flex items-center gap-2 text-sm ${getStatusColor(status)}`}
        >
          {getStatusIcon(status)}
          <span>{getStatusText(status)}</span>

          {status === 'error' && onRetry && (
            <button
              type="button"
              data-testid="sync-retry-button"
              aria-label="Retry sync"
              onClick={onRetry}
              className="min-h-[48px] px-3 py-2 rounded-md text-destructive hover:bg-destructive/10
                active:scale-[0.98] transition-all focus:outline-none focus:ring-2
                focus:ring-destructive focus:ring-offset-2"
            >
              Retry
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
