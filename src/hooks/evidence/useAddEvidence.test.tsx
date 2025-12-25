import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { evidenceRepo } from '@/lib/repositories/evidence';

import { useAddEvidence } from './useAddEvidence';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock repository
vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    create: vi.fn(),
  },
}));

// Helper to create wrapper with pre-populated cache
function createTestWrapper(initialCache?: { questionId: string; data: unknown[] }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (initialCache) {
    queryClient.setQueryData(
      queryKeys.evidence.byQuestion(initialCache.questionId),
      initialCache.data
    );
  }

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAddEvidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates evidence successfully', async () => {
    const createdEvidence = {
      id: 'e1',
      question_id: 'q1',
      title: 'Source',
      url: 'https://example.com',
      section_anchor: null,
      excerpt: null,
      created_by: 'user1',
      created_at: '2025-01-01T00:00:00Z',
    };
    vi.mocked(evidenceRepo.create).mockResolvedValueOnce(createdEvidence);

    const { result } = renderHook(() => useAddEvidence('q1'), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.mutate({
        title: 'Source',
        url: 'https://example.com',
        created_by: 'user1',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(evidenceRepo.create).toHaveBeenCalledWith({
      question_id: 'q1',
      title: 'Source',
      url: 'https://example.com',
      created_by: 'user1',
    });
    expect(toast.success).toHaveBeenCalledWith('Evidence added');
  });

  it('shows error toast on failure', async () => {
    vi.mocked(evidenceRepo.create).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => useAddEvidence('q1'), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.mutate({
        title: 'Source',
        url: 'https://example.com',
        created_by: 'user1',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to add evidence', {
      description: 'Database error',
    });
  });

  it('performs optimistic update with existing cache', async () => {
    const existingEvidence = [
      {
        id: 'existing-1',
        question_id: 'q1',
        title: 'Existing',
        url: 'https://existing.com',
        section_anchor: null,
        excerpt: null,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Use a promise we can control to test the optimistic state
    let resolveCreate: (value: unknown) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    vi.mocked(evidenceRepo.create).mockReturnValueOnce(createPromise as never);

    const { wrapper, queryClient } = createTestWrapper({
      questionId: 'q1',
      data: existingEvidence,
    });

    const { result } = renderHook(() => useAddEvidence('q1'), { wrapper });

    act(() => {
      result.current.mutate({
        title: 'New Source',
        url: 'https://new.com',
        created_by: 'user1',
      });
    });

    // Wait for mutation to be pending (onMutate has run)
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Check optimistic update was applied
    const cacheAfterMutate = queryClient.getQueryData(
      queryKeys.evidence.byQuestion('q1')
    ) as unknown[];
    expect(cacheAfterMutate).toHaveLength(2);
    expect(cacheAfterMutate[1]).toMatchObject({
      title: 'New Source',
      url: 'https://new.com',
    });
    // Optimistic item has temp ID
    expect((cacheAfterMutate[1] as { id: string }).id).toMatch(/^temp-/);

    // Resolve the create promise
    resolveCreate!({
      id: 'real-id',
      question_id: 'q1',
      title: 'New Source',
      url: 'https://new.com',
      section_anchor: null,
      excerpt: null,
      created_by: 'user1',
      created_at: '2025-01-01T00:00:00Z',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('rolls back on error with existing cache', async () => {
    const existingEvidence = [
      {
        id: 'existing-1',
        question_id: 'q1',
        title: 'Existing',
        url: 'https://existing.com',
        section_anchor: null,
        excerpt: null,
        created_by: 'user1',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    vi.mocked(evidenceRepo.create).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { wrapper, queryClient } = createTestWrapper({
      questionId: 'q1',
      data: existingEvidence,
    });

    const { result } = renderHook(() => useAddEvidence('q1'), { wrapper });

    act(() => {
      result.current.mutate({
        title: 'New Source',
        url: 'https://new.com',
        created_by: 'user1',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check cache was rolled back to original
    const cacheAfterError = queryClient.getQueryData(
      queryKeys.evidence.byQuestion('q1')
    ) as unknown[];
    expect(cacheAfterError).toHaveLength(1);
    expect(cacheAfterError[0]).toMatchObject({ title: 'Existing' });
  });

  it('works with empty cache (first evidence)', async () => {
    // Use a promise we can control
    let resolveCreate: (value: unknown) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    vi.mocked(evidenceRepo.create).mockReturnValueOnce(createPromise as never);

    // Start with NO cache (undefined)
    const { wrapper, queryClient } = createTestWrapper();

    const { result } = renderHook(() => useAddEvidence('q1'), { wrapper });

    act(() => {
      result.current.mutate({
        title: 'First Source',
        url: 'https://first.com',
        created_by: 'user1',
      });
    });

    // Wait for mutation to be pending (onMutate has run)
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Check optimistic update was applied even with empty cache
    const cacheAfterMutate = queryClient.getQueryData(
      queryKeys.evidence.byQuestion('q1')
    ) as unknown[];
    expect(cacheAfterMutate).toHaveLength(1);
    expect(cacheAfterMutate[0]).toMatchObject({
      title: 'First Source',
      url: 'https://first.com',
    });

    // Resolve the create promise
    resolveCreate!({
      id: 'real-id',
      question_id: 'q1',
      title: 'First Source',
      url: 'https://first.com',
      section_anchor: null,
      excerpt: null,
      created_by: 'user1',
      created_at: '2025-01-01T00:00:00Z',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
