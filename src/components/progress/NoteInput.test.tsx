import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NoteInput } from './NoteInput';

describe('NoteInput', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea and buttons', () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByTestId('note-input-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('note-save-button')).toBeInTheDocument();
    expect(screen.getByTestId('note-cancel-button')).toBeInTheDocument();
  });

  it('has placeholder text', () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByPlaceholderText('Add your note...')).toBeInTheDocument();
  });

  it('calls onSave with trimmed content when save clicked', async () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    const textarea = screen.getByTestId('note-input-textarea');
    await userEvent.type(textarea, '  Test note  ');
    await userEvent.click(screen.getByTestId('note-save-button'));

    expect(mockOnSave).toHaveBeenCalledWith('Test note');
  });

  it('calls onCancel when cancel clicked', async () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    await userEvent.click(screen.getByTestId('note-cancel-button'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables save button when content is empty', () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    const saveButton = screen.getByTestId('note-save-button');
    expect(saveButton).toBeDisabled();
  });

  it('disables save button when content is only whitespace', async () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    const textarea = screen.getByTestId('note-input-textarea');
    await userEvent.type(textarea, '   ');

    const saveButton = screen.getByTestId('note-save-button');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when content is valid', async () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    const textarea = screen.getByTestId('note-input-textarea');
    await userEvent.type(textarea, 'Valid content');

    const saveButton = screen.getByTestId('note-save-button');
    expect(saveButton).not.toBeDisabled();
  });

  it('shows loading state during save', () => {
    render(
      <NoteInput
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isPending={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByTestId('note-save-button')).toBeDisabled();
    expect(screen.getByTestId('note-cancel-button')).toBeDisabled();
    expect(screen.getByTestId('note-input-textarea')).toBeDisabled();
  });

  it('uses initialValue when provided', () => {
    render(
      <NoteInput
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        initialValue="Initial content"
      />
    );

    const textarea = screen.getByTestId('note-input-textarea');
    expect(textarea).toHaveValue('Initial content');
  });

  it('has 48px touch targets on buttons', () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    const saveButton = screen.getByTestId('note-save-button');
    const cancelButton = screen.getByTestId('note-cancel-button');

    expect(saveButton).toHaveClass('min-h-[48px]');
    expect(cancelButton).toHaveClass('min-h-[48px]');
  });

  it('does not call onSave if content is empty', async () => {
    render(<NoteInput onSave={mockOnSave} onCancel={mockOnCancel} />);

    const textarea = screen.getByTestId('note-input-textarea');
    await userEvent.type(textarea, 'Text');
    await userEvent.clear(textarea);

    // Button should be disabled, but try clicking anyway
    const saveButton = screen.getByTestId('note-save-button');
    expect(saveButton).toBeDisabled();
  });
});
