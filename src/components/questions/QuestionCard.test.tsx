import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createMockQuestionWithEvidenceCount } from '@/test/factories';

import { QuestionCard } from './QuestionCard';

// Mock date to get consistent relative time output
const mockDate = new Date('2025-12-23T12:00:00Z');

// Mock hooks
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Default mock: Kel role (no actions visible)
vi.mock('@/hooks/auth/useProfile', () => ({
  useProfile: () => ({
    data: { role: 'kel' },
  }),
}));

// Mock the QuestionCardActions component to simplify tests
vi.mock('./QuestionCardActions', () => ({
  QuestionCardActions: ({ questionId }: { questionId: string }) => (
    <div data-testid="question-card-actions" data-question-id={questionId} />
  ),
}));

describe('QuestionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Use factory with specific overrides for time-sensitive tests
  const mockQuestion = createMockQuestionWithEvidenceCount({
    id: 'q-123',
    title: 'What is the target market size?',
    description: 'Research the total addressable market',
    category: 'market',
    status: 'draft',
    created_at: '2025-12-23T10:00:00Z', // 2 hours ago from mockDate
    updated_at: '2025-12-23T10:00:00Z',
    evidence_count: 3,
  });

  it('renders with correct test ID', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByTestId('question-card')).toBeInTheDocument();
  });

  it('displays question title', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByText('What is the target market size?')).toBeInTheDocument();
  });

  it('navigates to the question detail page on click', async () => {
    // Use real timers for this test - navigation doesn't need fake timers
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<QuestionCard question={mockQuestion} />);

    await user.click(screen.getByTestId('question-card'));

    expect(mockPush).toHaveBeenCalledWith('/questions/q-123');
    // Restore fake timers for subsequent tests
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
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

  it('displays evidence count', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByTestId('evidence-count')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows zero evidence count', () => {
    const noEvidenceQuestion = { ...mockQuestion, evidence_count: 0 };
    render(<QuestionCard question={noEvidenceQuestion} />);
    expect(screen.getByTestId('evidence-count')).toHaveTextContent('0');
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
