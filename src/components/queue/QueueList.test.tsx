import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQueueStore } from '@/stores/queue';

import { QueueList } from './QueueList';

import type { Question } from '@/types/question';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    span: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock evidence repository
vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    countByQuestionId: vi.fn().mockResolvedValue(0),
  },
}));

/**
 * Create test wrapper with QueryClientProvider
 */
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

describe('QueueList', () => {
  beforeEach(() => {
    useQueueStore.setState({
      expandedCardId: null,
      draftResponses: {},
    });
  });

  it('shows loading skeleton when loading', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueueList questions={undefined} isLoading={true} />
      </Wrapper>
    );
    expect(screen.getByTestId('queue-loading-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no questions', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueueList questions={[]} isLoading={false} />
      </Wrapper>
    );
    expect(screen.getByTestId('queue-empty-state')).toBeInTheDocument();
    expect(screen.getByText('All caught up!')).toBeInTheDocument();
  });

  it('shows empty state when questions is undefined', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <QueueList questions={undefined} isLoading={false} />
      </Wrapper>
    );
    expect(screen.getByTestId('queue-empty-state')).toBeInTheDocument();
  });

  it('renders queue cards for questions', () => {
    const Wrapper = createWrapper();
    const questions = [
      createMockQuestion({ id: 'q-1', title: 'Question 1' }),
      createMockQuestion({ id: 'q-2', title: 'Question 2' }),
    ];
    render(
      <Wrapper>
        <QueueList questions={questions} isLoading={false} />
      </Wrapper>
    );

    expect(screen.getByTestId('queue-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('queue-card-collapsed')).toHaveLength(2);
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });

  it('toggles card expansion on click', async () => {
    const Wrapper = createWrapper();
    const user = userEvent.setup();
    const questions = [createMockQuestion({ id: 'q-1' })];
    render(
      <Wrapper>
        <QueueList questions={questions} isLoading={false} />
      </Wrapper>
    );

    await user.click(screen.getByTestId('queue-card-header'));

    expect(useQueueStore.getState().expandedCardId).toBe('q-1');
  });

  it('passes isExpanded=true to card matching expandedCardId', () => {
    const Wrapper = createWrapper();
    const questions = [
      createMockQuestion({ id: 'q-1', title: 'Question 1' }),
      createMockQuestion({ id: 'q-2', title: 'Question 2' }),
    ];

    useQueueStore.setState({ expandedCardId: 'q-1' });

    render(
      <Wrapper>
        <QueueList questions={questions} isLoading={false} />
      </Wrapper>
    );

    // q-1 should be expanded, q-2 should be collapsed
    expect(screen.getByTestId('queue-card-expanded')).toBeInTheDocument();
    expect(screen.getByTestId('queue-card-collapsed')).toBeInTheDocument();
  });

  it('passes isExpanded=false to all cards when no card expanded', () => {
    const Wrapper = createWrapper();
    const questions = [
      createMockQuestion({ id: 'q-1', title: 'Question 1' }),
      createMockQuestion({ id: 'q-2', title: 'Question 2' }),
    ];

    useQueueStore.setState({ expandedCardId: null });

    render(
      <Wrapper>
        <QueueList questions={questions} isLoading={false} />
      </Wrapper>
    );

    // Both should be collapsed
    expect(screen.getAllByTestId('queue-card-collapsed')).toHaveLength(2);
  });

  it('accordion behavior - expanding new card collapses previous', async () => {
    const Wrapper = createWrapper();
    const user = userEvent.setup();
    const questions = [
      createMockQuestion({ id: 'q-1', title: 'Question 1' }),
      createMockQuestion({ id: 'q-2', title: 'Question 2' }),
    ];

    render(
      <Wrapper>
        <QueueList questions={questions} isLoading={false} />
      </Wrapper>
    );

    // Click first card header
    const headers = screen.getAllByTestId('queue-card-header');
    await user.click(headers[0]);
    expect(useQueueStore.getState().expandedCardId).toBe('q-1');

    // Click second card header - accordion behavior via Zustand toggleCard
    await user.click(headers[1]);
    expect(useQueueStore.getState().expandedCardId).toBe('q-2');
  });
});
