/**
 * StaleQuestionsClient Component Tests
 *
 * Tests for the stale questions filtered view component.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useStaleQuestionsByCategory } from '@/hooks/questions';

import { StaleQuestionsClient } from './StaleQuestionsClient';

// Mock Next.js navigation (needed by QuestionCard)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useProfile (needed by QuestionCard)
vi.mock('@/hooks/auth/useProfile', () => ({
  useProfile: () => ({
    data: { role: 'maho' },
  }),
}));

// Mock QuestionCardActions to avoid QueryClient dependency
vi.mock('@/components/questions/QuestionCardActions', () => ({
  QuestionCardActions: ({ questionId }: { questionId: string }) => (
    <div data-testid="question-card-actions" data-question-id={questionId} />
  ),
}));

// Mock the hook
vi.mock('@/hooks/questions', () => ({
  useStaleQuestionsByCategory: vi.fn(),
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
  evidence_count: number;
}> = {}) {
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 20);

  return {
    id: overrides.id ?? 'q-1',
    title: overrides.title ?? 'Test Stale Question',
    category: overrides.category ?? 'market',
    status: overrides.status ?? 'draft',
    updated_at: overrides.updated_at ?? staleDate.toISOString(),
    created_at: new Date().toISOString(),
    created_by: 'user-123',
    description: null,
    recommendation: null,
    recommendation_rationale: null,
    viewed_by_kel_at: null,
    evidence_count: overrides.evidence_count ?? 0,
  };
}

describe('StaleQuestionsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error state for invalid category', () => {
    // Arrange - invalid category won't call the hook
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: { staleCount: 0, staleQuestions: [] },
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="invalid-category" />, {
      wrapper: createWrapper(),
    });

    // Assert
    expect(screen.getByTestId('invalid-category-error')).toBeInTheDocument();
    expect(screen.getByText(/Invalid category: invalid-category/)).toBeInTheDocument();
  });

  it('shows skeleton loading state', () => {
    // Arrange
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="market" />, {
      wrapper: createWrapper(),
    });

    // Assert
    expect(screen.getByTestId('stale-questions-loading')).toBeInTheDocument();
    expect(screen.getAllByTestId('question-card-skeleton')).toHaveLength(3);
  });

  it('shows error state when query fails', () => {
    // Arrange
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Database error'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="product" />, {
      wrapper: createWrapper(),
    });

    // Assert
    expect(screen.getByTestId('stale-questions-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load questions')).toBeInTheDocument();
  });

  it('shows empty state when no stale questions', () => {
    // Arrange
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: { staleCount: 0, staleQuestions: [] },
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="distribution" />, {
      wrapper: createWrapper(),
    });

    // Assert
    expect(screen.getByTestId('stale-questions-empty')).toBeInTheDocument();
    expect(screen.getByText('No stale questions in Distribution')).toBeInTheDocument();
  });

  it('shows stale questions list', () => {
    // Arrange
    const staleQuestions = [
      createMockQuestion({ id: 'q-1', title: 'First stale question' }),
      createMockQuestion({ id: 'q-2', title: 'Second stale question' }),
    ];

    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: { staleCount: 2, staleQuestions },
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="market" />, {
      wrapper: createWrapper(),
    });

    // Assert
    expect(screen.getByTestId('stale-questions-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('question-card')).toHaveLength(2);
    expect(screen.getByText('First stale question')).toBeInTheDocument();
    expect(screen.getByText('Second stale question')).toBeInTheDocument();
  });

  it('displays correct category label in title', () => {
    // Arrange
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: { staleCount: 0, staleQuestions: [] },
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="product" />, {
      wrapper: createWrapper(),
    });

    // Assert
    expect(screen.getByTestId('stale-questions-title')).toHaveTextContent('Stale Product Questions');
  });

  it('includes back navigation to progress page', () => {
    // Arrange
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: { staleCount: 0, staleQuestions: [] },
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="market" />, {
      wrapper: createWrapper(),
    });

    // Assert
    const backLink = screen.getByRole('link', { name: /back to progress/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/progress');
  });

  it('calls useStaleQuestionsByCategory with correct category', () => {
    // Arrange
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: { staleCount: 0, staleQuestions: [] },
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Act
    render(<StaleQuestionsClient category="distribution" />, {
      wrapper: createWrapper(),
    });

    // Assert
    expect(useStaleQuestionsByCategory).toHaveBeenCalledWith('distribution');
  });

  it('validates all three valid categories work', () => {
    vi.mocked(useStaleQuestionsByCategory).mockReturnValue({
      data: { staleCount: 0, staleQuestions: [] },
      isLoading: false,
      isError: false,
      error: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Test market
    const { unmount: unmount1 } = render(
      <StaleQuestionsClient category="market" />,
      { wrapper: createWrapper() }
    );
    expect(screen.queryByTestId('invalid-category-error')).not.toBeInTheDocument();
    unmount1();

    // Test product
    const { unmount: unmount2 } = render(
      <StaleQuestionsClient category="product" />,
      { wrapper: createWrapper() }
    );
    expect(screen.queryByTestId('invalid-category-error')).not.toBeInTheDocument();
    unmount2();

    // Test distribution
    render(<StaleQuestionsClient category="distribution" />, {
      wrapper: createWrapper(),
    });
    expect(screen.queryByTestId('invalid-category-error')).not.toBeInTheDocument();
  });
});
