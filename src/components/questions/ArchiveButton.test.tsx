import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ArchiveButton } from './ArchiveButton';

describe('ArchiveButton', () => {
  it('renders archive button', () => {
    render(<ArchiveButton onConfirm={vi.fn()} />);

    expect(screen.getByTestId('archive-button')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('shows pending state', () => {
    render(<ArchiveButton onConfirm={vi.fn()} isPending />);

    expect(screen.getByText('Archiving...')).toBeInTheDocument();
    expect(screen.getByTestId('archive-button')).toBeDisabled();
  });

  it('opens confirmation dialog on click', () => {
    render(<ArchiveButton onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByTestId('archive-button'));

    expect(screen.getByTestId('archive-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText('Archive this question?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The question will be moved to the archive. You can restore it later if needed.'
      )
    ).toBeInTheDocument();
  });

  it('calls onConfirm when Archive action is clicked', () => {
    const mockConfirm = vi.fn();
    render(<ArchiveButton onConfirm={mockConfirm} />);

    fireEvent.click(screen.getByTestId('archive-button'));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes dialog when Cancel is clicked', () => {
    render(<ArchiveButton onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByTestId('archive-button'));
    expect(screen.getByTestId('archive-confirm-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByTestId('archive-confirm-dialog')).not.toBeInTheDocument();
  });

  it('displays archive icon', () => {
    render(<ArchiveButton onConfirm={vi.fn()} />);

    // The Archive icon from lucide-react renders an SVG
    const button = screen.getByTestId('archive-button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
