import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';

import { MarkCompleteDialog } from './MarkCompleteDialog';

import type { ClarityCategory } from '@/types';

describe('MarkCompleteDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    category: 'market' as ClarityCategory,
    onConfirm: mockOnConfirm,
    isPending: false,
  };

  it('renders dialog when open is true', () => {
    render(<MarkCompleteDialog {...defaultProps} />);

    expect(screen.getByTestId('milestone-complete-dialog')).toBeInTheDocument();
  });

  it('displays correct category name in title - market', () => {
    render(<MarkCompleteDialog {...defaultProps} category="market" />);

    expect(
      screen.getByText(/Mark Market clarity as complete?/i)
    ).toBeInTheDocument();
  });

  it('displays correct category name in title - product', () => {
    render(<MarkCompleteDialog {...defaultProps} category="product" />);

    expect(
      screen.getByText(/Mark Product clarity as complete?/i)
    ).toBeInTheDocument();
  });

  it('displays correct category name in title - distribution', () => {
    render(<MarkCompleteDialog {...defaultProps} category="distribution" />);

    expect(
      screen.getByText(/Mark Distribution clarity as complete?/i)
    ).toBeInTheDocument();
  });

  it('displays confirmation description', () => {
    render(<MarkCompleteDialog {...defaultProps} />);

    expect(
      screen.getByText(/This indicates Kel has approved the formal clarity document/i)
    ).toBeInTheDocument();
  });

  it('renders Cancel button with 48px touch target', () => {
    render(<MarkCompleteDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveClass('min-h-[48px]');
  });

  it('renders Mark Complete button with 48px touch target', () => {
    render(<MarkCompleteDialog {...defaultProps} />);

    const confirmButton = screen.getByTestId('milestone-complete-confirm');
    expect(confirmButton).toHaveClass('min-h-[48px]');
  });

  it('calls onConfirm when Mark Complete is clicked', async () => {
    const user = userEvent.setup();
    render(<MarkCompleteDialog {...defaultProps} />);

    const confirmButton = screen.getByTestId('milestone-complete-confirm');
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<MarkCompleteDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables buttons when isPending is true', () => {
    render(<MarkCompleteDialog {...defaultProps} isPending={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const confirmButton = screen.getByTestId('milestone-complete-confirm');

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it('shows loading text when isPending is true', () => {
    render(<MarkCompleteDialog {...defaultProps} isPending={true} />);

    expect(screen.getByText(/Marking complete.../i)).toBeInTheDocument();
  });

  it('shows normal text when isPending is false', () => {
    render(<MarkCompleteDialog {...defaultProps} isPending={false} />);

    expect(screen.getByText(/^Mark Complete$/i)).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<MarkCompleteDialog {...defaultProps} open={false} />);

    expect(
      screen.queryByTestId('milestone-complete-dialog')
    ).not.toBeInTheDocument();
  });
});
