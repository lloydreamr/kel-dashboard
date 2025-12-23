import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecommendationForm } from './RecommendationForm';

describe('RecommendationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with correct test IDs', () => {
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByTestId('recommendation-form')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-text')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-rationale')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-submit')).toBeInTheDocument();
  });

  it('has placeholder text on rationale field', () => {
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(
      screen.getByPlaceholderText('Why do you recommend this?')
    ).toBeInTheDocument();
  });

  it('disables submit button when recommendation is empty', () => {
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByTestId('recommendation-submit')).toBeDisabled();
  });

  it('enables submit button when recommendation is filled', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await user.type(
      screen.getByTestId('recommendation-text'),
      'My recommendation'
    );

    await waitFor(() => {
      expect(screen.getByTestId('recommendation-submit')).toBeEnabled();
    });
  });

  it('shows validation error when recommendation is empty after blur', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const input = screen.getByTestId('recommendation-text');
    await user.click(input);
    await user.type(input, 'a');
    await user.clear(input);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/recommendation is required/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await user.type(
      screen.getByTestId('recommendation-text'),
      'My recommendation'
    );
    await user.type(
      screen.getByTestId('recommendation-rationale'),
      'Because reasons'
    );
    await user.click(screen.getByTestId('recommendation-submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs).toEqual({
        recommendation: 'My recommendation',
        recommendation_rationale: 'Because reasons',
      });
    });
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await user.click(screen.getByText('Cancel'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('pre-fills values in edit mode', () => {
    render(
      <RecommendationForm
        initialValues={{
          recommendation: 'Existing rec',
          recommendation_rationale: 'Existing rationale',
        }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('recommendation-text')).toHaveValue('Existing rec');
    expect(screen.getByTestId('recommendation-rationale')).toHaveValue(
      'Existing rationale'
    );
  });

  it('shows "Update" button text in edit mode', () => {
    render(
      <RecommendationForm
        initialValues={{
          recommendation: 'Existing rec',
        }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('recommendation-submit')).toHaveTextContent(
      'Update'
    );
  });

  it('shows "Add" button text in create mode', () => {
    render(
      <RecommendationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByTestId('recommendation-submit')).toHaveTextContent('Add');
  });

  it('shows "Saving..." when isSubmitting is true', () => {
    render(
      <RecommendationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    expect(screen.getByTestId('recommendation-submit')).toHaveTextContent(
      'Saving...'
    );
    expect(screen.getByTestId('recommendation-submit')).toBeDisabled();
  });
});
