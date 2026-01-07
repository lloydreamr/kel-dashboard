/**
 * Pitch Mode Store
 *
 * Zustand store for pitch mode state.
 * Used by DashboardContent to control sidebar/nav visibility
 * when pitch mode is active.
 *
 * The URL query param `?mode=pitch` is the source of truth,
 * but we sync to this store so Server Component wrappers can access it.
 *
 * @see usePitchMode hook for URL-to-store sync
 */

import { create } from 'zustand';

interface PitchModeState {
  // Whether pitch mode is currently active
  isPitchMode: boolean;
}

interface PitchModeActions {
  // Set pitch mode state (synced from URL via usePitchMode hook)
  setIsPitchMode: (value: boolean) => void;
}

type PitchModeStore = PitchModeState & PitchModeActions;

export const usePitchModeStore = create<PitchModeStore>()((set) => ({
  // Initial state - will be synced from URL on mount
  isPitchMode: false,

  // Actions
  setIsPitchMode: (value) => set({ isPitchMode: value }),
}));

// Export types for consumers
export type { PitchModeState, PitchModeActions, PitchModeStore };
