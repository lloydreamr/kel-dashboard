/**
 * MarketGapsSection Tests
 *
 * Unit tests for the market gaps pitch section component.
 * Story 18-2: Dynamic Data Integration in Pitch
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MarketGapsSection } from './MarketGapsSection';

import type { Opportunity } from '@/lib/repositories/opportunities';

// Mock the hooks
vi.mock('@/hooks/opportunities', () => ({
  useOpportunities: vi.fn(),
}));

// Mock the SupportingEvidenceSection component
vi.mock('@/components/opportunities/SupportingEvidenceSection', () => ({
  SupportingEvidenceSection: vi.fn(({ evidence }) => (
    <div data-testid="mock-supporting-evidence">
      Evidence count: {Array.isArray(evidence) ? evidence.length : 0}
    </div>
  )),
}));

// Import the mocked module to control it
import { useOpportunities } from '@/hooks/opportunities';

const mockUseOpportunities = useOpportunities as unknown as ReturnType<typeof vi.fn>;

// Test data
const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Premium Segment Gap',
    description: 'High-quality snacks at premium price point underserved',
    category: 'market_gap',
    status: 'new',
    confidence_score: 0.85,
    supporting_evidence: [
      {
        entity_type: 'company',
        entity_id: 'c1',
        relevance_score: 0.9,
        excerpt: 'Evidence excerpt 1',
      },
    ],
    generated_at: '2024-01-01T00:00:00Z',
    reviewed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Value Segment Opportunity',
    description: 'Affordable healthy snacks for students',
    category: 'market_gap',
    status: 'new',
    confidence_score: 0.72,
    supporting_evidence: [],
    generated_at: '2024-01-01T00:00:00Z',
    reviewed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'Product Feature Opportunity',
    description: 'This is a product opportunity, not market gap',
    category: 'product_opportunity',
    status: 'new',
    confidence_score: 0.65,
    supporting_evidence: [],
    generated_at: '2024-01-01T00:00:00Z',
    reviewed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('MarketGapsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton while fetching data', () => {
    mockUseOpportunities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    expect(screen.getByTestId('market-gaps-skeleton')).toBeInTheDocument();
    expect(screen.getByText('Market Gaps')).toBeInTheDocument();
  });

  it('renders opportunities filtered by market_gap category', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    // Should show market_gap opportunities
    expect(screen.getByText('Premium Segment Gap')).toBeInTheDocument();
    expect(screen.getByText('Value Segment Opportunity')).toBeInTheDocument();

    // Should NOT show product_opportunity category
    expect(screen.queryByText('Product Feature Opportunity')).not.toBeInTheDocument();
  });

  it('limits displayed opportunities based on maxItems prop', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection maxItems={1} />);

    const cards = screen.getAllByTestId('pitch-opportunity-card');
    expect(cards).toHaveLength(1);
    expect(screen.getByText('Premium Segment Gap')).toBeInTheDocument();
  });

  it('renders empty state when no market_gap opportunities exist', () => {
    mockUseOpportunities.mockReturnValue({
      data: [mockOpportunities[2]], // Only product_opportunity category
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    expect(screen.getByTestId('market-gaps-empty')).toBeInTheDocument();
    expect(screen.getByText('No market gap opportunities identified')).toBeInTheDocument();
  });

  it('renders error state with retry button on error', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({});
    mockUseOpportunities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
      isFetching: false,
    });

    render(<MarketGapsSection />);

    expect(screen.getByTestId('market-gaps-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load opportunities data')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await userEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('displays refresh button with correct test id', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    expect(screen.getByTestId('refresh-market-gaps')).toBeInTheDocument();
  });

  it('calls refetch and onRefresh when refresh button is clicked', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({});
    const mockOnRefresh = vi.fn();
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    });

    render(<MarketGapsSection onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByTestId('refresh-market-gaps');
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it('shows spinning animation on refresh button while fetching', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: true,
    });

    render(<MarketGapsSection />);

    const refreshButton = screen.getByTestId('refresh-market-gaps');
    expect(refreshButton).toBeDisabled();
    const icon = refreshButton.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });

  it('displays opportunity cards with title, description, and confidence score', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    // Check first opportunity
    expect(screen.getByText('Premium Segment Gap')).toBeInTheDocument();
    expect(
      screen.getByText('High-quality snacks at premium price point underserved')
    ).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays category badge for each opportunity', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    // Should show Market Gap badges
    const badges = screen.getAllByText('Market Gap');
    expect(badges).toHaveLength(2);
  });

  it('includes supporting evidence section for each opportunity', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    const evidenceSections = screen.getAllByTestId('mock-supporting-evidence');
    expect(evidenceSections).toHaveLength(2);
  });

  it('displays section type label and description', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection />);

    expect(screen.getByText('Market Gaps')).toBeInTheDocument();
    expect(
      screen.getByText('AI-identified market opportunities with supporting evidence')
    ).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    mockUseOpportunities.mockReturnValue({
      data: mockOpportunities,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<MarketGapsSection className="custom-class" />);

    const section = screen.getByTestId('pitch-section-market_gaps');
    expect(section).toHaveClass('custom-class');
  });
});
