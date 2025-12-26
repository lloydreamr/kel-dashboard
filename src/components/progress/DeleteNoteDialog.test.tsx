import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteNoteDialog } from './DeleteNoteDialog';

describe('DeleteNoteDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(
      <DeleteNoteDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByTestId('note-delete-dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <DeleteNoteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('note-delete-dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete this note?')).toBeInTheDocument();
    expect(
      screen.getByText(/This will permanently delete this note/i)
    ).toBeInTheDocument();
  });

  it('calls onConfirm when Delete button clicked', async () => {
    render(
      <DeleteNoteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    await userEvent.click(screen.getByTestId('note-delete-confirm'));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange when Cancel clicked', async () => {
    render(
      <DeleteNoteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    await userEvent.click(screen.getByText('Cancel'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading state during deletion', () => {
    render(
      <DeleteNoteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        isPending={true}
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByTestId('note-delete-confirm')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('has 48px touch targets on buttons', () => {
    render(
      <DeleteNoteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByTestId('note-delete-confirm');

    expect(cancelButton).toHaveClass('min-h-[48px]');
    expect(deleteButton).toHaveClass('min-h-[48px]');
  });

  it('uses destructive styling for Delete button', () => {
    render(
      <DeleteNoteDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteButton = screen.getByTestId('note-delete-confirm');
    expect(deleteButton).toHaveClass('bg-destructive');
  });
});
