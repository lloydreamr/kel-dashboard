import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { QuestionsList } from './QuestionsList';

import type { Question } from '@/types/question';

// Mock the useQuestions hook directly
const mockUseQuestions = vi.fn();
vi.mock('@/hooks/questions/useQuestions', () => ({
  useQuestions: () => mockUseQuestions(),
}));

// Mock date for consistent relative time
const mockNow = new Date('2025-12-23T12:00:00Z');

const mockQuestions: Question[] = [
  {
    id: 'q-1',
    title: 'Market question 1',
    description: null,
    category: 'market',
    status: 'draft',
    recommendation: null,
    recommendation_rationale: null,
    viewed_by_kel_at: null,
    created_by: 'user-123',
    created_at: '2025-12-23T10:00:00Z',
    updated_at: '2025-12-23T10:00:00Z',
  },
  {
    id: 'q-2',
    title: 'Product question 1',
    description: null,
    category: 'product',
    status: 'ready_for_kel',
    recommendation: 'Use this product',
    recommendation_rationale: null,
    viewed_by_kel_at: null,
    created_by: 'user-123',
    created_at: '2025-12-23T09:00:00Z',
    updated_at: '2025-12-23T09:00:00Z',
  },
  {
    id: 'q-3',
    title: 'Market question 2',
    description: null,
    category: 'market',
    status: 'approved',
    recommendation: 'Do this',
    recommendation_rationale: null,
    viewed_by_kel_at: '2025-12-23T11:00:00Z',
    created_by: 'user-123',
    created_at: '2025-12-23T08:00:00Z',
    updated_at: '2025-12-23T08:00:00Z',
  },
];

describe('QuestionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading skeleton while fetching', () => {
    mockUseQuestions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<QuestionsList />);

    expect(screen.getByTestId('questions-list-skeleton')).toBeInTheDocument();
  });

  it('shows global empty state when no questions exist', () => {
    mockUseQuestions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<QuestionsList />);

    expect(screen.getByTestId('questions-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('No questions yet. Create your first strategic question.')
    ).toBeInTheDocument();
  });

  it('shows error state when fetch fails', () => {
    mockUseQuestions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    render(<QuestionsList />);

    expect(screen.getByText('Failed to load questions')).toBeInTheDocument();
  });

  it('renders all three category sections', () => {
    mockUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });

    render(<QuestionsList />);

    expect(screen.getByTestId('questions-list')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-market')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-product')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-distribution')).toBeInTheDocument();
  });

  it('groups questions by category correctly', () => {
    mockUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });

    render(<QuestionsList />);

    // Market has 2 questions
    expect(screen.getByText('Market question 1')).toBeInTheDocument();
    expect(screen.getByText('Market question 2')).toBeInTheDocument();

    // Product has 1 question
    expect(screen.getByText('Product question 1')).toBeInTheDocument();

    // Distribution should show empty state
    expect(screen.getByText('No Distribution questions yet')).toBeInTheDocument();
  });

  it('shows correct count in category headers', () => {
    mockUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });

    render(<QuestionsList />);

    expect(screen.getByText('2 questions')).toBeInTheDocument(); // Market
    expect(screen.getByText('1 question')).toBeInTheDocument(); // Product
    expect(screen.getByText('0 questions')).toBeInTheDocument(); // Distribution
  });

  it('shows per-category empty state for empty categories', () => {
    mockUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });

    render(<QuestionsList />);

    // Distribution has no questions
    expect(screen.getByText('No Distribution questions yet')).toBeInTheDocument();
    expect(screen.getByTestId('category-empty-state')).toBeInTheDocument();
  });

  it('renders question cards with correct data', () => {
    mockUseQuestions.mockReturnValue({
      data: mockQuestions,
      isLoading: false,
      error: null,
    });

    render(<QuestionsList />);

    // Check that question cards are rendered
    const questionCards = screen.getAllByTestId('question-card');
    expect(questionCards).toHaveLength(3);

    // Check status badges
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Sent to Kel')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});
