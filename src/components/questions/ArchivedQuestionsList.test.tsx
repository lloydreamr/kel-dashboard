import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ArchivedQuestionsList } from './ArchivedQuestionsList';

import type { Question } from '@/types/database';

const mockArchivedQuestions: Question[] = [
  {
    id: 'arch-1',
    title: 'Archived Question 1',
    description: null,
    category: 'market',
    recommendation: null,
    recommendation_rationale: null,
    status: 'archived',
    created_by: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    viewed_by_kel_at: null,
  },
  {
    id: 'arch-2',
    title: 'Archived Question 2',
    description: null,
    category: 'product',
    recommendation: null,
    recommendation_rationale: null,
    status: 'archived',
    created_by: 'user-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
    viewed_by_kel_at: null,
  },
];

vi.mock('@/hooks/questions', () => ({
  useArchivedQuestions: vi.fn(),
  useRestoreQuestion: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return TestWrapper;
}

describe('ArchivedQuestionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while fetching', async () => {
    const { useArchivedQuestions } = await import('@/hooks/questions');
    vi.mocked(useArchivedQuestions).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);

    render(<ArchivedQuestionsList />, { wrapper: createWrapper() });

    // Should show animated skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state on failure', async () => {
    const { useArchivedQuestions } = await import('@/hooks/questions');
    vi.mocked(useArchivedQuestions).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
    } as never);

    render(<ArchivedQuestionsList />, { wrapper: createWrapper() });

    expect(
      screen.getByText('Failed to load archived questions')
    ).toBeInTheDocument();
  });

  it('shows empty state when no archived questions', async () => {
    const { useArchivedQuestions } = await import('@/hooks/questions');
    vi.mocked(useArchivedQuestions).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    render(<ArchivedQuestionsList />, { wrapper: createWrapper() });

    expect(screen.getByTestId('archived-questions-empty')).toBeInTheDocument();
    expect(screen.getByText('No archived questions')).toBeInTheDocument();
  });

  it('renders list of archived questions', async () => {
    const { useArchivedQuestions } = await import('@/hooks/questions');
    vi.mocked(useArchivedQuestions).mockReturnValue({
      data: mockArchivedQuestions,
      isLoading: false,
      error: null,
    } as never);

    render(<ArchivedQuestionsList />, { wrapper: createWrapper() });

    expect(screen.getByTestId('archived-questions-list')).toBeInTheDocument();
    expect(screen.getByText('Archived Question 1')).toBeInTheDocument();
    expect(screen.getByText('Archived Question 2')).toBeInTheDocument();
  });

  it('shows restore button for each question', async () => {
    const { useArchivedQuestions } = await import('@/hooks/questions');
    vi.mocked(useArchivedQuestions).mockReturnValue({
      data: mockArchivedQuestions,
      isLoading: false,
      error: null,
    } as never);

    render(<ArchivedQuestionsList />, { wrapper: createWrapper() });

    const restoreButtons = screen.getAllByTestId('restore-button');
    expect(restoreButtons).toHaveLength(2);
  });

  it('calls restore mutation when restore button is clicked', async () => {
    const mockMutate = vi.fn();
    const { useArchivedQuestions, useRestoreQuestion } = await import(
      '@/hooks/questions'
    );
    vi.mocked(useArchivedQuestions).mockReturnValue({
      data: mockArchivedQuestions,
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(useRestoreQuestion).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as never);

    render(<ArchivedQuestionsList />, { wrapper: createWrapper() });

    const restoreButtons = screen.getAllByTestId('restore-button');
    fireEvent.click(restoreButtons[0]);

    expect(mockMutate).toHaveBeenCalledWith('arch-1');
  });
});
