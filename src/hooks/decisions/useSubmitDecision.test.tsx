import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';


// Mock repositories
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    create: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    update: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';

import { useSubmitDecision } from './useSubmitDecision';

import type { Decision } from '@/types/database';

/**
 * Create a mock Decision with all required fields
 */
function createMockDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'd1',
    question_id: 'q1',
    decision_type: 'approved',
    constraints: null,
    constraint_context: null,
    reasoning: null,
    incorporated_at: null,
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

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

describe('useSubmitDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits approved decision successfully', async () => {
    const mockDecision = createMockDecision();
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const { result } = renderHook(() => useSubmitDecision('user1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      question_id: 'q1',
      decision_type: 'approved',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.create).toHaveBeenCalledWith({
      question_id: 'q1',
      decision_type: 'approved',
      constraints: null,
      reasoning: null,
      created_by: 'user1',
    });
    expect(questionsRepo.update).toHaveBeenCalledWith('q1', {
      status: 'approved',
    });
    expect(toast.success).toHaveBeenCalledWith('Approved!');
  });

  it('submits approved_with_constraint decision with constraints', async () => {
    const mockDecision = createMockDecision({
      id: 'd2',
      decision_type: 'approved_with_constraint',
      constraints: [{ type: 'budget', context: 'Under $50k' }],
    });
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const { result } = renderHook(() => useSubmitDecision('user1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      question_id: 'q1',
      decision_type: 'approved_with_constraint',
      constraints: [{ type: 'budget', context: 'Under $50k' }],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.create).toHaveBeenCalledWith({
      question_id: 'q1',
      decision_type: 'approved_with_constraint',
      constraints: [{ type: 'budget', context: 'Under $50k' }],
      reasoning: null,
      created_by: 'user1',
    });
    expect(questionsRepo.update).toHaveBeenCalledWith('q1', {
      status: 'approved',
    });
    expect(toast.success).toHaveBeenCalledWith('Approved with constraints');
  });

  it('submits explore_alternatives decision with reasoning', async () => {
    const mockDecision = createMockDecision({
      id: 'd3',
      decision_type: 'explore_alternatives',
      reasoning: 'Need more data',
    });
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const { result } = renderHook(() => useSubmitDecision('user1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      question_id: 'q1',
      decision_type: 'explore_alternatives',
      reasoning: 'Need more data',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(decisionsRepo.create).toHaveBeenCalledWith({
      question_id: 'q1',
      decision_type: 'explore_alternatives',
      constraints: null,
      reasoning: 'Need more data',
      created_by: 'user1',
    });
    expect(questionsRepo.update).toHaveBeenCalledWith('q1', {
      status: 'exploring_alternatives',
    });
    expect(toast.success).toHaveBeenCalledWith('Exploring alternatives');
  });

  it('calls onSuccess callback with decision', async () => {
    const mockDecision = createMockDecision();
    vi.mocked(decisionsRepo.create).mockResolvedValueOnce(mockDecision);
    vi.mocked(questionsRepo.update).mockResolvedValueOnce({} as never);

    const onSuccess = vi.fn();
    const { result } = renderHook(
      () => useSubmitDecision('user1', { onSuccess }),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      question_id: 'q1',
      decision_type: 'approved',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockDecision);
  });

  it('shows error toast on failure', async () => {
    vi.mocked(decisionsRepo.create).mockRejectedValueOnce(
      new Error('Database error')
    );

    const { result } = renderHook(() => useSubmitDecision('user1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      question_id: 'q1',
      decision_type: 'approved',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to submit decision', {
      description: 'Database error',
    });
  });

  it('handles non-Error objects in error handler', async () => {
    vi.mocked(decisionsRepo.create).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useSubmitDecision('user1'), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      question_id: 'q1',
      decision_type: 'approved',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to submit decision', {
      description: 'Unknown error',
    });
  });
});
