import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';


// Mock repository
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    getByStatus: vi.fn(),
  },
}));

import { questionsRepo } from '@/lib/repositories/questions';

import { usePendingQuestions } from './usePendingQuestions';

import type { Question } from '@/types/question';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const createMockQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'q-1',
  title: 'Test Question',
  description: null,
  category: 'market',
  status: 'ready_for_kel',
  recommendation: 'Test recommendation',
  recommendation_rationale: null,
  viewed_by_kel_at: null,
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('usePendingQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches questions with ready_for_kel status', async () => {
    const mockQuestions = [
      createMockQuestion({ id: 'q-1' }),
      createMockQuestion({ id: 'q-2' }),
    ];
    vi.mocked(questionsRepo.getByStatus).mockResolvedValueOnce(mockQuestions);

    const { result } = renderHook(() => usePendingQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(questionsRepo.getByStatus).toHaveBeenCalledWith('ready_for_kel');
    expect(result.current.data).toHaveLength(2);
  });

  it('sorts questions by created_at ascending (oldest first)', async () => {
    const oldQuestion = createMockQuestion({
      id: 'q-old',
      created_at: '2025-01-01T00:00:00Z',
    });
    const newQuestion = createMockQuestion({
      id: 'q-new',
      created_at: '2025-01-15T00:00:00Z',
    });
    // Return in wrong order
    vi.mocked(questionsRepo.getByStatus).mockResolvedValueOnce([
      newQuestion,
      oldQuestion,
    ]);

    const { result } = renderHook(() => usePendingQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted oldest first
    expect(result.current.data?.[0].id).toBe('q-old');
    expect(result.current.data?.[1].id).toBe('q-new');
  });

  it('returns empty array when no pending questions', async () => {
    vi.mocked(questionsRepo.getByStatus).mockResolvedValueOnce([]);

    const { result } = renderHook(() => usePendingQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles errors', async () => {
    vi.mocked(questionsRepo.getByStatus).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => usePendingQuestions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Database error');
  });
});
