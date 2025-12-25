'use client';

/**
 * UndoToast Component
 *
 * Custom toast component with visual countdown progress bar.
 * Shows success message with an Undo button that's available for 5 seconds.
 * Progress bar visually counts down the remaining time.
 *
 * Requirements: AC1, AC2, AC3 from Story 4.13
 */

import { useEffect, useRef, useState } from 'react';

/** Undo window duration in milliseconds (5 seconds) */
export const UNDO_WINDOW_MS = 5000;

/** Interval for updating the progress bar (100ms for smooth animation) */
const UPDATE_INTERVAL_MS = 100;

export interface UndoToastProps {
  /** Success message to display */
  message: string;
  /** Callback when Undo button is clicked */
  onUndo: () => void;
  /** Callback when toast should dismiss (after countdown or manual) */
  onDismiss: () => void;
}

/**
 * Toast component with countdown progress bar and Undo action.
 *
 * @example
 * ```tsx
 * <UndoToast
 *   message="Approved!"
 *   onUndo={() => undoDecision({ decisionId, questionId })}
 *   onDismiss={() => toast.dismiss(toastId)}
 * />
 * ```
 */
export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  const [timeRemaining, setTimeRemaining] = useState(UNDO_WINDOW_MS);
  const [isUndoing, setIsUndoing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track whether dismiss has been called to prevent double-calls
  const dismissedRef = useRef(false);

  // Handle undo click with double-click protection
  const handleUndo = () => {
    if (isUndoing) return;
    setIsUndoing(true);
    onUndo();
  };

  // Auto-dismiss after UNDO_WINDOW_MS
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - UPDATE_INTERVAL_MS;
        if (newTime <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return newTime;
      });
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Separate effect to handle dismiss when time reaches 0
  useEffect(() => {
    if (timeRemaining <= 0 && !dismissedRef.current) {
      dismissedRef.current = true;
      onDismiss();
    }
  }, [timeRemaining, onDismiss]);

  const progressPercent = (timeRemaining / UNDO_WINDOW_MS) * 100;

  return (
    <div
      data-testid="undo-toast"
      className="flex items-center gap-3 rounded-lg bg-success p-4 text-success-foreground shadow-lg"
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {/* Progress bar container */}
        <div
          data-testid="undo-progress-bar"
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-success-foreground/20"
        >
          {/* Progress bar fill - shrinks from 100% to 0% */}
          <div
            className="h-full bg-success-foreground transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        data-testid="undo-button"
        onClick={handleUndo}
        disabled={isUndoing}
        className="min-h-[48px] rounded-md bg-success-foreground/20 px-4 py-2 text-sm font-medium
          hover:bg-success-foreground/30 focus:outline-none focus:ring-2 focus:ring-success-foreground focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUndoing ? 'Undoing...' : 'Undo'}
      </button>
    </div>
  );
}
