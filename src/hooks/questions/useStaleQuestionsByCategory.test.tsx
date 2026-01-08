/**
 * useStaleQuestionsByCategory Hook Tests
 *
 * Tests the hook for fetching stale questions filtered by category.
 * Uses the byCategory query key for cache coherence with question updates.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useStaleQuestionsByCategory } from './useStaleQuestionsByCategory';

// Mock the repository
const mockGetByCategoryWithEvidenceCount = vi.fn();
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    getByCategoryWithEvidenceCount: () => mockGetByCategoryWithEvidenceCount(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function createMockQuestion(overrides: Partial<{
  id: string;
  title: string;
  category: string;
  status: string;
  updated_at: string;
  created_at: string;
  created_by: string;
  evidence_count: number;
}> = {}) {
  return {
    id: overrides.id ?? 'q-1',
    title: overrides.title ?? 'Test Question',
    category: overrides.category ?? 'market',
    status: overrides.status ?? 'draft',
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    created_at: overrides.created_at ?? new Date().toISOString(),
    created_by: overrides.created_by ?? 'user-123',
    description: null,
    recommendation: null,
    recommendation_rationale: null,
    viewed_by_kel_at: null,
    evidence_count: overrides.evidence_count ?? 0,
  };
}

describe('useStaleQuestionsByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stale count of 0 when all questions are fresh', async () => {
    // Arrange - create fresh question (updated today)
    const freshQuestion = createMockQuestion({
      category: 'market',
      updated_at: new Date().toISOString(),
    });
    mockGetByCategoryWithEvidenceCount.mockResolvedValue([freshQuestion]);

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('market'),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.staleCount).toBe(0);
    expect(result.current.data?.staleQuestions).toHaveLength(0);
  });

  it('returns correct stale count when some questions are stale', async () => {
    // Arrange - create one stale question (20 days ago)
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 20);

    const staleQuestion = createMockQuestion({
      id: 'stale-1',
      category: 'market',
      updated_at: staleDate.toISOString(),
    });
    const freshQuestion = createMockQuestion({
      id: 'fresh-1',
      category: 'market',
      updated_at: new Date().toISOString(),
    });
    mockGetByCategoryWithEvidenceCount.mockResolvedValue([staleQuestion, freshQuestion]);

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('market'),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.staleCount).toBe(1);
    expect(result.current.data?.staleQuestions).toHaveLength(1);
    expect(result.current.data?.staleQuestions[0].id).toBe('stale-1');
  });

  it('returns all questions as stale when all are older than threshold', async () => {
    // Arrange - create two stale questions
    const staleDate1 = new Date();
    staleDate1.setDate(staleDate1.getDate() - 20);
    const staleDate2 = new Date();
    staleDate2.setDate(staleDate2.getDate() - 30);

    const staleQuestion1 = createMockQuestion({
      id: 'stale-1',
      category: 'product',
      updated_at: staleDate1.toISOString(),
    });
    const staleQuestion2 = createMockQuestion({
      id: 'stale-2',
      category: 'product',
      updated_at: staleDate2.toISOString(),
    });
    mockGetByCategoryWithEvidenceCount.mockResolvedValue([staleQuestion1, staleQuestion2]);

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('product'),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.staleCount).toBe(2);
    expect(result.current.data?.staleQuestions).toHaveLength(2);
  });

  it('returns empty stale questions array when no questions exist', async () => {
    // Arrange
    mockGetByCategoryWithEvidenceCount.mockResolvedValue([]);

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('market'),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.staleCount).toBe(0);
    expect(result.current.data?.staleQuestions).toHaveLength(0);
  });

  it('handles loading state correctly', () => {
    // Arrange - delay the response
    mockGetByCategoryWithEvidenceCount.mockImplementation(
      () => new Promise(() => {}) // Never resolves to test loading state
    );

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('market'),
      { wrapper: createWrapper() }
    );

    // Assert
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('handles error state correctly', async () => {
    // Arrange
    mockGetByCategoryWithEvidenceCount.mockRejectedValue(new Error('Database error'));

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('market'),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Database error');
  });

  it('considers question at exactly 14 days as fresh (not stale)', async () => {
    // Arrange - exactly at threshold (14 days minus a few hours to avoid edge case)
    // Using 13.5 days ago to ensure we're testing "not yet stale"
    const almostAtThreshold = new Date();
    almostAtThreshold.setTime(almostAtThreshold.getTime() - (13.5 * 24 * 60 * 60 * 1000));

    const borderlineQuestion = createMockQuestion({
      category: 'market',
      updated_at: almostAtThreshold.toISOString(),
    });
    mockGetByCategoryWithEvidenceCount.mockResolvedValue([borderlineQuestion]);

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('market'),
      { wrapper: createWrapper() }
    );

    // Assert - just under threshold should NOT be stale
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.staleCount).toBe(0);
    expect(result.current.data?.staleQuestions).toHaveLength(0);
  });

  it('considers question at 15 days as stale', async () => {
    // Arrange - one day past threshold
    const oneDayPastThreshold = new Date();
    oneDayPastThreshold.setDate(oneDayPastThreshold.getDate() - 15);

    const staleQuestion = createMockQuestion({
      category: 'market',
      updated_at: oneDayPastThreshold.toISOString(),
    });
    mockGetByCategoryWithEvidenceCount.mockResolvedValue([staleQuestion]);

    // Act
    const { result } = renderHook(
      () => useStaleQuestionsByCategory('market'),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.staleCount).toBe(1);
    expect(result.current.data?.staleQuestions).toHaveLength(1);
  });
});
