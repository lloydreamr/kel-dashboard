import { useEffect, useRef, useState } from 'react';

import type { SyncStatus } from '@/components/queue/SyncStatusIndicator';

/**
 * Props for useSyncIndicator hook.
 * These come directly from TanStack Query mutation state.
 */
export interface UseSyncIndicatorProps {
  /** Whether the mutation is in progress */
  isPending: boolean;
  /** Whether the mutation succeeded */
  isSuccess: boolean;
  /** Whether the mutation failed */
  isError: boolean;
}

/**
 * Return value from useSyncIndicator hook.
 */
export interface UseSyncIndicatorResult {
  /** Current sync status for the indicator */
  status: SyncStatus;
  /** Trigger counter - increments on each state change to trigger indicator */
  trigger: number;
}

/**
 * Derive SyncStatus from mutation state.
 * Priority: isPending > isError > isSuccess > idle
 */
function deriveStatus(isPending: boolean, isSuccess: boolean, isError: boolean): SyncStatus {
  if (isPending) return 'saving';
  if (isError) return 'error';
  if (isSuccess) return 'success';
  return 'idle';
}

/**
 * useSyncIndicator - Converts TanStack Query mutation state to SyncStatus.
 *
 * Takes isPending, isSuccess, isError from a mutation and returns:
 * - status: 'idle' | 'saving' | 'success' | 'error'
 * - trigger: counter that increments on each state change
 *
 * The trigger counter is used to re-trigger the SyncStatusIndicator
 * animations for each new operation.
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isSuccess, isError } = useApproveDecision();
 * const { status, trigger } = useSyncIndicator({ isPending, isSuccess, isError });
 *
 * return <SyncStatusIndicator status={status} trigger={trigger} />;
 * ```
 */
/** Duration in ms before success status auto-hides */
const SUCCESS_AUTO_HIDE_MS = 1000;

export function useSyncIndicator({
  isPending,
  isSuccess,
  isError,
}: UseSyncIndicatorProps): UseSyncIndicatorResult {
  const [trigger, setTrigger] = useState(0);
  const [successHidden, setSuccessHidden] = useState(false);
  const prevStatusRef = useRef<SyncStatus>('idle');

  const rawStatus = deriveStatus(isPending, isSuccess, isError);

  // Apply auto-hide: if success is hidden, return idle instead
  const status = rawStatus === 'success' && successHidden ? 'idle' : rawStatus;

  // Auto-hide success after 1 second
  // Use queueMicrotask to satisfy React Compiler lint rule
  useEffect(() => {
    if (rawStatus === 'success') {
      const timer = setTimeout(() => {
        queueMicrotask(() => setSuccessHidden(true));
      }, SUCCESS_AUTO_HIDE_MS);

      return () => clearTimeout(timer);
    } else {
      // Reset hidden state when leaving success
      queueMicrotask(() => setSuccessHidden(false));
    }
  }, [rawStatus]);

  // Increment trigger when status changes from idle to non-idle,
  // or when transitioning between non-idle states.
  // Use queueMicrotask to satisfy React Compiler lint rule about
  // synchronous setState in effects (this defers to next microtask).
  useEffect(() => {
    const prevStatus = prevStatusRef.current;

    // Only increment if:
    // 1. Moving from idle to a non-idle state
    // 2. Or moving between different non-idle states
    if (status !== prevStatus && status !== 'idle') {
      queueMicrotask(() => setTrigger((t) => t + 1));
    }

    prevStatusRef.current = status;
  }, [status]);

  return { status, trigger };
}
