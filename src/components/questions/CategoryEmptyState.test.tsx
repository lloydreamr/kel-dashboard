import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CategoryEmptyState } from './CategoryEmptyState';

describe('CategoryEmptyState', () => {
  it('renders with correct test ID', () => {
    render(<CategoryEmptyState category="market" />);
    expect(screen.getByTestId('category-empty-state')).toBeInTheDocument();
  });

  describe('Kel Role (default)', () => {
    it('displays informational message for market category', () => {
      render(<CategoryEmptyState category="market" />);
      expect(screen.getByText('No Market questions yet.')).toBeInTheDocument();
    });

    it('displays informational message for product category', () => {
      render(<CategoryEmptyState category="product" />);
      expect(screen.getByText('No Product questions yet.')).toBeInTheDocument();
    });

    it('displays informational message for distribution category', () => {
      render(<CategoryEmptyState category="distribution" />);
      expect(screen.getByText('No Distribution questions yet.')).toBeInTheDocument();
    });
  });

  describe('Maho Role', () => {
    it('displays actionable message for market category', () => {
      render(<CategoryEmptyState category="market" isMaho={true} />);
      expect(screen.getByText('No Market questions yet. Add one to get started.')).toBeInTheDocument();
    });

    it('displays actionable message for product category', () => {
      render(<CategoryEmptyState category="product" isMaho={true} />);
      expect(screen.getByText('No Product questions yet. Add one to get started.')).toBeInTheDocument();
    });

    it('displays actionable message for distribution category', () => {
      render(<CategoryEmptyState category="distribution" isMaho={true} />);
      expect(screen.getByText('No Distribution questions yet. Add one to get started.')).toBeInTheDocument();
    });
  });

  describe('Styling (AC #5)', () => {
    it('uses consistent dashed border styling', () => {
      render(<CategoryEmptyState category="market" />);

      const emptyState = screen.getByTestId('category-empty-state');
      expect(emptyState).toHaveClass('border-dashed');
      expect(emptyState).toHaveClass('border-border');
      expect(emptyState).toHaveClass('bg-muted/20');
    });
  });
});
