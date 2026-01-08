import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Button, buttonVariants } from './button';

describe('Button', () => {
  describe('Disabled State Styling (P1-2 UX Audit)', () => {
    it('applies disabled styles when disabled prop is true', () => {
      render(<Button disabled data-testid="disabled-button">Disabled</Button>);
      const button = screen.getByTestId('disabled-button');

      // AC1: Disabled button has reduced opacity (50%)
      expect(button).toHaveClass('disabled:opacity-50');

      // AC2: Cursor shows "not-allowed" on hover
      expect(button).toHaveClass('disabled:cursor-not-allowed');

      // Button is disabled in DOM
      expect(button).toBeDisabled();
    });

    it('does not apply disabled styles when enabled', () => {
      render(<Button data-testid="enabled-button">Enabled</Button>);
      const button = screen.getByTestId('enabled-button');

      // AC3: Enabled button is not disabled
      expect(button).not.toBeDisabled();

      // Has full opacity (100%) - disabled classes not active
      expect(button).toHaveClass('disabled:opacity-50'); // class exists but not active
    });

    it('applies hover:disabled:bg override for default variant to prevent hover effects', () => {
      const classes = buttonVariants({ variant: 'default' });

      // AC5: Disabled buttons don't show hover state color changes
      expect(classes).toContain('hover:disabled:bg-primary');
    });

    it('applies hover:disabled:bg override for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive' });

      // AC5: Destructive disabled buttons don't show hover state
      expect(classes).toContain('hover:disabled:bg-destructive');
    });

    it('applies disabled border styles for outline variant', () => {
      const classes = buttonVariants({ variant: 'outline' });

      // AC5: Outline buttons get muted border
      expect(classes).toContain('disabled:border-muted');
      expect(classes).toContain('hover:disabled:bg-background');
    });

    it('applies hover:disabled:bg override for secondary variant', () => {
      const classes = buttonVariants({ variant: 'secondary' });

      expect(classes).toContain('hover:disabled:bg-secondary');
    });

    it('applies transparent background for ghost variant when disabled', () => {
      const classes = buttonVariants({ variant: 'ghost' });

      expect(classes).toContain('hover:disabled:bg-transparent');
    });

    it('removes underline for link variant when disabled', () => {
      const classes = buttonVariants({ variant: 'link' });

      // AC5: Link buttons remove underline when disabled
      expect(classes).toContain('disabled:no-underline');
    });

    it('allows pointer events for cursor feedback (AC2: cursor-not-allowed)', () => {
      render(<Button disabled data-testid="cursor-button">Cursor</Button>);
      const button = screen.getByTestId('cursor-button');

      // We intentionally DON'T use pointer-events-none
      // This allows cursor:not-allowed to work for accessibility
      expect(button).not.toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
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
        // We intentionally DON'T use pointer-events-none for accessibility
      });
    });
  });
});
