import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CategoryEmptyState } from './CategoryEmptyState';

describe('CategoryEmptyState', () => {
  it('renders with correct test ID', () => {
    render(<CategoryEmptyState category="market" />);
    expect(screen.getByTestId('category-empty-state')).toBeInTheDocument();
  });

  it('displays correct message for market category', () => {
    render(<CategoryEmptyState category="market" />);
    expect(screen.getByText('No Market questions yet')).toBeInTheDocument();
  });

  it('displays correct message for product category', () => {
    render(<CategoryEmptyState category="product" />);
    expect(screen.getByText('No Product questions yet')).toBeInTheDocument();
  });

  it('displays correct message for distribution category', () => {
    render(<CategoryEmptyState category="distribution" />);
    expect(screen.getByText('No Distribution questions yet')).toBeInTheDocument();
  });
});
