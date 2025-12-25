'use client';

/**
 * DraftSavedIndicator Component
 *
 * Small indicator that appears briefly when a draft is auto-saved.
 * Auto-hides after 2 seconds. Used in ConstraintPanel and ExploreAlternativesPanel
 * to give feedback when in-progress responses are saved to Zustand store.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface DraftSavedIndicatorProps {
  /**
   * Trigger counter - increment to show indicator.
   * Each increment triggers a new show/hide cycle.
   * Use 0 to keep hidden initially.
   */
  trigger: number;
}

const AUTO_HIDE_DELAY = 2000; // 2 seconds

/**
 * Small indicator that appears briefly when draft is saved.
 * Auto-hides after 2 seconds.
 *
 * Uses a trigger counter pattern: each increment shows the indicator,
 * then it auto-hides. This ensures repeated saves all show feedback.
 */
export function DraftSavedIndicator({ trigger }: DraftSavedIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show on initial mount (trigger=0)
    if (trigger === 0) return;

    // Defer setState to next frame to avoid synchronous update during effect
    const showFrame = requestAnimationFrame(() => setShow(true));
    const hideTimer = setTimeout(() => setShow(false), AUTO_HIDE_DELAY);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(hideTimer);
    };
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.span
          data-testid="draft-saved-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <svg
            className="h-3 w-3 text-success"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Draft saved
        </motion.span>
      )}
    </AnimatePresence>
  );
}
