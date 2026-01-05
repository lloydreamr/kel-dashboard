import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useFilteredQuestions } from './useFilteredQuestions';
import { useQuestions } from './useQuestions';

import type { Question } from '@/types/database';

// Mock useQuestions
vi.mock('./useQuestions', () => ({
  useQuestions: vi.fn(),
}));

const mockedUseQuestions = vi.mocked(useQuestions);

describe('useFilteredQuestions', () => {
  const mockQuestions: Question[] = [
    {
      id: '1',
      title: 'Draft question 1',
      status: 'draft',
      category: 'market',
      created_by: 'user1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      description: null,
      recommendation: null,
      recommendation_rationale: null,
      viewed_by_kel_at: null,
    },
    {
      id: '2',
      title: 'Draft question 2',
      status: 'draft',
      category: 'product',
      created_by: 'user1',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
      description: null,
      recommendation: null,
      recommendation_rationale: null,
      viewed_by_kel_at: null,
    },
    {
      id: '3',
      title: 'Ready for Kel',
      status: 'ready_for_kel',
      category: 'market',
      created_by: 'user1',
      created_at: '2024-01-03',
      updated_at: '2024-01-03',
      description: null,
      recommendation: null,
      recommendation_rationale: null,
      viewed_by_kel_at: null,
    },
    {
      id: '4',
      title: 'Approved question',
      status: 'approved',
      category: 'distribution',
      created_by: 'user1',
      created_at: '2024-01-04',
      updated_at: '2024-01-04',
      description: null,
      recommendation: null,
      recommendation_rationale: null,
      viewed_by_kel_at: '2024-01-04',
    },
    {
      id: '5',
      title: 'Exploring alternatives',
      status: 'exploring_alternatives',
      category: 'product',
      created_by: 'user1',
      created_at: '2024-01-05',
      updated_at: '2024-01-05',
      description: null,
      recommendation: null,
      recommendation_rationale: null,
      viewed_by_kel_at: '2024-01-05',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all questions when filter is "all"', async () => {
    mockedUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('all'));

    await waitFor(() => {
      expect(result.current.questions).toHaveLength(5);
      expect(result.current.counts.all).toBe(5);
    });
  });

  it('filters to only draft questions when filter is "draft"', async () => {
    mockedUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('draft'));

    await waitFor(() => {
      expect(result.current.questions).toHaveLength(2);
      expect(result.current.questions.every((q) => q.status === 'draft')).toBe(true);
    });
  });

  it('filters to ready_for_kel questions when filter is "sent"', async () => {
    mockedUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('sent'));

    await waitFor(() => {
      expect(result.current.questions).toHaveLength(1);
      expect(result.current.questions[0].status).toBe('ready_for_kel');
    });
  });

  it('filters to approved and exploring_alternatives when filter is "decided"', async () => {
    mockedUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('decided'));

    await waitFor(() => {
      expect(result.current.questions).toHaveLength(2);
      expect(result.current.questions.map((q) => q.status).sort()).toEqual([
        'approved',
        'exploring_alternatives',
      ]);
    });
  });

  it('calculates counts for all filters regardless of current filter', async () => {
    mockedUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('draft'));

    await waitFor(() => {
      expect(result.current.counts).toEqual({
        all: 5,
        draft: 2,
        sent: 1,
        decided: 2,
      });
    });
  });

  it('returns empty questions and zero counts when loading', async () => {
    mockedUseQuestions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('all'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.questions).toHaveLength(0);
    expect(result.current.counts).toEqual({
      all: 0,
      draft: 0,
      sent: 0,
      decided: 0,
    });
  });

  it('passes through error state', async () => {
    const error = new Error('Failed to fetch');
    mockedUseQuestions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('all'));

    expect(result.current.error).toBe(error);
  });

  it('handles empty questions array', async () => {
    mockedUseQuestions.mockReturnValue({
      data: [] as Question[],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuestions>);

    const { result } = renderHook(() => useFilteredQuestions('all'));

    await waitFor(() => {
      expect(result.current.questions).toHaveLength(0);
      expect(result.current.counts).toEqual({
        all: 0,
        draft: 0,
        sent: 0,
        decided: 0,
      });
    });
  });
});
