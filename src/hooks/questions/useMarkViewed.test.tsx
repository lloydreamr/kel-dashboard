import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useMarkViewed } from './useMarkViewed';

import type { Question } from '@/types/question';

// Mock dependencies
const mockMarkViewed = vi.fn();
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    markViewed: (id: string) => mockMarkViewed(id),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockQuestion: Question = {
  id: 'q-123',
  title: 'Test Question',
  description: null,
  category: 'market',
  status: 'ready_for_kel',
  recommendation: 'Test recommendation',
  recommendation_rationale: null,
  viewed_by_kel_at: new Date().toISOString(),
  created_by: 'user-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('useMarkViewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns markViewed, hasMarked, and isPending', () => {
    const { result } = renderHook(() => useMarkViewed(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.markViewed).toBe('function');
    expect(typeof result.current.hasMarked).toBe('function');
    expect(result.current.isPending).toBe(false);
  });

  it('calls questionsRepo.markViewed when markViewed is called', async () => {
    mockMarkViewed.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useMarkViewed(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.markViewed('q-123');
    });

    await waitFor(() => {
      expect(mockMarkViewed).toHaveBeenCalledWith('q-123');
    });

    expect(mockMarkViewed).toHaveBeenCalledTimes(1);
  });

  it('only calls mutation once per questionId (once-per-session)', async () => {
    mockMarkViewed.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useMarkViewed(), {
      wrapper: createWrapper(),
    });

    // Call markViewed multiple times for same question
    act(() => {
      result.current.markViewed('q-123');
      result.current.markViewed('q-123');
      result.current.markViewed('q-123');
    });

    await waitFor(() => {
      expect(mockMarkViewed).toHaveBeenCalled();
    });

    // Should only be called once despite multiple calls
    expect(mockMarkViewed).toHaveBeenCalledTimes(1);
  });

  it('hasMarked returns false before first call', () => {
    const { result } = renderHook(() => useMarkViewed(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasMarked('q-123')).toBe(false);
  });

  it('hasMarked returns true after markViewed is called', async () => {
    mockMarkViewed.mockResolvedValue(mockQuestion);

    const { result } = renderHook(() => useMarkViewed(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.markViewed('q-123');
    });

    // hasMarked should be true immediately after call (not after mutation resolves)
    expect(result.current.hasMarked('q-123')).toBe(true);
  });

  it('tracks different questions independently', async () => {
    const question1 = { ...mockQuestion, id: 'q-1' };
    const question2 = { ...mockQuestion, id: 'q-2' };
    mockMarkViewed
      .mockResolvedValueOnce(question1)
      .mockResolvedValueOnce(question2);

    const { result } = renderHook(() => useMarkViewed(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.markViewed('q-1');
    });

    expect(result.current.hasMarked('q-1')).toBe(true);
    expect(result.current.hasMarked('q-2')).toBe(false);

    act(() => {
      result.current.markViewed('q-2');
    });

    expect(result.current.hasMarked('q-1')).toBe(true);
    expect(result.current.hasMarked('q-2')).toBe(true);

    await waitFor(() => {
      expect(mockMarkViewed).toHaveBeenCalledTimes(2);
    });
  });
});
