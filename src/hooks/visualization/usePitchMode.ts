/**
 * usePitchMode Hook
 *
 * URL-driven pitch mode state management.
 * Reads `?mode=pitch` from URL and syncs to Zustand store.
 *
 * The URL is the source of truth for pitch mode state.
 * The store sync enables DashboardContent (Client Component wrapper)
 * to hide sidebar/nav when pitch mode is active.
 *
 * Story 17.3: Updated to use Market Intelligence route
 * Routes now point to /market-intelligence/visualization
 *
 * @example
 * ```tsx
 * const { isPitchMode, enterPitchMode, exitPitchMode } = usePitchMode();
 *
 * if (isPitchMode) {
 *   return <PitchModeView />;
 * }
 * ```
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useMountedRef } from '@/hooks/utils/useMountedRef';
import { usePitchModeStore } from '@/stores/pitchMode';

interface UsePitchModeReturn {
  /** Whether pitch mode is currently active */
  isPitchMode: boolean;
  /** Navigate to pitch mode (`/market-intelligence/visualization?mode=pitch`) */
  enterPitchMode: () => void;
  /** Exit pitch mode (navigate to `/market-intelligence/visualization`) */
  exitPitchMode: () => void;
}

export function usePitchMode(): UsePitchModeReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setIsPitchMode = usePitchModeStore((s) => s.setIsPitchMode);
  const { isMounted } = useMountedRef();

  // Read pitch mode from URL query param
  const isPitchMode = searchParams.get('mode') === 'pitch';

  // CRITICAL: Sync URL state to Zustand store for layout visibility
  // This runs on every URL change (including browser back/forward)
  useEffect(() => {
    setIsPitchMode(isPitchMode);
  }, [isPitchMode, setIsPitchMode]);

  // BUG-009 Fix: Only navigate if component is still mounted (consistency with other hooks)
  // Story 17.3: Routes updated from /visualization to /market-intelligence/visualization
  const enterPitchMode = () => {
    if (isMounted()) {
      router.push('/market-intelligence/visualization?mode=pitch', { scroll: false });
    }
  };

  // Story 17.3: Exit navigates to /market-intelligence/visualization (removes ?mode=pitch)
  const exitPitchMode = () => {
    if (isMounted()) {
      router.push('/market-intelligence/visualization', { scroll: false });
    }
  };

  return { isPitchMode, enterPitchMode, exitPitchMode };
}
