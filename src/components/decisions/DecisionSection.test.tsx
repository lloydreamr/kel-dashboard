import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DecisionSection } from './DecisionSection';

import type { Profile } from '@/types/database';
import type { Decision } from '@/types/decision';

// Mock useDecision hook
const mockUseDecision = vi.fn();
vi.mock('@/hooks/decisions', () => ({
  useDecision: () => mockUseDecision(),
}));

// Mock useProfile hook
const mockUseProfile = vi.fn();
vi.mock('@/hooks/auth', () => ({
  useProfile: () => mockUseProfile(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useHaptic
vi.mock('@/hooks/ui', () => ({
  useHaptic: () => ({ trigger: vi.fn() }),
}));

// Mock formatRelativeTime for predictable timestamp display
vi.mock('@/lib/utils/date', () => ({
  formatRelativeTime: vi.fn(() => '2 hours ago'),
}));

// Mock useUpdateConstraints
vi.mock('@/hooks/decisions/useUpdateConstraints', () => ({
  useUpdateConstraints: () => ({
    updateConstraintsAsync: vi.fn().mockResolvedValue({ decision: {} }),
    isPending: false,
  }),
}));

// Mock useMarkIncorporated
vi.mock('@/hooks/decisions/useMarkIncorporated', () => ({
  useMarkIncorporated: () => ({
    markIncorporated: vi.fn(),
    isPending: false,
    error: null,
    isSuccess: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const kelProfile: Profile = {
  id: 'user-1',
  email: 'kel@test.com',
  role: 'kel',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mahoProfile: Profile = {
  id: 'user-2',
  email: 'maho@test.com',
  role: 'maho',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const constraintDecision: Decision = {
  id: 'decision-1',
  question_id: 'q-1',
  decision_type: 'approved_with_constraint',
  constraints: [{ type: 'price' }, { type: 'volume' }],
  constraint_context: 'Under 100k budget',
  reasoning: null,
  created_by: 'user-1',
  incorporated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const incorporatedDecision: Decision = {
  ...constraintDecision,
  incorporated_at: '2024-01-02T00:00:00Z',
};

const exploreDecision: Decision = {
  id: 'decision-2',
  question_id: 'q-1',
  decision_type: 'explore_alternatives',
  constraints: null,
  constraint_context: null,
  reasoning: 'Need more market research',
  created_by: 'user-1',
  incorporated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const approvedDecision: Decision = {
  id: 'decision-3',
  question_id: 'q-1',
  decision_type: 'approved',
  constraints: null,
  constraint_context: null,
  reasoning: null,
  created_by: 'user-1',
  incorporated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('DecisionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfile.mockReturnValue({ data: kelProfile });
  });

  describe('Loading State', () => {
    it('shows skeleton while loading', () => {
      mockUseDecision.mockReturnValue({ data: undefined, isLoading: true });

      render(
        <DecisionSection questionId="q-1" questionStatus="ready_for_kel" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.getByTestId('decision-section-skeleton')
      ).toBeInTheDocument();
    });
  });

  describe('No Decision State', () => {
    it('shows "Waiting for decision" when no decision and status is ready_for_kel', () => {
      mockUseDecision.mockReturnValue({ data: null, isLoading: false });

      render(
        <DecisionSection questionId="q-1" questionStatus="ready_for_kel" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-section')).toBeInTheDocument();
      expect(screen.getByTestId('decision-status-waiting')).toBeInTheDocument();
      expect(
        screen.getByTestId('decision-status-waiting')
      ).toHaveTextContent(/Waiting for Kel.*decision/);
    });

    it('returns null when no decision and status is draft', () => {
      mockUseDecision.mockReturnValue({ data: null, isLoading: false });

      const { container } = render(
        <DecisionSection questionId="q-1" questionStatus="draft" />,
        { wrapper: createWrapper() }
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Approved with Constraints', () => {
    it('displays constraint chips', () => {
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-section')).toBeInTheDocument();
      expect(screen.getByTestId('constraint-display')).toBeInTheDocument();
      expect(
        screen.getByTestId('constraint-display-chip-price')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('constraint-display-chip-volume')
      ).toBeInTheDocument();
    });

    it('displays constraint context', () => {
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.getByTestId('constraint-display-context')
      ).toHaveTextContent('Under 100k budget');
    });

    it('displays "Kel\'s Decision" header', () => {
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/Kel.*Decision/)).toBeInTheDocument();
    });
  });

  describe('Edit Button Visibility', () => {
    it('shows edit button when user is Kel and not incorporated', () => {
      mockUseProfile.mockReturnValue({ data: kelProfile });
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.getByTestId('edit-constraints-button')
      ).toBeInTheDocument();
    });

    it('hides edit button when user is Maho', () => {
      mockUseProfile.mockReturnValue({ data: mahoProfile });
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByTestId('edit-constraints-button')
      ).not.toBeInTheDocument();
    });

    it('hides edit button when decision is incorporated', () => {
      mockUseProfile.mockReturnValue({ data: kelProfile });
      mockUseDecision.mockReturnValue({
        data: incorporatedDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByTestId('edit-constraints-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Incorporated Badge', () => {
    it('shows incorporated badge when decision is incorporated', () => {
      mockUseDecision.mockReturnValue({
        data: incorporatedDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('incorporated-badge')).toBeInTheDocument();
    });

    it('does not show incorporated badge when decision is not incorporated', () => {
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByTestId('incorporated-badge')
      ).not.toBeInTheDocument();
    });
  });

  describe('Edit Panel', () => {
    it('opens constraint panel when edit button is clicked', async () => {
      const user = userEvent.setup();
      mockUseProfile.mockReturnValue({ data: kelProfile });
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('edit-constraints-button'));

      await waitFor(() => {
        expect(screen.getByTestId('constraint-panel')).toBeInTheDocument();
      });
    });

    it('pre-populates panel with existing constraints', async () => {
      const user = userEvent.setup();
      mockUseProfile.mockReturnValue({ data: kelProfile });
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByTestId('edit-constraints-button'));

      await waitFor(() => {
        expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
          'aria-checked',
          'true'
        );
        expect(screen.getByTestId('constraint-chip-volume')).toHaveAttribute(
          'aria-checked',
          'true'
        );
      });
    });
  });

  describe('Explore Alternatives', () => {
    it('displays explore alternatives section', () => {
      mockUseDecision.mockReturnValue({
        data: exploreDecision,
        isLoading: false,
      });

      render(
        <DecisionSection
          questionId="q-1"
          questionStatus="exploring_alternatives"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-section')).toBeInTheDocument();
      expect(screen.getByText('Exploring Alternatives')).toBeInTheDocument();
    });

    it('displays reasoning text', () => {
      mockUseDecision.mockReturnValue({
        data: exploreDecision,
        isLoading: false,
      });

      render(
        <DecisionSection
          questionId="q-1"
          questionStatus="exploring_alternatives"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-reasoning')).toHaveTextContent(
        'Need more market research'
      );
    });
  });

  describe('Approved (no constraints)', () => {
    it('displays approved section with checkmark', () => {
      mockUseDecision.mockReturnValue({
        data: approvedDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-section')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });
  });

  describe('Maho-specific Behavior (Story 4-8)', () => {
    it('Maho sees timestamp after Kel decides with constraints', () => {
      mockUseProfile.mockReturnValue({ data: mahoProfile });
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      // Maho sees the decision section with timestamp
      expect(screen.getByTestId('decision-section')).toBeInTheDocument();
      expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
        'Decided 2 hours ago'
      );
      // Maho sees constraints but NOT the edit button
      expect(screen.getByTestId('constraint-display')).toBeInTheDocument();
      expect(
        screen.queryByTestId('edit-constraints-button')
      ).not.toBeInTheDocument();
    });

    it('Maho sees "Waiting for decision" when status is ready_for_kel', () => {
      mockUseProfile.mockReturnValue({ data: mahoProfile });
      mockUseDecision.mockReturnValue({ data: null, isLoading: false });

      render(
        <DecisionSection questionId="q-1" questionStatus="ready_for_kel" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-status-waiting')).toHaveTextContent(
        /Waiting for Kel.*decision/
      );
    });
  });

  describe('Decision Timestamp (Story 4-8)', () => {
    it('shows timestamp for approved_with_constraint decisions', () => {
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-timestamp')).toBeInTheDocument();
      expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
        'Decided 2 hours ago'
      );
    });

    it('shows timestamp for explore_alternatives decisions', () => {
      mockUseDecision.mockReturnValue({
        data: exploreDecision,
        isLoading: false,
      });

      render(
        <DecisionSection
          questionId="q-1"
          questionStatus="exploring_alternatives"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-timestamp')).toBeInTheDocument();
      expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
        'Decided 2 hours ago'
      );
    });

    it('shows timestamp for simple approved decisions', () => {
      mockUseDecision.mockReturnValue({
        data: approvedDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('decision-timestamp')).toBeInTheDocument();
      expect(screen.getByTestId('decision-timestamp')).toHaveTextContent(
        'Decided 2 hours ago'
      );
    });

    it('does NOT show timestamp when no decision exists', () => {
      mockUseDecision.mockReturnValue({ data: null, isLoading: false });

      render(
        <DecisionSection questionId="q-1" questionStatus="ready_for_kel" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByTestId('decision-timestamp')
      ).not.toBeInTheDocument();
    });
  });

  describe('Mark Incorporated Button (Story 4-9)', () => {
    it('Maho sees button when not incorporated', () => {
      mockUseProfile.mockReturnValue({ data: mahoProfile });
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.getByTestId('mark-incorporated-button')
      ).toBeInTheDocument();
    });

    it('Maho does NOT see button when already incorporated', () => {
      mockUseProfile.mockReturnValue({ data: mahoProfile });
      mockUseDecision.mockReturnValue({
        data: incorporatedDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByTestId('mark-incorporated-button')
      ).not.toBeInTheDocument();
    });

    it('Kel does NOT see Mark Incorporated button (only edit button)', () => {
      mockUseProfile.mockReturnValue({ data: kelProfile });
      mockUseDecision.mockReturnValue({
        data: constraintDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByTestId('mark-incorporated-button')
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('edit-constraints-button')
      ).toBeInTheDocument();
    });

    it('shows incorporated badge with timestamp when incorporated', () => {
      mockUseProfile.mockReturnValue({ data: mahoProfile });
      mockUseDecision.mockReturnValue({
        data: incorporatedDecision,
        isLoading: false,
      });

      render(
        <DecisionSection questionId="q-1" questionStatus="approved" />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('incorporated-badge')).toBeInTheDocument();
      expect(screen.getByTestId('incorporated-timestamp')).toBeInTheDocument();
    });
  });
});
