import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RemoveEvidenceDialog } from './RemoveEvidenceDialog';

describe('RemoveEvidenceDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <RemoveEvidenceDialog
        open={false}
        onOpenChange={vi.fn()}
        evidenceTitle="Test Evidence"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByTestId('evidence-remove-dialog')).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(
      <RemoveEvidenceDialog
        open={true}
        onOpenChange={vi.fn()}
        evidenceTitle="Test Evidence"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('evidence-remove-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Remove this evidence\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Evidence/)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = vi.fn();
    render(
      <RemoveEvidenceDialog
        open={true}
        onOpenChange={vi.fn()}
        evidenceTitle="Test Evidence"
        onConfirm={mockOnConfirm}
      />
    );

    await user.click(screen.getByTestId('evidence-remove-confirm'));

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('shows pending state', () => {
    render(
      <RemoveEvidenceDialog
        open={true}
        onOpenChange={vi.fn()}
        evidenceTitle="Test Evidence"
        onConfirm={vi.fn()}
        isPending
      />
    );

    expect(screen.getByTestId('evidence-remove-confirm')).toHaveTextContent('Removing...');
    expect(screen.getByTestId('evidence-remove-confirm')).toBeDisabled();
  });

  it('has 48px touch targets', () => {
    render(
      <RemoveEvidenceDialog
        open={true}
        onOpenChange={vi.fn()}
        evidenceTitle="Test Evidence"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('evidence-remove-confirm')).toHaveClass('min-h-[48px]');
  });

  it('displays evidence title in description', () => {
    render(
      <RemoveEvidenceDialog
        open={true}
        onOpenChange={vi.fn()}
        evidenceTitle="My Research Paper"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/My Research Paper/)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel button clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    render(
      <RemoveEvidenceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        evidenceTitle="Test Evidence"
        onConfirm={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables cancel button when isPending', () => {
    render(
      <RemoveEvidenceDialog
        open={true}
        onOpenChange={vi.fn()}
        evidenceTitle="Test Evidence"
        onConfirm={vi.fn()}
        isPending
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
