import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConstraintDisplay } from './ConstraintDisplay';

import type { Constraint } from '@/types/decision';

describe('ConstraintDisplay', () => {
  describe('rendering', () => {
    it('renders with correct test-id', () => {
      render(<ConstraintDisplay constraints={[]} />);
      expect(screen.getByTestId('constraint-display')).toBeInTheDocument();
    });

    it('renders nothing when constraints array is empty', () => {
      render(<ConstraintDisplay constraints={[]} />);
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
      // No chips rendered
      expect(
        screen.queryByTestId('constraint-display-chip-price')
      ).not.toBeInTheDocument();
    });
  });

  describe('constraint chips', () => {
    it('renders single constraint chip with correct label', () => {
      const constraints: Constraint[] = [{ type: 'price' }];
      render(<ConstraintDisplay constraints={constraints} />);

      expect(
        screen.getByTestId('constraint-display-chip-price')
      ).toHaveTextContent('Price');
    });

    it('renders multiple constraint chips', () => {
      const constraints: Constraint[] = [
        { type: 'price' },
        { type: 'volume' },
        { type: 'timeline' },
      ];
      render(<ConstraintDisplay constraints={constraints} />);

      expect(
        screen.getByTestId('constraint-display-chip-price')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('constraint-display-chip-volume')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('constraint-display-chip-timeline')
      ).toBeInTheDocument();
    });

    it('renders all four preset constraint types correctly', () => {
      const constraints: Constraint[] = [
        { type: 'price' },
        { type: 'volume' },
        { type: 'risk' },
        { type: 'timeline' },
      ];
      render(<ConstraintDisplay constraints={constraints} />);

      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('Risk')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('handles custom constraint types (not in presets)', () => {
      const constraints: Constraint[] = [{ type: 'custom_constraint' }];
      render(<ConstraintDisplay constraints={constraints} />);

      // Custom types are displayed as-is
      expect(screen.getByText('custom_constraint')).toBeInTheDocument();
    });

    it('applies correct styling to constraint chips', () => {
      const constraints: Constraint[] = [{ type: 'price' }];
      render(<ConstraintDisplay constraints={constraints} />);

      const chip = screen.getByTestId('constraint-display-chip-price');
      expect(chip).toHaveClass('bg-success/10');
      expect(chip).toHaveClass('text-success');
      expect(chip).toHaveClass('rounded-full');
    });
  });

  describe('context text', () => {
    it('does not render context when not provided', () => {
      const constraints: Constraint[] = [{ type: 'price' }];
      render(<ConstraintDisplay constraints={constraints} />);

      expect(
        screen.queryByTestId('constraint-display-context')
      ).not.toBeInTheDocument();
    });

    it('renders context text when provided', () => {
      const constraints: Constraint[] = [{ type: 'price' }];
      render(
        <ConstraintDisplay
          constraints={constraints}
          context="Budget cannot exceed $50,000"
        />
      );

      expect(screen.getByTestId('constraint-display-context')).toHaveTextContent(
        'Budget cannot exceed $50,000'
      );
    });

    it('renders context even with empty constraints', () => {
      render(<ConstraintDisplay constraints={[]} context="Some context" />);

      expect(screen.getByTestId('constraint-display-context')).toHaveTextContent(
        'Some context'
      );
    });

    it('applies correct styling to context text', () => {
      render(
        <ConstraintDisplay constraints={[]} context="Context text here" />
      );

      const contextEl = screen.getByTestId('constraint-display-context');
      expect(contextEl).toHaveClass('text-muted-foreground');
      expect(contextEl).toHaveClass('text-sm');
    });
  });

  describe('accessibility', () => {
    it('chips are not interactive (no button role)', () => {
      const constraints: Constraint[] = [{ type: 'price' }];
      render(<ConstraintDisplay constraints={constraints} />);

      const chip = screen.getByTestId('constraint-display-chip-price');
      expect(chip.tagName).toBe('SPAN');
    });
  });
});
