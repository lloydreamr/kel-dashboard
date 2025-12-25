import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QueueCard } from './QueueCard';

import type { Question } from '@/types/question';

// Mock framer-motion - filter out framer-specific props to avoid console warnings
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      layout, initial, animate, exit, transition, onAnimationComplete,
      ...htmlProps
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...htmlProps}>{children}</div>
    ),
    span: ({
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      animate, transition,
      ...htmlProps
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...htmlProps}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock evidence repository
vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    countByQuestionId: vi.fn().mockResolvedValue(3),
  },
}));

// Mock decisions repository
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock questions repository
vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    updateStatus: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock useProfile
vi.mock('@/hooks/auth', () => ({
  useProfile: () => ({
    data: { id: 'user-123', role: 'kel' },
    isLoading: false,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock navigator.vibrate
const mockVibrate = vi.fn().mockReturnValue(true);
Object.defineProperty(global.navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const createMockQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'q-1',
  title: 'Test Question Title',
  description: null,
  category: 'market',
  status: 'ready_for_kel',
  recommendation:
    'This is the full recommendation text that should be visible when expanded.',
  recommendation_rationale: null,
  viewed_by_kel_at: null,
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('QueueCard', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('collapsed state', () => {
    it('renders with queue-card-collapsed testid when not expanded', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={false}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-collapsed')).toBeInTheDocument();
    });

    it('shows truncated title and recommendation preview', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={false}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByText('Test Question Title')).toBeInTheDocument();
      expect(
        screen.getByText(/This is the full recommendation/)
      ).toBeInTheDocument();
    });

    it('shows category badge', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion({ category: 'product' })}
            isExpanded={false}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('category-badge')).toBeInTheDocument();
    });

    it('calls onToggle when header is clicked', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={false}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      await user.click(screen.getByTestId('queue-card-header'));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle on Enter key', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={false}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      const header = screen.getByTestId('queue-card-header');
      header.focus();
      await user.keyboard('{Enter}');
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle on Space key', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={false}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      const header = screen.getByTestId('queue-card-header');
      header.focus();
      await user.keyboard(' ');
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('expanded state', () => {
    it('renders with queue-card-expanded testid when expanded', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-expanded')).toBeInTheDocument();
    });

    it('shows full recommendation', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-recommendation')).toBeInTheDocument();
    });

    it('shows evidence count area', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-evidence-count')).toBeInTheDocument();
    });

    it('shows action buttons', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-actions')).toBeInTheDocument();
      // Approve button is active (via ApproveButton component)
      expect(screen.getByTestId('approve-button')).toBeInTheDocument();
      // These are still placeholders
      expect(screen.getByText('Approve with Constraint')).toBeInTheDocument();
      expect(screen.getByText('Explore Alternatives')).toBeInTheDocument();
    });

    it('shows collapse button', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-collapse-button')).toBeInTheDocument();
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('calls onToggle when collapse button is clicked', async () => {
      const user = userEvent.setup();
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      await user.click(screen.getByTestId('queue-card-collapse-button'));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('placeholder action buttons are disabled', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      // Approve button is now active (not disabled)
      expect(screen.getByTestId('approve-button')).not.toBeDisabled();
      // Approve with Constraint is now functional (Story 4-5)
      expect(screen.getByTestId('approve-with-constraint-button')).not.toBeDisabled();
      // Explore Alternatives is now functional (Story 4-6)
      expect(screen.getByTestId('explore-alternatives-button')).not.toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('header has aria-expanded attribute', () => {
      const Wrapper = createWrapper();
      const { rerender } = render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={false}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-header')).toHaveAttribute(
        'aria-expanded',
        'false'
      );

      rerender(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      expect(screen.getByTestId('queue-card-header')).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('has 48px minimum touch targets on buttons', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <QueueCard
            question={createMockQuestion()}
            isExpanded={true}
            onToggle={mockOnToggle}
          />
        </Wrapper>
      );

      // All interactive elements should have min-h-[48px]
      const collapseButton = screen.getByTestId('queue-card-collapse-button');
      expect(collapseButton).toHaveClass('min-h-[48px]');
    });
  });
});
