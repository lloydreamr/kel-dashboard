/**
 * CompetitiveLandscapeSection Tests
 *
 * Unit tests for the competitive landscape pitch section component.
 * Story 18-2: Dynamic Data Integration in Pitch
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CompetitiveLandscapeSection } from './CompetitiveLandscapeSection';

import type { CompetitorDataPoint } from '@/types';

// Mock the hooks
vi.mock('@/hooks/competitors', () => ({
  useCompetitorData: vi.fn(),
}));

// Mock the ScatterChart component
vi.mock('@/components/visualization/ScatterChart', () => ({
  ScatterChart: vi.fn(({ isPitchMode }) => (
    <div data-testid="mock-scatter-chart" data-pitch-mode={isPitchMode}>
      Scatter Chart
    </div>
  )),
}));

// Import the mocked module to control it
import { useCompetitorData } from '@/hooks/competitors';

const mockUseCompetitorData = useCompetitorData as unknown as ReturnType<typeof vi.fn>;

// Test data
const mockCompetitors: CompetitorDataPoint[] = [
  {
    id: '1',
    name: 'Competitor A',
    category: 'snacks',
    price_score: 5,
    quality_score: 7,
    is_kel_position: false,
    notes: null,
    created_by: 'test-user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Kel Target',
    category: 'snacks',
    price_score: 4,
    quality_score: 8,
    is_kel_position: true,
    notes: null,
    created_by: 'test-user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('CompetitiveLandscapeSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton while fetching data', () => {
    mockUseCompetitorData.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection />);

    expect(screen.getByTestId('competitive-landscape-skeleton')).toBeInTheDocument();
    expect(screen.getByText('Competitive Landscape')).toBeInTheDocument();
  });

  it('renders scatter chart with isPitchMode={true} when data is loaded', () => {
    mockUseCompetitorData.mockReturnValue({
      data: mockCompetitors,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection />);

    const chart = screen.getByTestId('mock-scatter-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('data-pitch-mode', 'true');
  });

  it('renders empty state when no competitors exist', () => {
    mockUseCompetitorData.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection />);

    expect(screen.getByTestId('competitive-landscape-empty')).toBeInTheDocument();
    expect(screen.getByText('No competitor data available')).toBeInTheDocument();
  });

  it('renders error state with retry button on error', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({});
    mockUseCompetitorData.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection />);

    expect(screen.getByTestId('competitive-landscape-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load competitor data')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await userEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('displays refresh button with correct test id', () => {
    mockUseCompetitorData.mockReturnValue({
      data: mockCompetitors,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection />);

    expect(screen.getByTestId('refresh-competitive-landscape')).toBeInTheDocument();
  });

  it('calls refetch and onRefresh when refresh button is clicked', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({});
    const mockOnRefresh = vi.fn();
    mockUseCompetitorData.mockReturnValue({
      data: mockCompetitors,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByTestId('refresh-competitive-landscape');
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it('shows spinning animation on refresh button while fetching', () => {
    mockUseCompetitorData.mockReturnValue({
      data: mockCompetitors,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: true,
    });

    render(<CompetitiveLandscapeSection />);

    const refreshButton = screen.getByTestId('refresh-competitive-landscape');
    expect(refreshButton).toBeDisabled();
    // The RefreshCw icon should have animate-spin class
    const icon = refreshButton.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });

  it('displays section type label and description', () => {
    mockUseCompetitorData.mockReturnValue({
      data: mockCompetitors,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection />);

    expect(screen.getByText('Competitive Landscape')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Interactive price-quality scatter chart showing competitive positioning'
      )
    ).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    mockUseCompetitorData.mockReturnValue({
      data: mockCompetitors,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(<CompetitiveLandscapeSection className="custom-class" />);

    const section = screen.getByTestId('pitch-section-competitive_landscape');
    expect(section).toHaveClass('custom-class');
  });
});
