import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuickCaptureFAB } from './QuickCaptureFAB';

describe('QuickCaptureFAB', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the FAB button', () => {
    render(<QuickCaptureFAB onClick={mockOnClick} />);

    const fab = screen.getByTestId('quick-capture-fab');
    expect(fab).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<QuickCaptureFAB onClick={mockOnClick} />);

    await user.click(screen.getByTestId('quick-capture-fab'));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<QuickCaptureFAB onClick={mockOnClick} disabled />);

    expect(screen.getByTestId('quick-capture-fab')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    render(<QuickCaptureFAB onClick={mockOnClick} disabled />);

    await user.click(screen.getByTestId('quick-capture-fab'));

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('has accessible label', () => {
    render(<QuickCaptureFAB onClick={mockOnClick} />);

    expect(
      screen.getByRole('button', { name: /quick capture photo/i })
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <QuickCaptureFAB onClick={mockOnClick} className="custom-class" />
    );

    expect(screen.getByTestId('quick-capture-fab')).toHaveClass('custom-class');
  });

  it('has fixed positioning classes', () => {
    render(<QuickCaptureFAB onClick={mockOnClick} />);

    const fab = screen.getByTestId('quick-capture-fab');
    expect(fab).toHaveClass('fixed');
    expect(fab).toHaveClass('bottom-6');
    expect(fab).toHaveClass('right-6');
  });

  it('has proper z-index for floating above content', () => {
    render(<QuickCaptureFAB onClick={mockOnClick} />);

    expect(screen.getByTestId('quick-capture-fab')).toHaveClass('z-50');
  });

  it('is circular (rounded-full)', () => {
    render(<QuickCaptureFAB onClick={mockOnClick} />);

    expect(screen.getByTestId('quick-capture-fab')).toHaveClass('rounded-full');
  });
});
