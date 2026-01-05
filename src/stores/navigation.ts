/**
 * Navigation Store
 *
 * Zustand store for mobile navigation drawer state.
 * Manages open/close state for the mobile hamburger menu.
 *
 * Following the queue.ts pattern for consistency.
 */

import { create } from 'zustand';

interface NavigationState {
  // Whether the mobile nav drawer is open
  isOpen: boolean;
}

interface NavigationActions {
  // Open the mobile nav drawer
  open: () => void;

  // Close the mobile nav drawer
  close: () => void;

  // Toggle the mobile nav drawer
  toggle: () => void;
}

type NavigationStore = NavigationState & NavigationActions;

export const useNavigationStore = create<NavigationStore>()((set) => ({
  // Initial state
  isOpen: false,

  // Actions
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

// Export types for consumers
export type { NavigationState, NavigationActions, NavigationStore };
