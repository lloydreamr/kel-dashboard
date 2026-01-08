import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VirtualizedQuestionsList } from './VirtualizedQuestionsList';

import type { Question } from '@/types/database';

// Mock Next.js navigation (needed by QuestionCard)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock QuestionCardActions to avoid QueryClient dependency
vi.mock('./QuestionCardActions', () => ({
  QuestionCardActions: ({ questionId }: { questionId: string }) => (
    <div data-testid="question-card-actions" data-question-id={questionId} />
  ),
}));

// Mock the useProfile hook
const mockUseProfile = vi.fn();
vi.mock('@/hooks/auth', () => ({
  useProfile: () => mockUseProfile(),
}));

vi.mock('@/hooks/auth/useProfile', () => ({
  useProfile: () => mockUseProfile(),
}));

// Generate mock questions
function generateMockQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i}`,
    title: `Question ${i}`,
    description: null,
    category: 'market' as const,
    status: 'draft' as const,
    recommendation: null,
    recommendation_rationale: null,
    viewed_by_kel_at: null,
    created_by: 'user-123',
    created_at: '2025-12-23T10:00:00Z',
    updated_at: '2025-12-23T10:00:00Z',
  }));
}

describe('VirtualizedQuestionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfile.mockReturnValue({ data: { role: 'maho' } });
  });

  it('renders the virtualized list container', () => {
    const questions = generateMockQuestions(5);

    render(<VirtualizedQuestionsList questions={questions} />);

    expect(screen.getByTestId('questions-list')).toBeInTheDocument();
  });

  it('renders with correct structure for virtualization', () => {
    const questions = generateMockQuestions(10);

    render(<VirtualizedQuestionsList questions={questions} />);

    // Container should have relative positioning for virtual items
    const container = screen.getByTestId('questions-list');
    const innerContainer = container.querySelector('div');
    expect(innerContainer).toHaveStyle({ position: 'relative' });
  });

  it('applies scroll container styles', () => {
    const questions = generateMockQuestions(5);

    render(<VirtualizedQuestionsList questions={questions} />);

    const container = screen.getByTestId('questions-list');
    expect(container).toHaveClass('overflow-auto');
  });

  it('does not render all items at once (virtualization active)', () => {
    // In jsdom, viewport has 0 dimensions, so virtualizer renders 0 items initially
    // This actually proves virtualization is working - non-virtualized list would render all 250
    const questions = generateMockQuestions(250);

    render(<VirtualizedQuestionsList questions={questions} />);

    // Query for question cards (not data-index, since virtualizer may not render any)
    const questionCards = screen.queryAllByTestId('question-card');

    // Virtualization means we should NOT have all 250 cards in the DOM
    // In jsdom with 0 height, virtualizer renders 0 items (which is correct behavior)
    expect(questionCards.length).toBeLessThan(250);
  });

  it('provides questions to virtualizer for rendering', () => {
    const questions = generateMockQuestions(5);

    render(<VirtualizedQuestionsList questions={questions} />);

    // The inner container should exist and have height set for all items
    const container = screen.getByTestId('questions-list');
    const innerContainer = container.querySelector('div');

    // Height should be set based on estimated item size (120px) * count
    // 5 items * 120px = 600px
    const height = parseInt(innerContainer?.style.height || '0', 10);
    expect(height).toBe(600);
  });

  it('calculates total scroll height correctly for large lists', () => {
    const questions = generateMockQuestions(250);

    render(<VirtualizedQuestionsList questions={questions} />);

    const container = screen.getByTestId('questions-list');
    const innerContainer = container.querySelector('div');

    // 250 items * 120px estimated size = 30000px
    const height = parseInt(innerContainer?.style.height || '0', 10);
    expect(height).toBe(30000);
  });

  it('applies CSS containment for performance', () => {
    const questions = generateMockQuestions(5);

    render(<VirtualizedQuestionsList questions={questions} />);

    const container = screen.getByTestId('questions-list');

    // CSS containment improves rendering performance
    expect(container).toHaveStyle({ contain: 'strict' });
  });

  it('uses default maxHeight when not specified', () => {
    const questions = generateMockQuestions(5);

    render(<VirtualizedQuestionsList questions={questions} />);

    const container = screen.getByTestId('questions-list');

    // Default maxHeight should be applied
    expect(container).toHaveStyle({ maxHeight: 'calc(100vh - 300px)' });
  });

  it('accepts custom maxHeight prop', () => {
    const questions = generateMockQuestions(5);

    render(<VirtualizedQuestionsList questions={questions} maxHeight="500px" />);

    const container = screen.getByTestId('questions-list');

    // Custom maxHeight should be applied
    expect(container).toHaveStyle({ maxHeight: '500px' });
  });
});
