/**
 * Queue Store
 *
 * Zustand store for client-side queue UI state.
 * Manages which card is expanded and draft responses.
 *
 * This is the first Zustand store in the project - it manages UI state
 * separate from server state (which is handled by TanStack Query).
 */

import { create } from 'zustand';

interface DraftResponse {
  decision_type?: 'approved' | 'approved_with_constraint' | 'explore_alternatives';
  constraints?: { type: string; context?: string }[];
  constraint_context?: string; // General context for constraints (separate from per-constraint context)
  reasoning?: string;
  lastModified: number; // timestamp for auto-save
}

interface QueueState {
  // Which card is currently expanded (null = none)
  expandedCardId: string | null;

  // Draft responses for questions (for auto-save, Story 4.11)
  draftResponses: Record<string, DraftResponse>;
}

interface QueueActions {
  // Expand a card (collapses any currently expanded)
  expandCard: (cardId: string) => void;

  // Collapse the currently expanded card
  collapseCard: () => void;

  // Toggle card expansion
  toggleCard: (cardId: string) => void;

  // Set draft response for a question
  setDraftResponse: (questionId: string, draft: Partial<DraftResponse>) => void;

  // Clear draft response (after successful submit)
  clearDraftResponse: (questionId: string) => void;

  // Clear all drafts (on logout)
  clearAllDrafts: () => void;
}

type QueueStore = QueueState & QueueActions;

export const useQueueStore = create<QueueStore>()((set) => ({
  // Initial state
  expandedCardId: null,
  draftResponses: {},

  // Actions
  expandCard: (cardId) => set({ expandedCardId: cardId }),

  collapseCard: () => set({ expandedCardId: null }),

  toggleCard: (cardId) =>
    set((state) => ({
      expandedCardId: state.expandedCardId === cardId ? null : cardId,
    })),

  setDraftResponse: (questionId, draft) =>
    set((state) => ({
      draftResponses: {
        ...state.draftResponses,
        [questionId]: {
          ...state.draftResponses[questionId],
          ...draft,
          lastModified: Date.now(),
        },
      },
    })),

  clearDraftResponse: (questionId) =>
    set((state) => {
      const newDrafts = { ...state.draftResponses };
      delete newDrafts[questionId];
      return { draftResponses: newDrafts };
    }),

  clearAllDrafts: () => set({ draftResponses: {} }),
}));

// Export types for consumers
export type { DraftResponse, QueueState, QueueActions, QueueStore };
