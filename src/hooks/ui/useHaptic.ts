/**
 * Hook for triggering haptic feedback on touch devices.
 *
 * Uses the Vibration API when available, with graceful fallback
 * for unsupported browsers (notably iPad Safari).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */

import { useCallback } from 'react';

/**
 * Haptic feedback types with corresponding vibration patterns.
 * Patterns are in milliseconds.
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 20, // Single short vibration - for approve
  medium: 40, // Slightly longer - for approve with constraint
  heavy: 80, // Strong feedback - for important actions
  success: [20, 50, 20], // Double pulse - for success confirmation
  warning: [40, 30, 40], // Double pulse with longer vibration - for warning
};

export interface UseHapticResult {
  /**
   * Trigger haptic feedback with the specified type.
   * No-op if Vibration API is unsupported.
   */
  trigger: (type: HapticType) => void;

  /**
   * Whether haptic feedback is supported on this device.
   */
  isSupported: boolean;
}

/**
 * Hook for triggering haptic feedback on touch devices.
 *
 * @example
 * ```tsx
 * const { trigger } = useHaptic();
 *
 * const handleApprove = () => {
 *   trigger('light');
 *   // ... approve logic
 * };
 * ```
 */
export function useHaptic(): UseHapticResult {
  const isSupported =
    typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = useCallback(
    (type: HapticType) => {
      if (!isSupported) return;

      const pattern = HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.light;

      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently ignore vibration errors (can occur in restricted contexts)
      }
    },
    [isSupported]
  );

  return { trigger, isSupported };
}
