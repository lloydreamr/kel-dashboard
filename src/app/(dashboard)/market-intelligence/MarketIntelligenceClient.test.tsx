import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { MarketIntelligenceClient } from './MarketIntelligenceClient';

describe('MarketIntelligenceClient', () => {
  it('renders the page container with correct test id', () => {
    render(<MarketIntelligenceClient />);

    expect(screen.getByTestId('market-intelligence-page')).toBeInTheDocument();
  });

  it('renders the page header with correct test id', () => {
    render(<MarketIntelligenceClient />);

    const header = screen.getByTestId('mi-page-header');
    expect(header).toBeInTheDocument();
  });

  it('renders the page title', () => {
    render(<MarketIntelligenceClient />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Market Intelligence Dashboard/i })
    ).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    render(<MarketIntelligenceClient />);

    expect(
      screen.getByText(/Philippine snack market research and competitive analysis/i)
    ).toBeInTheDocument();
  });

  it('renders the content area with correct test id', () => {
    render(<MarketIntelligenceClient />);

    expect(screen.getByTestId('mi-content-area')).toBeInTheDocument();
  });

  it('renders placeholder content indicating future features', () => {
    render(<MarketIntelligenceClient />);

    expect(
      screen.getByText(/Market research data, competitor analysis, and consumer insights/i)
    ).toBeInTheDocument();
  });

  it('has proper semantic structure with header element', () => {
    render(<MarketIntelligenceClient />);

    const header = screen.getByTestId('mi-page-header');
    expect(header.tagName.toLowerCase()).toBe('header');
  });

  it('applies accessible main content role', () => {
    render(<MarketIntelligenceClient />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('content area has descriptive aria-label', () => {
    render(<MarketIntelligenceClient />);

    const contentArea = screen.getByTestId('mi-content-area');
    expect(contentArea).toHaveAttribute('aria-label', 'Market intelligence content');
  });
});
