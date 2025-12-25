/**
 * Animation Constants
 *
 * Centralized animation timings from UX spec.
 * All animations must use these constants - never inline values.
 * Per AR11 (Animation constants requirement).
 */

/**
 * Transition configurations for common animations.
 */
export const ANIMATION = {
  /**
   * Expand animation - used for expanding cards, panels, modals.
   * Duration: 0.2s (per UX spec)
   */
  expand: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    duration: 0.2,
  },

  /**
   * Collapse animation - used for collapsing cards, panels.
   * Duration: 0.15s (per UX spec) - faster than expand for snappy feel.
   */
  collapse: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    duration: 0.15,
  },

  /**
   * Fade animation - used for opacity transitions.
   */
  fade: {
    duration: 0.15,
  },

  /**
   * Celebration animation - used for approval celebration.
   * Duration: 0.6s for checkmark scale-in with ease-out curve.
   */
  celebration: {
    duration: 0.6,
    ease: [0, 0.55, 0.45, 1], // Ease out cubic
  },

  /**
   * Card exit animation - used when card leaves queue.
   * Duration: 0.2s with easeIn for smooth exit.
   */
  cardExit: {
    duration: 0.2,
    ease: [0.4, 0, 1, 1], // Ease in
  },
} as const;

/**
 * Easing presets.
 */
export const EASING = {
  /** Default ease for most animations */
  default: [0.4, 0, 0.2, 1],
  /** Ease for elements entering view */
  easeOut: [0, 0, 0.2, 1],
  /** Ease for elements leaving view */
  easeIn: [0.4, 0, 1, 1],
} as const;

export type AnimationKey = keyof typeof ANIMATION;
export type EasingKey = keyof typeof EASING;
