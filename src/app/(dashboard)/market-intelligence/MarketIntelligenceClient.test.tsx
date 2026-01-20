import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useDashboardStats, useCommandPalette } from '@/hooks/market-intelligence';

import { MarketIntelligenceClient } from './MarketIntelligenceClient';

import type { DashboardStats } from '@/hooks/market-intelligence';

// Mock the market-intelligence hooks
vi.mock('@/hooks/market-intelligence', () => ({
  useDashboardStats: vi.fn(),
  useCommandPalette: vi.fn(),
  useGlobalSearch: vi.fn(() => ({
    results: null,
    isLoading: false,
    error: null,
  })),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock next/navigation for CommandPalette
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock scrollIntoView for cmdk (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

const mockUseDashboardStats = vi.mocked(useDashboardStats);
const mockUseCommandPalette = vi.mocked(useCommandPalette);

const createMockStats = (overrides?: Partial<DashboardStats>): DashboardStats => ({
  counts: {
    companies: 5,
    products: 10,
    research: 3,
    questions: 7,
  },
  recentOpportunities: [],
  lastUpdated: new Date('2024-06-15T12:00:00Z'),
  isLoading: false,
  error: null,
  ...overrides,
});

describe('MarketIntelligenceClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useCommandPalette
    mockUseCommandPalette.mockReturnValue({
      isOpen: false,
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    });
  });

  describe('loading state', () => {
    it('renders loading skeleton when data is loading', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({ isLoading: true })
      );

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-page-loading')).toBeInTheDocument();
    });

    it('shows 3 stat card skeletons in loading state', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({ isLoading: true })
      );

      render(<MarketIntelligenceClient />);

      const skeletons = screen.getAllByTestId('mi-stat-card-skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('shows recent opportunities skeleton in loading state', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({ isLoading: true })
      );

      render(<MarketIntelligenceClient />);

      expect(
        screen.getByTestId('mi-recent-opportunities-skeleton')
      ).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message when hook returns error', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({ error: new Error('Failed to fetch') })
      );

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-page-error')).toBeInTheDocument();
      expect(
        screen.getByText('Failed to load dashboard data. Please try again.')
      ).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state when no data exists', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({
          counts: { companies: 0, products: 0, research: 0, questions: 0 },
          recentOpportunities: [],
        })
      );

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No data yet')).toBeInTheDocument();
    });

    it('shows helpful message in empty state', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({
          counts: { companies: 0, products: 0, research: 0, questions: 0 },
          recentOpportunities: [],
        })
      );

      render(<MarketIntelligenceClient />);

      expect(
        screen.getByText(/Start adding companies, products, and research documents/)
      ).toBeInTheDocument();
    });
  });

  describe('stat cards', () => {
    it('renders stat cards with correct counts', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      // Check companies stat card
      const companiesCard = screen.getByTestId('mi-stat-card-companies');
      expect(within(companiesCard).getByText('5')).toBeInTheDocument();
      expect(within(companiesCard).getByText('Companies')).toBeInTheDocument();

      // Check products stat card
      const productsCard = screen.getByTestId('mi-stat-card-products');
      expect(within(productsCard).getByText('10')).toBeInTheDocument();
      expect(within(productsCard).getByText('Products')).toBeInTheDocument();

      // Check research stat card
      const researchCard = screen.getByTestId('mi-stat-card-research');
      expect(within(researchCard).getByText('3')).toBeInTheDocument();
      expect(within(researchCard).getByText('Research')).toBeInTheDocument();
    });

    it('stat cards link to correct browse pages', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      // Find links by their href
      const links = screen.getAllByRole('link');

      // Check that browse page links exist
      expect(
        links.some((link) =>
          link.getAttribute('href') === '/market-intelligence/companies'
        )
      ).toBe(true);
      expect(
        links.some((link) =>
          link.getAttribute('href') === '/market-intelligence/products'
        )
      ).toBe(true);
      expect(
        links.some((link) =>
          link.getAttribute('href') === '/market-intelligence/research'
        )
      ).toBe(true);
    });
  });

  describe('recent opportunities', () => {
    it('renders recent opportunities section', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-recent-opportunities')).toBeInTheDocument();
    });

    it('displays opportunity items when available', () => {
      const opportunities = [
        {
          id: 'opp-1',
          title: 'Market Gap: Premium snacks',
          category: 'market_gap',
          confidence_score: 85,
          description: null,
          supporting_evidence: [],
          status: 'new',
          generated_at: '2024-06-15T12:00:00Z',
          reviewed_at: null,
          created_at: '2024-06-15T12:00:00Z',
          updated_at: '2024-06-15T12:00:00Z',
        },
        {
          id: 'opp-2',
          title: 'Competitive Weakness: Oishi distribution',
          category: 'competitive_weakness',
          confidence_score: 78,
          description: null,
          supporting_evidence: [],
          status: 'new',
          generated_at: '2024-06-15T12:00:00Z',
          reviewed_at: null,
          created_at: '2024-06-15T12:00:00Z',
          updated_at: '2024-06-15T12:00:00Z',
        },
      ];

      mockUseDashboardStats.mockReturnValue(
        createMockStats({ recentOpportunities: opportunities })
      );

      render(<MarketIntelligenceClient />);

      expect(screen.getByText('Market Gap: Premium snacks')).toBeInTheDocument();
      expect(
        screen.getByText('Competitive Weakness: Oishi distribution')
      ).toBeInTheDocument();
    });

    it('shows empty opportunities message when none exist', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({ recentOpportunities: [] })
      );

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-opportunities-empty')).toBeInTheDocument();
    });
  });

  describe('quick navigation', () => {
    it('renders quick navigation cards', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-nav-card-companies')).toBeInTheDocument();
      expect(screen.getByTestId('mi-nav-card-products')).toBeInTheDocument();
      expect(screen.getByTestId('mi-nav-card-research')).toBeInTheDocument();
      expect(screen.getByTestId('mi-nav-card-opportunities')).toBeInTheDocument();
      expect(screen.getByTestId('mi-nav-card-ask')).toBeInTheDocument();
      // Story 17.3: Visualization QuickNavCard
      expect(screen.getByTestId('mi-nav-card-visualization')).toBeInTheDocument();
      // Story 17.4: Questions QuickNavCard
      expect(screen.getByTestId('mi-nav-card-questions')).toBeInTheDocument();
    });

    it('quick nav cards link to correct pages', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      const links = screen.getAllByRole('link');

      expect(
        links.some((link) =>
          link.getAttribute('href') === '/market-intelligence/opportunities'
        )
      ).toBe(true);
      expect(
        links.some((link) =>
          link.getAttribute('href') === '/market-intelligence/ask'
        )
      ).toBe(true);
      // Story 17.3: Visualization link
      expect(
        links.some((link) =>
          link.getAttribute('href') === '/market-intelligence/visualization'
        )
      ).toBe(true);
      // Story 17.4: Questions link
      expect(
        links.some((link) =>
          link.getAttribute('href') === '/market-intelligence/questions'
        )
      ).toBe(true);
    });
  });

  describe('dashboard header', () => {
    it('renders dashboard header with title', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(
        screen.getByText('Market Intelligence Dashboard')
      ).toBeInTheDocument();
    });

    it('shows last updated timestamp', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      // formatDistanceToNow will show something like "about X months ago"
      expect(screen.getByText(/Last updated/)).toBeInTheDocument();
    });

    it('header exists with correct test id', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(
        screen.getByTestId('mi-dashboard-header')
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders main content with role', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders dashboard grid with test id', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-dashboard-grid')).toBeInTheDocument();
    });
  });

  describe('global search', () => {
    it('renders global search component when data exists', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-global-search')).toBeInTheDocument();
    });

    it('renders global search input', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(screen.getByTestId('mi-global-search-input')).toBeInTheDocument();
    });

    it('does not render global search in loading state', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({ isLoading: true })
      );

      render(<MarketIntelligenceClient />);

      expect(screen.queryByTestId('mi-global-search')).not.toBeInTheDocument();
    });

    it('does not render global search in error state', () => {
      mockUseDashboardStats.mockReturnValue(
        createMockStats({ error: new Error('Failed') })
      );

      render(<MarketIntelligenceClient />);

      expect(screen.queryByTestId('mi-global-search')).not.toBeInTheDocument();
    });
  });

  describe('command palette', () => {
    it('uses command palette hook', () => {
      mockUseDashboardStats.mockReturnValue(createMockStats());

      render(<MarketIntelligenceClient />);

      expect(mockUseCommandPalette).toHaveBeenCalled();
    });
  });
});
