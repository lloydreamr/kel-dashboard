'use client';

/**
 * useRecentQuestions Hook
 *
 * Tracks recently selected questions in localStorage for quick access.
 * Used by SearchableQuestionCombobox to show a "Recent" section.
 *
 * Story 13.1: AC #4 - Recent questions section shows last 5-10 recently used questions
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'kel-recent-questions';
const MAX_RECENT = 10;

export interface UseRecentQuestionsResult {
  /** Array of recently used question IDs (most recent first) */
  recentIds: string[];
  /** Add a question ID to the recent list */
  addRecent: (questionId: string) => void;
  /** Clear all recent questions */
  clearRecent: () => void;
}

/**
 * Read recent question IDs from localStorage.
 * Returns empty array if localStorage is unavailable or data is invalid.
 */
function getStoredRecentIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Invalid JSON or localStorage not available - ignore
  }
  return [];
}

/**
 * Hook to manage recently selected questions.
 *
 * @returns Object with recentIds array and addRecent function
 *
 * @example
 * const { recentIds, addRecent } = useRecentQuestions();
 *
 * // When user selects a question
 * const handleSelect = (questionId: string) => {
 *   addRecent(questionId);
 *   onSelect(questionId);
 * };
 *
 * // Filter questions to get recent ones
 * const recentQuestions = questions.filter(q => recentIds.includes(q.id));
 */
export function useRecentQuestions(): UseRecentQuestionsResult {
  // Use lazy initializer to avoid re-reading localStorage on every render
  const [recentIds, setRecentIds] = useState<string[]>(getStoredRecentIds);

  const addRecent = useCallback((questionId: string) => {
    setRecentIds((prev) => {
      // Remove if already exists (to move to front)
      const filtered = prev.filter((id) => id !== questionId);
      // Add to front, limit to max
      const updated = [questionId, ...filtered].slice(0, MAX_RECENT);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage not available - still update state
      }

      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return { recentIds, addRecent, clearRecent };
}
