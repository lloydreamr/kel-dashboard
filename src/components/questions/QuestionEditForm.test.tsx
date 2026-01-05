import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuestionEditForm } from './QuestionEditForm';

describe('QuestionEditForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultInitialValues = {
    title: 'Original Title',
    description: 'Original Description',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with correct test IDs', () => {
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('question-edit-form')).toBeInTheDocument();
    expect(screen.getByTestId('question-edit-title')).toBeInTheDocument();
    expect(screen.getByTestId('question-edit-description')).toBeInTheDocument();
    expect(screen.getByTestId('question-edit-save')).toBeInTheDocument();
    expect(screen.getByTestId('question-edit-cancel')).toBeInTheDocument();
  });

  it('pre-fills form with current values', () => {
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('question-edit-title')).toHaveValue(
      'Original Title'
    );
    expect(screen.getByTestId('question-edit-description')).toHaveValue(
      'Original Description'
    );
  });

  it('handles null description correctly', () => {
    render(
      <QuestionEditForm
        initialValues={{ title: 'Test Title', description: null }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('question-edit-description')).toHaveValue('');
  });

  it('calls onSubmit with updated data when Save clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByTestId('question-edit-title');
    const descInput = screen.getByTestId('question-edit-description');

    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');
    await user.clear(descInput);
    await user.type(descInput, 'New Description');
    await user.click(screen.getByTestId('question-edit-save'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Title',
        description: 'New Description',
      });
    });
  });

  it('converts empty description to null on submit', async () => {
    const user = userEvent.setup();
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const descInput = screen.getByTestId('question-edit-description');
    await user.clear(descInput);
    await user.click(screen.getByTestId('question-edit-save'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs.description).toBeNull();
    });
  });

  it('trims whitespace-only description to null', async () => {
    const user = userEvent.setup();
    render(
      <QuestionEditForm
        initialValues={{ title: 'Test', description: null }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const descInput = screen.getByTestId('question-edit-description');
    await user.type(descInput, '   ');
    await user.click(screen.getByTestId('question-edit-save'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs.description).toBeNull();
    });
  });

  it('calls onCancel when Cancel button clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByTestId('question-edit-cancel'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel when Escape key pressed', async () => {
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables Save button when title is empty', async () => {
    const user = userEvent.setup();
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByTestId('question-edit-title');
    await user.clear(titleInput);

    await waitFor(() => {
      expect(screen.getByTestId('question-edit-save')).toBeDisabled();
    });
  });

  it('shows validation error when title is cleared', async () => {
    const user = userEvent.setup();
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByTestId('question-edit-title');
    await user.clear(titleInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('title-error')).toBeInTheDocument();
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('shows "Saving..." when isSubmitting is true', () => {
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    expect(screen.getByTestId('question-edit-save')).toHaveTextContent(
      'Saving...'
    );
    expect(screen.getByTestId('question-edit-save')).toBeDisabled();
  });

  it('enables Save button when title is valid', async () => {
    render(
      <QuestionEditForm
        initialValues={defaultInitialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Wait for form validation to complete
    await waitFor(() => {
      expect(screen.getByTestId('question-edit-save')).toBeEnabled();
    });
  });
});
