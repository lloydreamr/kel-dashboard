import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EvidenceEditForm } from './EvidenceEditForm';

import type { Evidence } from '@/types/evidence';

const mockEvidence: Evidence = {
  id: 'e1',
  question_id: 'q1',
  title: 'Original Title',
  url: 'https://example.com/original',
  section_anchor: '#section',
  excerpt: 'Original excerpt',
  created_by: 'user1',
  created_at: '2024-12-24T00:00:00Z',
};

describe('EvidenceEditForm', () => {
  it('pre-fills form with evidence values', () => {
    render(
      <EvidenceEditForm
        evidence={mockEvidence}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByTestId('evidence-edit-title-input')).toHaveValue('Original Title');
    expect(screen.getByTestId('evidence-edit-url-input')).toHaveValue('https://example.com/original');
    expect(screen.getByTestId('evidence-edit-anchor-input')).toHaveValue('#section');
    expect(screen.getByTestId('evidence-edit-excerpt-input')).toHaveValue('Original excerpt');
  });

  it('disables submit when form is unchanged', () => {
    render(
      <EvidenceEditForm
        evidence={mockEvidence}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByTestId('evidence-edit-submit')).toBeDisabled();
  });

  it('enables submit when form is modified and valid', async () => {
    const user = userEvent.setup();
    render(
      <EvidenceEditForm
        evidence={mockEvidence}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    await user.clear(screen.getByTestId('evidence-edit-title-input'));
    await user.type(screen.getByTestId('evidence-edit-title-input'), 'Updated Title');

    expect(screen.getByTestId('evidence-edit-submit')).not.toBeDisabled();
  });

  it('calls onSubmit with updated data', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = vi.fn();
    render(
      <EvidenceEditForm
        evidence={mockEvidence}
        onCancel={vi.fn()}
        onSubmit={mockOnSubmit}
      />
    );

    const titleInput = screen.getByTestId('evidence-edit-title-input');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    // Verify button is enabled before clicking
    const submitButton = screen.getByTestId('evidence-edit-submit');
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check the data was correct
    const callArgs = mockOnSubmit.mock.calls[0][0];
    expect(callArgs.title).toBe('Updated Title');
    expect(callArgs.url).toBe('https://example.com/original');
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = vi.fn();
    render(
      <EvidenceEditForm
        evidence={mockEvidence}
        onCancel={mockOnCancel}
        onSubmit={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows submitting state', () => {
    render(
      <EvidenceEditForm
        evidence={mockEvidence}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting
      />
    );

    expect(screen.getByTestId('evidence-edit-submit')).toHaveTextContent('Saving...');
  });

  it('handles null section_anchor and excerpt gracefully', () => {
    const evidenceWithNulls: Evidence = {
      ...mockEvidence,
      section_anchor: null,
      excerpt: null,
    };

    render(
      <EvidenceEditForm
        evidence={evidenceWithNulls}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByTestId('evidence-edit-anchor-input')).toHaveValue('');
    expect(screen.getByTestId('evidence-edit-excerpt-input')).toHaveValue('');
  });

  it('has accessible form with proper labels', () => {
    render(
      <EvidenceEditForm
        evidence={mockEvidence}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/URL/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Section Anchor/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Excerpt/)).toBeInTheDocument();
  });
});
