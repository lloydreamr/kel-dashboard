import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { DashboardGrid } from './DashboardGrid';

describe('DashboardGrid', () => {
  const defaultProps = {
    statsContent: <div data-testid="stats-content">Stats Content</div>,
    opportunitiesContent: <div data-testid="opportunities-content">Opportunities Content</div>,
    navContent: <div data-testid="nav-content">Nav Content</div>,
  };

  it('renders with correct test id', () => {
    render(<DashboardGrid {...defaultProps} />);

    expect(screen.getByTestId('mi-dashboard-grid')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    render(<DashboardGrid {...defaultProps} />);

    expect(screen.getByTestId('mi-stats-section')).toBeInTheDocument();
    expect(screen.getByTestId('stats-content')).toBeInTheDocument();
  });

  it('renders opportunities content', () => {
    render(<DashboardGrid {...defaultProps} />);

    expect(screen.getByTestId('opportunities-content')).toBeInTheDocument();
  });

  it('renders quick navigation section', () => {
    render(<DashboardGrid {...defaultProps} />);

    expect(screen.getByTestId('mi-quick-nav-section')).toBeInTheDocument();
    expect(screen.getByTestId('nav-content')).toBeInTheDocument();
  });

  it('renders Quick Navigation heading', () => {
    render(<DashboardGrid {...defaultProps} />);

    expect(screen.getByText('Quick Navigation')).toBeInTheDocument();
  });

  it('has screen-reader only stats heading', () => {
    render(<DashboardGrid {...defaultProps} />);

    const statsHeading = screen.getByText('Knowledge Coverage Statistics');
    expect(statsHeading).toHaveClass('sr-only');
  });

  it('has screen-reader only opportunities heading', () => {
    render(<DashboardGrid {...defaultProps} />);

    const opportunitiesHeading = screen.getByText('Recent AI Insights');
    expect(opportunitiesHeading).toHaveClass('sr-only');
  });

  it('renders stats in 3-column grid on md screens', () => {
    render(<DashboardGrid {...defaultProps} />);

    const statsSection = screen.getByTestId('mi-stats-section');
    const grid = statsSection.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-3');
  });

  it('renders opportunities and nav in 2-column grid on lg screens', () => {
    render(<DashboardGrid {...defaultProps} />);

    const grid = screen.getByTestId('mi-dashboard-grid');
    const twoColumnGrid = grid.querySelector('.lg\\:grid-cols-2');
    expect(twoColumnGrid).toBeInTheDocument();
  });

  it('has proper aria-labelledby for stats section', () => {
    render(<DashboardGrid {...defaultProps} />);

    const statsSection = screen.getByTestId('mi-stats-section');
    expect(statsSection).toHaveAttribute('aria-labelledby', 'stats-heading');
  });

  it('has proper aria-labelledby for nav section', () => {
    render(<DashboardGrid {...defaultProps} />);

    const navSection = screen.getByTestId('mi-quick-nav-section');
    expect(navSection).toHaveAttribute('aria-labelledby', 'nav-heading');
  });
});
