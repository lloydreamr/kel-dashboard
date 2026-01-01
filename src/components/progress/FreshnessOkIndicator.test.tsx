/**
 * FreshnessOkIndicator Component Tests
 *
 * Tests the OK indicator that displays when all questions in a category are fresh.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { FreshnessOkIndicator } from './FreshnessOkIndicator';

describe('FreshnessOkIndicator', () => {
  it('renders nothing when staleCount is greater than 0', () => {
    render(<FreshnessOkIndicator staleCount={1} />);

    expect(screen.queryByTestId('freshness-ok-indicator')).not.toBeInTheDocument();
  });

  it('renders nothing when staleCount is 5', () => {
    render(<FreshnessOkIndicator staleCount={5} />);

    expect(screen.queryByTestId('freshness-ok-indicator')).not.toBeInTheDocument();
  });

  it('renders indicator when staleCount is 0', () => {
    render(<FreshnessOkIndicator staleCount={0} />);

    expect(screen.getByTestId('freshness-ok-indicator')).toBeInTheDocument();
  });

  it('displays "All data current" text', () => {
    render(<FreshnessOkIndicator staleCount={0} />);

    expect(screen.getByText('All data current')).toBeInTheDocument();
  });

  it('applies muted text styling', () => {
    render(<FreshnessOkIndicator staleCount={0} />);

    const indicator = screen.getByTestId('freshness-ok-indicator');
    expect(indicator).toHaveClass('text-muted-foreground');
  });

  it('includes a check icon', () => {
    render(<FreshnessOkIndicator staleCount={0} />);

    // Check that the CheckCircle icon is rendered (lucide-react icons have SVG)
    const indicator = screen.getByTestId('freshness-ok-indicator');
    const svg = indicator.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
