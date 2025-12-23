import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecommendationDisplay } from './RecommendationDisplay';

describe('RecommendationDisplay', () => {
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct test IDs', () => {
    render(
      <RecommendationDisplay
        recommendation="Test recommendation"
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByTestId('recommendation-display')).toBeInTheDocument();
    expect(screen.getByTestId('edit-recommendation-button')).toBeInTheDocument();
  });

  it('displays recommendation text', () => {
    render(
      <RecommendationDisplay
        recommendation="This is my recommendation"
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('This is my recommendation')).toBeInTheDocument();
  });

  it('displays rationale when provided', () => {
    render(
      <RecommendationDisplay
        recommendation="Test rec"
        rationale="Because this is the best approach"
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Rationale')).toBeInTheDocument();
    expect(
      screen.getByText('Because this is the best approach')
    ).toBeInTheDocument();
  });

  it('does not display rationale section when not provided', () => {
    render(
      <RecommendationDisplay
        recommendation="Test rec"
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByText('Rationale')).not.toBeInTheDocument();
  });

  it('does not display rationale section when null', () => {
    render(
      <RecommendationDisplay
        recommendation="Test rec"
        rationale={null}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.queryByText('Rationale')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationDisplay
        recommendation="Test rec"
        onEdit={mockOnEdit}
      />
    );

    await user.click(screen.getByTestId('edit-recommendation-button'));

    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('applies opacity-50 class when isPending is true', () => {
    render(
      <RecommendationDisplay
        recommendation="Test rec"
        onEdit={mockOnEdit}
        isPending={true}
      />
    );

    expect(screen.getByTestId('recommendation-display')).toHaveClass('opacity-50');
  });

  it('does not apply opacity-50 class when isPending is false', () => {
    render(
      <RecommendationDisplay
        recommendation="Test rec"
        onEdit={mockOnEdit}
        isPending={false}
      />
    );

    expect(screen.getByTestId('recommendation-display')).not.toHaveClass(
      'opacity-50'
    );
  });
});
