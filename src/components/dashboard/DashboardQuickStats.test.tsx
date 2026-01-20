/**
 * DashboardQuickStats Component Tests
 *
 * Tests for the dashboard quick stats display showing
 * questions count, pending decisions, and progress.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DashboardQuickStats } from './DashboardQuickStats';

import type { QuestionWithEvidenceCount } from '@/types/question';

// Mock the useQuestions hook
const mockUseQuestions = vi.fn();
vi.mock('@/hooks/questions', () => ({
  useQuestions: () => mockUseQuestions(),
}));

// Factory for mock questions
function createMockQuestion(
  overrides: Partial<QuestionWithEvidenceCount> = {}
): QuestionWithEvidenceCount {
  return {
    id: `q-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test question',
    description: null,
    category: 'market',
    status: 'draft',
    recommendation: null,
    recommendation_rationale: null,
    viewed_by_kel_at: null,
    created_by: 'user-123',
    created_at: '2025-12-23T10:00:00Z',
    updated_at: '2025-12-23T10:00:00Z',
    evidence_count: 0,
    ...overrides,
  };
}

describe('DashboardQuickStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading skeleton when data is loading', () => {
      mockUseQuestions.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<DashboardQuickStats />);
      expect(
        screen.getByTestId('dashboard-quick-stats-loading')
      ).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows zeros when no questions exist', () => {
      mockUseQuestions.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(screen.getByTestId('stat-total-questions-value')).toHaveTextContent(
        '0'
      );
      expect(
        screen.getByTestId('stat-pending-decisions-value')
      ).toHaveTextContent('0');
      expect(screen.getByTestId('stat-progress-value')).toHaveTextContent('0%');
    });
  });

  describe('questions count', () => {
    it('displays total question count', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'draft' }),
          createMockQuestion({ id: 'q-2', status: 'ready_for_kel' }),
          createMockQuestion({ id: 'q-3', status: 'approved' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(screen.getByTestId('stat-total-questions-value')).toHaveTextContent(
        '3'
      );
    });

    it('shows approved count in subtext when present', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'draft' }),
          createMockQuestion({ id: 'q-2', status: 'approved' }),
          createMockQuestion({ id: 'q-3', status: 'approved' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(
        screen.getByTestId('stat-total-questions-subtext')
      ).toHaveTextContent('2 approved');
    });

    it('does not show approved subtext when none approved', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'draft' }),
          createMockQuestion({ id: 'q-2', status: 'ready_for_kel' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(
        screen.queryByTestId('stat-total-questions-subtext')
      ).not.toBeInTheDocument();
    });
  });

  describe('pending decisions', () => {
    it('counts questions with ready_for_kel status', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'draft' }),
          createMockQuestion({ id: 'q-2', status: 'ready_for_kel' }),
          createMockQuestion({ id: 'q-3', status: 'ready_for_kel' }),
          createMockQuestion({ id: 'q-4', status: 'approved' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(
        screen.getByTestId('stat-pending-decisions-value')
      ).toHaveTextContent('2');
    });

    it('shows awaiting Kel subtext', () => {
      mockUseQuestions.mockReturnValue({
        data: [createMockQuestion({ id: 'q-1', status: 'ready_for_kel' })],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(
        screen.getByTestId('stat-pending-decisions-subtext')
      ).toHaveTextContent('awaiting Kel');
    });
  });

  describe('progress percentage', () => {
    it('calculates progress from approved questions', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'draft' }),
          createMockQuestion({ id: 'q-2', status: 'approved' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      // 1 approved out of 2 = 50%
      expect(screen.getByTestId('stat-progress-value')).toHaveTextContent('50%');
    });

    it('includes exploring_alternatives in decided count', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'draft' }),
          createMockQuestion({ id: 'q-2', status: 'approved' }),
          createMockQuestion({ id: 'q-3', status: 'exploring_alternatives' }),
          createMockQuestion({ id: 'q-4', status: 'ready_for_kel' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      // 2 decided (approved + exploring) out of 4 = 50%
      expect(screen.getByTestId('stat-progress-value')).toHaveTextContent('50%');
    });

    it('shows decided/total in subtext', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'draft' }),
          createMockQuestion({ id: 'q-2', status: 'approved' }),
          createMockQuestion({ id: 'q-3', status: 'approved' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(screen.getByTestId('stat-progress-subtext')).toHaveTextContent(
        '2/3 decided'
      );
    });

    it('shows 100% when all questions have decisions', () => {
      mockUseQuestions.mockReturnValue({
        data: [
          createMockQuestion({ id: 'q-1', status: 'approved' }),
          createMockQuestion({ id: 'q-2', status: 'approved' }),
        ],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(screen.getByTestId('stat-progress-value')).toHaveTextContent(
        '100%'
      );
    });
  });

  describe('layout', () => {
    it('renders all three stat cards', () => {
      mockUseQuestions.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(screen.getByTestId('dashboard-quick-stats')).toBeInTheDocument();
      expect(screen.getByTestId('stat-total-questions')).toBeInTheDocument();
      expect(screen.getByTestId('stat-pending-decisions')).toBeInTheDocument();
      expect(screen.getByTestId('stat-progress')).toBeInTheDocument();
    });

    it('renders with correct labels', () => {
      mockUseQuestions.mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<DashboardQuickStats />);
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });
});
