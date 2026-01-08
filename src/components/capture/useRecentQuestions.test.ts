import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useRecentQuestions } from './useRecentQuestions';

const STORAGE_KEY = 'kel-recent-questions';

describe('useRecentQuestions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no recent questions exist', () => {
    const { result } = renderHook(() => useRecentQuestions());

    expect(result.current.recentIds).toEqual([]);
  });

  it('reads recent questions from localStorage on mount', () => {
    const storedIds = ['q1', 'q2', 'q3'];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedIds));

    const { result } = renderHook(() => useRecentQuestions());

    expect(result.current.recentIds).toEqual(storedIds);
  });

  it('adds a question to the beginning of the list', () => {
    const { result } = renderHook(() => useRecentQuestions());

    act(() => {
      result.current.addRecent('q1');
    });

    expect(result.current.recentIds).toEqual(['q1']);

    act(() => {
      result.current.addRecent('q2');
    });

    expect(result.current.recentIds).toEqual(['q2', 'q1']);
  });

  it('moves existing question to the front when re-added', () => {
    const { result } = renderHook(() => useRecentQuestions());

    act(() => {
      result.current.addRecent('q1');
      result.current.addRecent('q2');
      result.current.addRecent('q3');
    });

    expect(result.current.recentIds).toEqual(['q3', 'q2', 'q1']);

    // Re-add q1 (should move to front)
    act(() => {
      result.current.addRecent('q1');
    });

    expect(result.current.recentIds).toEqual(['q1', 'q3', 'q2']);
  });

  it('limits the list to 10 items maximum', () => {
    const { result } = renderHook(() => useRecentQuestions());

    // Add 12 questions
    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.addRecent(`q${i}`);
      }
    });

    expect(result.current.recentIds.length).toBe(10);
    expect(result.current.recentIds[0]).toBe('q12'); // Most recent first
    expect(result.current.recentIds[9]).toBe('q3'); // Oldest that remains
    // q1 and q2 should be dropped
    expect(result.current.recentIds).not.toContain('q1');
    expect(result.current.recentIds).not.toContain('q2');
  });

  it('persists changes to localStorage', () => {
    const { result } = renderHook(() => useRecentQuestions());

    act(() => {
      result.current.addRecent('q1');
      result.current.addRecent('q2');
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toEqual(['q2', 'q1']);
  });

  it('clears all recent questions', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['q1', 'q2']));
    const { result } = renderHook(() => useRecentQuestions());

    expect(result.current.recentIds).toEqual(['q1', 'q2']);

    act(() => {
      result.current.clearRecent();
    });

    expect(result.current.recentIds).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');

    const { result } = renderHook(() => useRecentQuestions());

    // Should return empty array, not throw
    expect(result.current.recentIds).toEqual([]);
  });

  it('handles non-array values in localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));

    const { result } = renderHook(() => useRecentQuestions());

    // Should return empty array for non-array data
    expect(result.current.recentIds).toEqual([]);
  });
});
