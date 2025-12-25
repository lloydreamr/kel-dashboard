import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuestionDetailClient } from './QuestionDetailClient';

import type { Profile, Question } from '@/types';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock hooks
const mockQuestion: Question = {
  id: 'q-1',
  title: 'Test Question',
  description: 'Test description',
  category: 'market',
  status: 'draft',
  recommendation: null,
  recommendation_rationale: null,
  viewed_by_kel_at: null,
  created_by: 'user-123',
  created_at: '2025-12-23T10:00:00Z',
  updated_at: '2025-12-23T10:00:00Z',
};

const mockProfile: Profile = {
  id: 'user-123',
  email: 'maho@test.com',
  role: 'maho',
  created_at: '2025-12-23T10:00:00Z',
  updated_at: '2025-12-23T10:00:00Z',
};

const mockUseQuestion = vi.fn();
const mockUseProfile = vi.fn();
const mockUpdateQuestion = vi.fn();
const mockArchiveQuestion = vi.fn();
const mockMarkReadyForKel = vi.fn();
const mockMarkViewed = vi.fn();
const mockHasMarked = vi.fn();

vi.mock('@/hooks/questions/useQuestion', () => ({
  useQuestion: () => mockUseQuestion(),
}));

vi.mock('@/hooks/auth/useProfile', () => ({
  useProfile: () => mockUseProfile(),
}));

vi.mock('@/hooks/questions/useUpdateQuestion', () => ({
  useUpdateQuestion: () => ({
    mutate: mockUpdateQuestion,
    isPending: false,
  }),
}));

vi.mock('@/hooks/questions/useArchiveQuestion', () => ({
  useArchiveQuestion: () => ({
    mutate: mockArchiveQuestion,
    isPending: false,
  }),
}));

vi.mock('@/hooks/questions/useMarkReadyForKel', () => ({
  useMarkReadyForKel: () => ({
    markReadyForKel: mockMarkReadyForKel,
    isPending: false,
  }),
}));

vi.mock('@/hooks/questions/useMarkViewed', () => ({
  useMarkViewed: () => ({
    markViewed: mockMarkViewed,
    hasMarked: mockHasMarked,
  }),
}));

const mockUseEvidence = vi.fn();
vi.mock('@/hooks/evidence/useEvidence', () => ({
  useEvidence: () => mockUseEvidence(),
}));

vi.mock('@/hooks/evidence/useAddEvidence', () => ({
  useAddEvidence: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/evidence/useUpdateEvidence', () => ({
  useUpdateEvidence: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/evidence/useDeleteEvidence', () => ({
  useDeleteEvidence: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useDecision hook (Story 4-10)
const mockUseDecision = vi.fn();
vi.mock('@/hooks/decisions/useDecision', () => ({
  useDecision: () => mockUseDecision(),
}));

// Mock DecisionSection component
vi.mock('@/components/decisions/DecisionSection', () => ({
  DecisionSection: ({ questionId, questionStatus }: { questionId: string; questionStatus: string }) => (
    <div data-testid="decision-section" data-question-id={questionId} data-status={questionStatus}>
      Decision Section Mock
    </div>
  ),
}));

describe('QuestionDetailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseQuestion.mockReturnValue({
      data: mockQuestion,
      isLoading: false,
      error: null,
    });

    mockUseProfile.mockReturnValue({
      data: mockProfile,
    });

    mockUseEvidence.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    mockUseDecision.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    mockHasMarked.mockReturnValue(false);
  });

  describe('category reassignment', () => {
    it('shows editable category badge for Maho', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        const badge = screen.getByTestId('category-badge');
        expect(badge.tagName).toBe('BUTTON');
      });
    });

    it('shows static category badge for Kel', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'kel' },
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        const badge = screen.getByTestId('category-badge');
        expect(badge.tagName).toBe('SPAN');
      });
    });

    it('shows static category badge for archived questions', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      mockUseQuestion.mockReturnValue({
        data: { ...mockQuestion, status: 'archived' },
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        const badge = screen.getByTestId('category-badge');
        expect(badge.tagName).toBe('SPAN');
      });
    });

    it('opens dropdown and shows all categories', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      const user = userEvent.setup();
      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('category-badge')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('category-badge'));

      expect(screen.getByTestId('category-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('category-option-market')).toBeInTheDocument();
      expect(screen.getByTestId('category-option-product')).toBeInTheDocument();
      expect(
        screen.getByTestId('category-option-distribution')
      ).toBeInTheDocument();
    });

    it('calls updateQuestion when selecting different category', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      const user = userEvent.setup();
      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('category-badge')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('category-badge'));
      await user.click(screen.getByTestId('category-option-product'));

      expect(mockUpdateQuestion).toHaveBeenCalledWith(
        {
          id: 'q-1',
          updates: { category: 'product' },
        },
        expect.any(Object)
      );
    });

    it('does not call updateQuestion when selecting same category', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      const user = userEvent.setup();
      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('category-badge')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('category-badge'));
      await user.click(screen.getByTestId('category-option-market'));

      expect(mockUpdateQuestion).not.toHaveBeenCalled();
    });
  });

  describe('evidence section', () => {
    it('shows add evidence button for Maho on non-archived questions', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('add-evidence-button')).toBeInTheDocument();
      });
    });

    it('does not show add evidence button for Kel', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'kel' },
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('question-detail')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('add-evidence-button')
      ).not.toBeInTheDocument();
    });

    it('does not show add evidence button for archived questions', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      mockUseQuestion.mockReturnValue({
        data: { ...mockQuestion, status: 'archived' },
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('question-detail')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('add-evidence-button')
      ).not.toBeInTheDocument();
    });

    it('shows evidence form when add button clicked', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      const user = userEvent.setup();
      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('add-evidence-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-evidence-button'));

      expect(screen.getByTestId('evidence-form')).toBeInTheDocument();
    });
  });

  describe('evidence list display', () => {
    it('shows loading skeleton when evidence is loading', async () => {
      mockUseEvidence.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('evidence-list-skeleton')).toBeInTheDocument();
      });
    });

    it('shows Maho empty state when no evidence for Maho role', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'maho' },
      });

      mockUseEvidence.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('evidence-empty-state')).toBeInTheDocument();
        expect(screen.getByText(/Add sources to support/)).toBeInTheDocument();
      });
    });

    it('shows Kel empty state when no evidence for Kel role', async () => {
      mockUseProfile.mockReturnValue({
        data: { ...mockProfile, role: 'kel' },
      });

      mockUseEvidence.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('evidence-empty-state')).toBeInTheDocument();
        expect(
          screen.getByText(/No supporting evidence provided/)
        ).toBeInTheDocument();
      });
    });

    it('shows evidence items when evidence exists', async () => {
      mockUseEvidence.mockReturnValue({
        data: [
          {
            id: 'e1',
            question_id: 'q-1',
            title: 'Market Research Report',
            url: 'https://example.com/report',
            section_anchor: null,
            excerpt: 'Key findings about the market',
            created_by: 'user-123',
            created_at: '2025-12-24T00:00:00Z',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('evidence-list')).toBeInTheDocument();
        expect(screen.getByTestId('evidence-item')).toBeInTheDocument();
        expect(screen.getByText('Market Research Report')).toBeInTheDocument();
      });
    });
  });

  describe('DecisionSection integration', () => {
    it('renders DecisionSection with question props', async () => {
      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        const section = screen.getByTestId('decision-section');
        expect(section).toBeInTheDocument();
        expect(section).toHaveAttribute('data-question-id', 'q-1');
        expect(section).toHaveAttribute('data-status', 'draft');
      });
    });

    it('passes correct status to DecisionSection when approved', async () => {
      mockUseQuestion.mockReturnValue({
        data: { ...mockQuestion, status: 'approved' },
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        const section = screen.getByTestId('decision-section');
        expect(section).toHaveAttribute('data-status', 'approved');
      });
    });

    it('passes correct status to DecisionSection when ready_for_kel', async () => {
      mockUseQuestion.mockReturnValue({
        data: { ...mockQuestion, status: 'ready_for_kel' },
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        const section = screen.getByTestId('decision-section');
        expect(section).toHaveAttribute('data-status', 'ready_for_kel');
      });
    });
  });

  describe('EvidencePanel integration', () => {
    const mockEvidenceItem = {
      id: 'e1',
      question_id: 'q-1',
      title: 'Market Research Report',
      url: 'https://example.com/report',
      section_anchor: '#pricing',
      excerpt: 'Key findings about the market',
      created_by: 'user-123',
      created_at: '2025-12-24T00:00:00Z',
    };

    it('opens evidence panel when evidence item is clicked', async () => {
      const user = userEvent.setup();
      mockUseEvidence.mockReturnValue({
        data: [mockEvidenceItem],
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('evidence-item')).toBeInTheDocument();
      });

      // Click evidence item
      await user.click(screen.getByTestId('evidence-item'));

      // Panel should open
      await waitFor(() => {
        expect(screen.getByTestId('evidence-panel')).toBeInTheDocument();
        expect(screen.getByTestId('evidence-panel-title')).toHaveTextContent(
          'Market Research Report'
        );
      });
    });

    it('closes evidence panel when Escape is pressed', async () => {
      const user = userEvent.setup();
      mockUseEvidence.mockReturnValue({
        data: [mockEvidenceItem],
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('evidence-item')).toBeInTheDocument();
      });

      // Open panel
      await user.click(screen.getByTestId('evidence-item'));

      await waitFor(() => {
        expect(screen.getByTestId('evidence-panel')).toBeInTheDocument();
      });

      // Press Escape to close
      await user.keyboard('{Escape}');

      // Panel should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('evidence-panel')).not.toBeInTheDocument();
      });
    });

    it('displays correct evidence details in panel', async () => {
      const user = userEvent.setup();
      mockUseEvidence.mockReturnValue({
        data: [mockEvidenceItem],
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('evidence-item')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('evidence-item'));

      await waitFor(() => {
        expect(screen.getByTestId('evidence-panel')).toBeInTheDocument();
        expect(screen.getByTestId('evidence-panel-domain')).toHaveTextContent(
          'example.com'
        );
        expect(screen.getByTestId('evidence-panel-url')).toHaveTextContent(
          'https://example.com/report#pricing'
        );
        expect(screen.getByTestId('evidence-panel-excerpt')).toHaveTextContent(
          'Key findings about the market'
        );
      });
    });
  });

  describe('StatusBadge with decisionType (Story 4-10)', () => {
    it('shows constrained badge when approved with constraint', async () => {
      mockUseQuestion.mockReturnValue({
        data: { ...mockQuestion, status: 'approved' },
        isLoading: false,
        error: null,
      });

      mockUseDecision.mockReturnValue({
        data: {
          id: 'd-1',
          question_id: 'q-1',
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'price' }],
          constraint_context: null,
          reasoning: null,
          incorporated_at: null,
          created_by: 'kel-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('status-badge-constrained')).toBeInTheDocument();
        expect(screen.getByTestId('constraint-chip-icon')).toBeInTheDocument();
      });
    });

    it('shows approved badge when no decision', async () => {
      mockUseQuestion.mockReturnValue({
        data: { ...mockQuestion, status: 'approved' },
        isLoading: false,
        error: null,
      });

      mockUseDecision.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<QuestionDetailClient questionId="q-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('status-badge-approved')).toBeInTheDocument();
      });
    });
  });
});
