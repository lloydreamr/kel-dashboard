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

  it('displays status badge', () => {
    render(<QuestionCard question={mockQuestion} />);
    expect(screen.getByTestId('question-status')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
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
});
