import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConstraintChip } from './ConstraintChip';

describe('ConstraintChip', () => {
  it('renders with correct label for price type', () => {
    render(<ConstraintChip type="price" selected={false} onToggle={() => {}} />);
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('renders with correct label for volume type', () => {
    render(<ConstraintChip type="volume" selected={false} onToggle={() => {}} />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('renders with correct label for risk type', () => {
    render(<ConstraintChip type="risk" selected={false} onToggle={() => {}} />);
    expect(screen.getByText('Risk')).toBeInTheDocument();
  });

  it('renders with correct label for timeline type', () => {
    render(
      <ConstraintChip type="timeline" selected={false} onToggle={() => {}} />
    );
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });

  it('has role="checkbox" for accessibility', () => {
    render(<ConstraintChip type="price" selected={false} onToggle={() => {}} />);
    const chip = screen.getByRole('checkbox');
    expect(chip).toBeInTheDocument();
  });

  it('sets aria-checked=false when not selected', () => {
    render(<ConstraintChip type="price" selected={false} onToggle={() => {}} />);
    const chip = screen.getByRole('checkbox');
    expect(chip).toHaveAttribute('aria-checked', 'false');
  });

  it('sets aria-checked=true when selected', () => {
    render(<ConstraintChip type="price" selected={true} onToggle={() => {}} />);
    const chip = screen.getByRole('checkbox');
    expect(chip).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ConstraintChip type="price" selected={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has correct test-id', () => {
    render(<ConstraintChip type="volume" selected={false} onToggle={() => {}} />);
    expect(screen.getByTestId('constraint-chip-volume')).toBeInTheDocument();
  });

  it('has 48px minimum height touch target', () => {
    render(<ConstraintChip type="price" selected={false} onToggle={() => {}} />);
    const chip = screen.getByRole('checkbox');
    expect(chip.className).toContain('min-h-[48px]');
  });

  it('applies selected styles when selected', () => {
    render(<ConstraintChip type="price" selected={true} onToggle={() => {}} />);
    const chip = screen.getByRole('checkbox');
    expect(chip.className).toContain('bg-success');
  });

  it('applies unselected styles when not selected', () => {
    render(<ConstraintChip type="price" selected={false} onToggle={() => {}} />);
    const chip = screen.getByRole('checkbox');
    expect(chip.className).toContain('border');
    expect(chip.className).toContain('text-muted-foreground');
  });

  it('includes accessible aria-label', () => {
    render(<ConstraintChip type="risk" selected={false} onToggle={() => {}} />);
    const chip = screen.getByRole('checkbox');
    expect(chip).toHaveAttribute('aria-label', 'Risk constraint');
  });

  it('applies additional className when provided', () => {
    render(
      <ConstraintChip
        type="price"
        selected={false}
        onToggle={() => {}}
        className="custom-class"
      />
    );
    const chip = screen.getByRole('checkbox');
    expect(chip.className).toContain('custom-class');
  });
});
