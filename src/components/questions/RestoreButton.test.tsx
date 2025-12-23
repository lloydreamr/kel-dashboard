import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { RestoreButton } from './RestoreButton';

describe('RestoreButton', () => {
  it('renders restore button', () => {
    render(<RestoreButton onRestore={vi.fn()} />);

    expect(screen.getByTestId('restore-button')).toBeInTheDocument();
    expect(screen.getByText('Restore')).toBeInTheDocument();
  });

  it('shows pending state', () => {
    render(<RestoreButton onRestore={vi.fn()} isPending />);

    expect(screen.getByText('Restoring...')).toBeInTheDocument();
    expect(screen.getByTestId('restore-button')).toBeDisabled();
  });

  it('calls onRestore when clicked', () => {
    const mockRestore = vi.fn();
    render(<RestoreButton onRestore={mockRestore} />);

    fireEvent.click(screen.getByTestId('restore-button'));

    expect(mockRestore).toHaveBeenCalledTimes(1);
  });

  it('does not call onRestore when disabled', () => {
    const mockRestore = vi.fn();
    render(<RestoreButton onRestore={mockRestore} isPending />);

    fireEvent.click(screen.getByTestId('restore-button'));

    expect(mockRestore).not.toHaveBeenCalled();
  });

  it('displays restore icon', () => {
    render(<RestoreButton onRestore={vi.fn()} />);

    // The RotateCcw icon from lucide-react renders an SVG
    const button = screen.getByTestId('restore-button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
