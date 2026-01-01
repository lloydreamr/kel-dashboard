import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { QuestionCard } from './QuestionCard';

import type { Question } from '@/types/question';

// Mock date to get consistent relative time output
const mockDate = new Date('2025-12-23T12:00:00Z');

describe('QuestionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockQuestion: Question = {
    id: 'q-123',
    title: 'What is the target market size?',
    description: 'Research the total addressable market',
    category: 'market',
    status: 'draft',
    recommendation: null,
    recommendation_rationale: null,
    viewed_by_kel_at: null,
    created_by: 'user-123',
    created_at: '2025-12-23T10:00:00Z', // 2 hours ago from mockDate
    updated_at: '2025-12-23T10:00:00Z',
  };

  it('renders with correct test ID', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByTestId('question-card')).toBeInTheDocument();
  });

  it('displays question title', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText('What is the target market size?')).toBeInTheDocument();
  });

  it('links to the question detail page', () => {
    render(<QuestionCard question={mockQuestion} />);
    const link = screen.getByTestId('question-card');
    expect(link).toHaveAttribute('href', '/questions/q-123');
  });

  it('displays status badge with per-status test-id', () => {
    render(<QuestionCard question={mockQuestion} />);
    // Story 4-10: Uses per-status test-id now
    expect(screen.getByTestId('status-badge-draft')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('uses simple status in list view (no decisionType)', () => {
    // Story 4-10: QuestionCard intentionally does NOT fetch decision
    // to avoid N+1 queries. List view shows question.status only.
    const approvedQuestion = { ...mockQuestion, status: 'approved' as const };
    render(<QuestionCard question={approvedQuestion} />);

    // Shows status-badge-approved (not constrained) because no decision data
    expect(screen.getByTestId('status-badge-approved')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('displays relative time', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('displays "Just now" for very recent questions', () => {
    const recentQuestion = {
      ...mockQuestion,
      created_at: '2025-12-23T11:59:50Z', // 10 seconds ago
    };
    render(<QuestionCard question={recentQuestion} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('displays correct status for ready_for_kel', () => {
    const readyQuestion = { ...mockQuestion, status: 'ready_for_kel' as const };
    render(<QuestionCard question={readyQuestion} />);
    expect(screen.getByText('Sent to Kel')).toBeInTheDocument();
  });

  describe('stale data badge', () => {
    it('renders stale-question-badge wrapper', () => {
      render(<QuestionCard question={mockQuestion} />);
      expect(screen.getByTestId('stale-question-badge')).toBeInTheDocument();
    });

    it('does not show stale indicator for fresh data', () => {
      render(<QuestionCard question={mockQuestion} />);
      expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();
    });

    it('shows stale indicator for data older than 14 days', () => {
      const staleDate = new Date(mockDate);
      staleDate.setDate(staleDate.getDate() - 20); // 20 days ago
      const staleQuestion = {
        ...mockQuestion,
        updated_at: staleDate.toISOString(),
      };
      render(<QuestionCard question={staleQuestion} />);
      expect(screen.getByTestId('stale-data-indicator')).toBeInTheDocument();
      expect(screen.getByText('Stale')).toBeInTheDocument();
    });

    it('does not show stale indicator at 14 day boundary', () => {
      const boundaryDate = new Date(mockDate);
      boundaryDate.setDate(boundaryDate.getDate() - 14); // Exactly 14 days ago
      const boundaryQuestion = {
        ...mockQuestion,
        updated_at: boundaryDate.toISOString(),
      };
      render(<QuestionCard question={boundaryQuestion} />);
      expect(screen.queryByTestId('stale-data-indicator')).not.toBeInTheDocument();
    });
  });
});
