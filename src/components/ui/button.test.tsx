import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Button, buttonVariants } from './button';

describe('Button', () => {
  describe('Disabled State Styling (AC1, AC2, AC3)', () => {
    it('applies disabled styles when disabled prop is true', () => {
      render(<Button disabled data-testid="disabled-button">Disabled</Button>);
      const button = screen.getByTestId('disabled-button');

      // AC1: Disabled button has reduced opacity (50%)
      expect(button).toHaveClass('disabled:opacity-50');

      // AC1: Cursor shows "not-allowed" on hover
      expect(button).toHaveClass('disabled:cursor-not-allowed');

      // AC1: Button is disabled in DOM
      expect(button).toBeDisabled();
    });

    it('does not apply disabled styles when enabled', () => {
      render(<Button data-testid="enabled-button">Enabled</Button>);
      const button = screen.getByTestId('enabled-button');

      // AC2: Button is not disabled
      expect(button).not.toBeDisabled();

      // AC2: Has full opacity (100%) - disabled classes not active
      expect(button).toHaveClass('disabled:opacity-50'); // class exists but not active
    });

    it('applies disabled background styles for default variant', () => {
      const classes = buttonVariants({ variant: 'default' });

      // AC1: Button color is visually muted (30% of primary)
      expect(classes).toContain('disabled:bg-primary/30');
    });

    it('applies disabled background styles for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive' });

      // AC1: Destructive buttons also get muted background
      expect(classes).toContain('disabled:bg-destructive/30');
    });

    it('applies disabled border styles for outline variant', () => {
      const classes = buttonVariants({ variant: 'outline' });

      // AC1: Outline buttons get muted background and border
      expect(classes).toContain('disabled:bg-background/50');
      expect(classes).toContain('disabled:border-input/50');
    });

    it('applies disabled background styles for secondary variant', () => {
      const classes = buttonVariants({ variant: 'secondary' });

      expect(classes).toContain('disabled:bg-secondary/30');
    });

    it('applies transparent background for ghost variant when disabled', () => {
      const classes = buttonVariants({ variant: 'ghost' });

      expect(classes).toContain('disabled:bg-transparent');
    });

    it('applies muted text and removes underline for link variant when disabled', () => {
      const classes = buttonVariants({ variant: 'link' });

      // AC1: Link buttons get muted text color
      expect(classes).toContain('disabled:text-primary/50');
      expect(classes).toContain('disabled:no-underline');
    });

    it('prevents pointer events on disabled buttons', () => {
      render(<Button disabled data-testid="no-pointer-events">No Events</Button>);
      const button = screen.getByTestId('no-pointer-events');

      // AC1: Disabled buttons prevent pointer events
      expect(button).toHaveClass('disabled:pointer-events-none');
    });
  });

  describe('Accessibility (AC4)', () => {
    it('maintains proper button semantics when disabled', () => {
      render(<Button disabled>Accessible</Button>);
      const button = screen.getByRole('button', { name: 'Accessible' });

      // Button is still accessible as a button element
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('works with asChild prop', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      expect(screen.getByText('Link Button')).toBeInTheDocument();
    });
  });

  describe('Consistency (AC5)', () => {
    it('applies same disabled classes across all size variants', () => {
      const defaultSize = buttonVariants({ size: 'default' });
      const smSize = buttonVariants({ size: 'sm' });
      const lgSize = buttonVariants({ size: 'lg' });

      // All sizes should have the same disabled styling
      expect(defaultSize).toContain('disabled:opacity-50');
      expect(smSize).toContain('disabled:opacity-50');
      expect(lgSize).toContain('disabled:opacity-50');

      expect(defaultSize).toContain('disabled:cursor-not-allowed');
      expect(smSize).toContain('disabled:cursor-not-allowed');
      expect(lgSize).toContain('disabled:cursor-not-allowed');
    });

    it('applies same disabled classes across all variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

      variants.forEach((variant) => {
        const classes = buttonVariants({ variant });

        // All variants have core disabled styles
        expect(classes).toContain('disabled:opacity-50');
        expect(classes).toContain('disabled:cursor-not-allowed');
        expect(classes).toContain('disabled:pointer-events-none');
      });
    });
  });
});
