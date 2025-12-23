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

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
});
