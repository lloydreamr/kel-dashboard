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

import { usePitchModeStore } from '@/stores/pitchMode';

interface UsePitchModeReturn {
  /** Whether pitch mode is currently active */
  isPitchMode: boolean;
  /** Navigate to pitch mode (`/visualization?mode=pitch`) */
  enterPitchMode: () => void;
  /** Exit pitch mode (navigate to `/visualization`) */
  exitPitchMode: () => void;
}

export function usePitchMode(): UsePitchModeReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setIsPitchMode = usePitchModeStore((s) => s.setIsPitchMode);

  // Read pitch mode from URL query param
  const isPitchMode = searchParams.get('mode') === 'pitch';

  // CRITICAL: Sync URL state to Zustand store for layout visibility
  // This runs on every URL change (including browser back/forward)
  useEffect(() => {
    setIsPitchMode(isPitchMode);
  }, [isPitchMode, setIsPitchMode]);

  const enterPitchMode = () => {
    router.push('/visualization?mode=pitch', { scroll: false });
  };

  const exitPitchMode = () => {
    router.push('/visualization', { scroll: false });
  };

  return { isPitchMode, enterPitchMode, exitPitchMode };
}
