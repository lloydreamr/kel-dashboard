import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DiscardDraftDialog } from './DiscardDraftDialog';

describe('DiscardDraftDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <DiscardDraftDialog
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.queryByTestId('discard-confirm-dialog')
    ).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(
      <DiscardDraftDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Discard unsaved changes\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your draft response will be lost/i)
    ).toBeInTheDocument();
  });

  it('calls onConfirm when discard button clicked', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = vi.fn();
    render(
      <DiscardDraftDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={mockOnConfirm}
      />
    );

    await user.click(screen.getByTestId('discard-confirm-button'));

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onOpenChange(false) when cancel button clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    render(
      <DiscardDraftDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('has 48px touch targets on buttons', () => {
    render(
      <DiscardDraftDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('discard-confirm-button')).toHaveClass(
      'min-h-[48px]'
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveClass(
      'min-h-[48px]'
    );
  });

  it('has destructive styling on discard button', () => {
    render(
      <DiscardDraftDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('discard-confirm-button')).toHaveClass(
      'bg-destructive'
    );
  });
});
