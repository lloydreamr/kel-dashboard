import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecentOpportunities } from './RecentOpportunities';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('RecentOpportunities', () => {
  const mockOpportunities = [
    {
      id: '1',
      title: 'Expand to Metro Manila',
      category: 'market_expansion',
      confidence_score: 85,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      title: 'Partner with Local Distributor',
      category: 'partnership',
      confidence_score: 72,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
    },
    {
      id: '3',
      title: 'Launch New Product Line',
      category: 'product_development',
      confidence_score: 60,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-17T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct test id', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    expect(screen.getByTestId('mi-recent-opportunities')).toBeInTheDocument();
  });

  it('renders title "Recent AI Insights"', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    expect(screen.getByText('Recent AI Insights')).toBeInTheDocument();
  });

  it('renders opportunities list when data exists', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    expect(screen.getByTestId('mi-opportunities-list')).toBeInTheDocument();
  });

  it('renders each opportunity with test id', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    expect(screen.getByTestId('mi-opportunity-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('mi-opportunity-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('mi-opportunity-item-3')).toBeInTheDocument();
  });

  it('displays opportunity titles', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    expect(screen.getByText('Expand to Metro Manila')).toBeInTheDocument();
    expect(screen.getByText('Partner with Local Distributor')).toBeInTheDocument();
    expect(screen.getByText('Launch New Product Line')).toBeInTheDocument();
  });

  it('displays confidence scores with percent', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('formats category from snake_case to Title Case', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    expect(screen.getByText('Market Expansion')).toBeInTheDocument();
    expect(screen.getByText('Partnership')).toBeInTheDocument();
    expect(screen.getByText('Product Development')).toBeInTheDocument();
  });

  it('limits display to 3 opportunities', () => {
    const manyOpportunities = [
      ...mockOpportunities,
      {
        id: '4',
        title: 'Fourth Opportunity',
        category: 'other',
        confidence_score: 50,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-18T00:00:00Z',
      },
    ];

    render(<RecentOpportunities opportunities={manyOpportunities} />);

    expect(screen.queryByText('Fourth Opportunity')).not.toBeInTheDocument();
  });

  it('shows "View All" link when opportunities exist', () => {
    render(<RecentOpportunities opportunities={mockOpportunities} />);

    const viewAllLink = screen.getByTestId('mi-view-all-opportunities');
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute('href', '/market-intelligence/opportunities');
  });

  it('shows empty state when no opportunities', () => {
    render(<RecentOpportunities opportunities={[]} />);

    expect(screen.getByTestId('mi-opportunities-empty')).toBeInTheDocument();
    expect(screen.getByText('No AI insights yet.')).toBeInTheDocument();
    expect(screen.getByText('Add research data to generate opportunities.')).toBeInTheDocument();
  });

  it('hides "View All" link when no opportunities', () => {
    render(<RecentOpportunities opportunities={[]} />);

    expect(screen.queryByTestId('mi-view-all-opportunities')).not.toBeInTheDocument();
  });

  it('does not render opportunities list when empty', () => {
    render(<RecentOpportunities opportunities={[]} />);

    expect(screen.queryByTestId('mi-opportunities-list')).not.toBeInTheDocument();
  });
});
