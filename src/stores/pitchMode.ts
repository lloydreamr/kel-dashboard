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
 * Story 11.2: Added PDF export callback registration to bridge
 * between VisualizationPageClient (has competitor data) and
 * DashboardContent (renders PitchModeHeader).
 *
 * @see usePitchMode hook for URL-to-store sync
 */

import { create } from 'zustand';

interface PitchModeState {
  /** Whether pitch mode is currently active */
  isPitchMode: boolean;
  /** Whether PDF is currently being generated */
  isGeneratingPdf: boolean;
  /** Callback to trigger PDF download (registered by VisualizationPageClient) */
  onDownloadPdf: (() => void) | null;
}

interface PitchModeActions {
  /** Set pitch mode state (synced from URL via usePitchMode hook) */
  setIsPitchMode: (value: boolean) => void;
  /** Set PDF generating state */
  setIsGeneratingPdf: (value: boolean) => void;
  /** Register PDF download callback (called by VisualizationPageClient) */
  registerPdfDownload: (callback: () => void) => void;
  /** Unregister PDF download callback (cleanup) */
  unregisterPdfDownload: () => void;
}

type PitchModeStore = PitchModeState & PitchModeActions;

export const usePitchModeStore = create<PitchModeStore>()((set) => ({
  // Initial state - will be synced from URL on mount
  isPitchMode: false,
  isGeneratingPdf: false,
  onDownloadPdf: null,

  // Actions
  setIsPitchMode: (value) => set({ isPitchMode: value }),
  setIsGeneratingPdf: (value) => set({ isGeneratingPdf: value }),
  registerPdfDownload: (callback) => set({ onDownloadPdf: callback }),
  unregisterPdfDownload: () => set({ onDownloadPdf: null }),
}));

// Export types for consumers
export type { PitchModeState, PitchModeActions, PitchModeStore };
