'use client';

/**
 * @fileoverview Swipeable content wrapper for mobile bottom sheets
 *
 * Provides swipe-to-dismiss functionality using Framer Motion.
 * Wraps content in a draggable container with visual feedback.
 *
 * Story 10.2: Mobile Touch Interactions
 *
 * @example
 * <SwipeableSheetContent onDismiss={() => setOpen(false)}>
 *   <p>Sheet content here</p>
 * </SwipeableSheetContent>
 */

import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

import { ANIMATION } from '@/lib/constants/animations';

import type { ReactNode } from 'react';

/** Pixels of downward movement required to trigger dismiss */
export const SWIPE_THRESHOLD = 50;

/** Velocity (px/s) that triggers dismiss regardless of distance */
export const SWIPE_VELOCITY_THRESHOLD = 500;

interface SwipeableSheetContentProps {
  /** Content to render inside the swipeable container */
  children: ReactNode;
  /** Callback fired when swipe gesture completes dismiss */
  onDismiss: () => void;
}

export function SwipeableSheetContent({ children, onDismiss }: SwipeableSheetContentProps) {
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Visual feedback - opacity decreases as user swipes down
  const opacity = useTransform(y, [0, 100], [1, 0.5]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    // Dismiss if dragged past threshold OR if velocity is high enough
    if (info.offset.y > SWIPE_THRESHOLD || info.velocity.y > SWIPE_VELOCITY_THRESHOLD) {
      controls
        .start({ y: '100%', opacity: 0, transition: ANIMATION.slideIn })
        .then(onDismiss);
    } else {
      // Snap back with spring animation
      controls.start({ y: 0, opacity: 1, transition: ANIMATION.slideIn });
    }
  };

  return (
    <motion.div
      data-testid="swipeable-content"
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ y, opacity }}
    >
      {/* Drag handle - visual indicator for swipe gesture */}
      <div
        data-testid="viz-modal-swipe-handle"
        className="mx-auto mt-2 mb-4 h-1 w-12 rounded-full bg-muted-foreground/30"
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
}
