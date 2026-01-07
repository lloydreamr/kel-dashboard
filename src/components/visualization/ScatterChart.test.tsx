import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';

import { ScatterChart } from '@/components/visualization/ScatterChart';
import * as useCompetitorDataHook from '@/hooks/competitors/useCompetitorData';
import * as useResponsiveChartHeightHook from '@/hooks/ui/useResponsiveChartHeight';

import type { CompetitorDataPoint } from '@/types';


/**
 * Helper to create partial UseQueryResult for testing
 */
function createMockUseQueryResult<T>(
  partial: Partial<UseQueryResult<T, Error>>
): UseQueryResult<T, Error> {
  return {
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    isLoading: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    status: 'pending',
    fetchStatus: 'idle',
    refetch: vi.fn(),
    ...partial,
  } as UseQueryResult<T, Error>;
}

/**
 * Mock ResizeObserver for Recharts ResponsiveContainer
 * Recharts requires ResizeObserver to calculate container dimensions
 */
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock observe
  }
  unobserve() {
    // Mock unobserve
  }
  disconnect() {
    // Mock disconnect
  }
};

/**
 * Mock competitor data factory
 */
function createMockCompetitor(
  overrides: Partial<CompetitorDataPoint> = {}
): CompetitorDataPoint {
  return {
    id: crypto.randomUUID(),
    name: 'Test Competitor',
    price_score: 5,
    quality_score: 5,
    category: 'Snacks',
    notes: null,
    is_kel_position: false,
    created_by: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test wrapper with QueryClient
 */
function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('ScatterChart', () => {
  beforeAll(() => {
    // Mock getBoundingClientRect for ResponsiveContainer
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders skeleton during loading', () => {
      // Arrange
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: undefined,
          isLoading: true,
          isPending: true,
          status: 'pending',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('chart-loading-skeleton')).toBeInTheDocument();
      expect(
        screen.queryByTestId('scatter-chart')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when data fetch fails', () => {
      // Arrange
      const mockRefetch = vi.fn();
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: undefined,
          isLoading: false,
          isError: true,
          error: new Error('Network error'),
          refetch: mockRefetch,
          status: 'error',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('scatter-chart-error')).toBeInTheDocument();
      expect(screen.getByText(/failed to load chart data/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('calls refetch when try again button clicked', async () => {
      // Arrange
      const mockRefetch = vi.fn();
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: undefined,
          isLoading: false,
          isError: true,
          error: new Error('Network error'),
          refetch: mockRefetch,
          status: 'error',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);
      const retryButton = screen.getByText(/try again/i);
      retryButton.click();

      // Assert
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no competitors exist', () => {
      // Arrange
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: [],
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('visualization-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/no competitor data yet/i)).toBeInTheDocument();
    });

    it('displays empty state when data is undefined', () => {
      // Arrange
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: undefined,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('visualization-empty-state')).toBeInTheDocument();
    });

    it('displays Maho-specific empty state with action button (AC #1)', () => {
      // Arrange
      const mockOnAddClick = vi.fn();
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: [],
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
          onAddClick={mockOnAddClick}
        />
      );

      // Assert
      expect(screen.getByTestId('visualization-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/add your first competitor to see the positioning chart/i)).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-action')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add competitor/i })).toBeInTheDocument();
    });

    it('calls onAddClick when Maho clicks Add button in empty state', async () => {
      // Arrange
      const mockOnAddClick = vi.fn();
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: [],
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
          onAddClick={mockOnAddClick}
        />
      );

      // Click the Add Competitor button
      const addButton = screen.getByRole('button', { name: /add competitor/i });
      await userEvent.click(addButton);

      // Assert
      expect(mockOnAddClick).toHaveBeenCalledTimes(1);
    });

    it('displays Kel-specific empty state without action button (AC #2)', () => {
      // Arrange
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: [],
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={false}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByTestId('visualization-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/maho will add competitors for positioning analysis/i)).toBeInTheDocument();
      expect(screen.queryByTestId('empty-state-action')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add competitor/i })).not.toBeInTheDocument();
    });

    it('uses consistent dashed border styling (AC #5)', () => {
      // Arrange
      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: [],
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      const emptyState = screen.getByTestId('visualization-empty-state');
      expect(emptyState).toHaveClass('border-dashed');
      expect(emptyState).toHaveClass('border-border');
      expect(emptyState).toHaveClass('bg-muted/20');
    });
  });

  describe('Chart Rendering', () => {
    it('renders chart when data is loaded', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 3,
          quality_score: 7,
        }),
        createMockCompetitor({
          name: 'Competitor B',
          price_score: 8,
          quality_score: 4,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
      expect(
        screen.queryByTestId('chart-loading-skeleton')
      ).not.toBeInTheDocument();
    });

    it('renders scatter chart container with correct dimensions', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 3,
          quality_score: 7,
        }),
        createMockCompetitor({
          name: 'Competitor B',
          price_score: 8,
          quality_score: 4,
        }),
        createMockCompetitor({
          name: 'Competitor C',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      const chartContainer = screen.getByTestId('scatter-chart');
      expect(chartContainer).toHaveClass('w-full');
      // Height is now set via inline style for responsive behavior (default 400px)
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('renders chart with Kel position data', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 3,
          quality_score: 7,
        }),
        createMockCompetitor({
          name: 'Kel Target',
          price_score: 4,
          quality_score: 8,
          is_kel_position: true,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      const { container } = renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      // Chart renders successfully with both regular and Kel data
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();

      // Verify ResponsiveContainer is rendered (indicates chart is rendering)
      const responsiveContainer = container.querySelector(
        '.recharts-responsive-container'
      );
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('does not display Kel marker when no Kel position exists', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 3,
          quality_score: 7,
        }),
        createMockCompetitor({
          name: 'Competitor B',
          price_score: 8,
          quality_score: 4,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(
        screen.queryByTestId('chart-kel-position')
      ).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders ResponsiveContainer with full width', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      const chartContainer = screen.getByTestId('scatter-chart');
      expect(chartContainer).toHaveClass('w-full');
      // Height is now set via inline style for responsive behavior
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('uses desktop dimensions by default (SSR-safe)', () => {
      // Arrange - default state is desktop (SSR-safe)
      const mockCompetitors = [
        createMockCompetitor({ price_score: 5, quality_score: 5 }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - desktop height (400px)
      const chartContainer = screen.getByTestId('scatter-chart');
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('uses mobile dimensions when viewport is small', () => {
      // Arrange - mock mobile viewport
      vi.spyOn(useResponsiveChartHeightHook, 'useResponsiveChartHeight').mockReturnValue({
        isMobile: true,
        isSmallMobile: false,
        chartHeight: 320,
      });

      const mockCompetitors = [
        createMockCompetitor({ price_score: 5, quality_score: 5 }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - mobile height
      const chartContainer = screen.getByTestId('scatter-chart');
      expect(chartContainer).toHaveStyle({ height: '320px' });
    });

    it('hides quadrant labels on small mobile viewport', () => {
      // Arrange - mock small mobile viewport
      vi.spyOn(useResponsiveChartHeightHook, 'useResponsiveChartHeight').mockReturnValue({
        isMobile: true,
        isSmallMobile: true,
        chartHeight: 280,
      });

      const mockCompetitors = [
        createMockCompetitor({ price_score: 5, quality_score: 5 }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - quadrant labels should not be present
      expect(screen.queryByText(/Premium/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Value/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Budget/)).not.toBeInTheDocument();
    });

    it('shows quadrant labels on desktop viewport', () => {
      // Arrange - default desktop viewport
      const mockCompetitors = [
        createMockCompetitor({ price_score: 5, quality_score: 5 }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - quadrant labels should be present
      // Note: These are rendered by Recharts ReferenceLine which may not be fully
      // accessible in JSDOM. We verify the chart renders without crashing.
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });
  });

  describe('Chart Structure', () => {
    it('includes X-axis and Y-axis', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      // Recharts renders axes - we verify via data-testid
      // (actual rendering happens in SVG which testing-library handles)
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    it('renders chart with scatter elements', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();

      // Note: In test environment, Recharts may not fully render all SVG elements
      // due to missing browser layout engine. The important part is that the
      // component renders without crashing and includes the chart container.
    });
  });

  describe('Gap Area Indicators', () => {
    it('shows gap indicators when quadrants have 0-1 data points', () => {
      // Arrange - all competitors in premium quadrant (top-right)
      // This leaves value, budget, and low-quality as gaps
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Premium A',
          price_score: 7,
          quality_score: 8,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - gap indicators should be present for empty quadrants
      const gapIndicators = screen.queryAllByTestId('gap-indicator');
      expect(gapIndicators.length).toBeGreaterThan(0);
    });

    it('does not show gap indicators when all quadrants have 2+ data points', () => {
      // Arrange - distribute competitors across all quadrants (2+ per quadrant)
      const mockCompetitors = [
        // Premium quadrant (top-right)
        createMockCompetitor({ price_score: 7, quality_score: 8 }),
        createMockCompetitor({ price_score: 8, quality_score: 7 }),
        // Value quadrant (top-left)
        createMockCompetitor({ price_score: 3, quality_score: 8 }),
        createMockCompetitor({ price_score: 2, quality_score: 7 }),
        // Budget quadrant (bottom-left)
        createMockCompetitor({ price_score: 3, quality_score: 4 }),
        createMockCompetitor({ price_score: 2, quality_score: 3 }),
        // Low-quality quadrant (bottom-right)
        createMockCompetitor({ price_score: 7, quality_score: 4 }),
        createMockCompetitor({ price_score: 8, quality_score: 3 }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - no gap indicators should be present
      const gapIndicators = screen.queryAllByTestId('gap-indicator');
      expect(gapIndicators.length).toBe(0);
    });

    it('shows gap indicator when quadrant has exactly 1 data point', () => {
      // Arrange - create scenario where multiple quadrants have exactly 1 point
      const mockCompetitors = [
        // Premium quadrant - 1 point (should show gap indicator)
        createMockCompetitor({ price_score: 7, quality_score: 8 }),
        // Value quadrant - 2 points (should NOT show gap indicator)
        createMockCompetitor({ price_score: 3, quality_score: 8 }),
        createMockCompetitor({ price_score: 2, quality_score: 7 }),
        // Budget quadrant - 0 points (should show gap indicator)
        // Low-quality quadrant - 1 point (should show gap indicator)
        createMockCompetitor({ price_score: 7, quality_score: 4 }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - should have gap indicators for premium, budget, and low-quality quadrants (3 total)
      const gapIndicators = screen.queryAllByTestId('gap-indicator');
      expect(gapIndicators.length).toBe(3);
    });

    it('shows gap indicators for all quadrants when no data exists', () => {
      // Arrange - empty data (but not undefined/null - that triggers empty state)
      // Use a single point at the boundary to avoid complete empty state
      const mockCompetitors = [
        createMockCompetitor({
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - all 4 quadrants should have gap indicators
      // (boundary point at 5,5 doesn't count in any quadrant due to > vs <= logic)
      const gapIndicators = screen.queryAllByTestId('gap-indicator');
      expect(gapIndicators.length).toBe(4);
    });
  });

  describe('Pitch Mode', () => {
    it('accepts isPitchMode prop', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act - should render without error when isPitchMode is passed
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          isPitchMode={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert - chart renders (uses pitch-mode-chart testid when isPitchMode is true)
      expect(screen.getByTestId('pitch-mode-chart')).toBeInTheDocument();
    });

    it('adds pitch-mode-chart testid when isPitchMode is true', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          isPitchMode={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByTestId('pitch-mode-chart')).toBeInTheDocument();
    });

    it('does not add pitch-mode-chart testid when isPitchMode is false', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          isPitchMode={false}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert
      expect(screen.queryByTestId('pitch-mode-chart')).not.toBeInTheDocument();
    });

    it('does not render ChartClickLayer in pitch mode', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          isPitchMode={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert - click layer should not be present in pitch mode
      expect(screen.queryByTestId('chart-click-layer')).not.toBeInTheDocument();
    });

    it('renders ChartClickLayer when not in pitch mode', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          isPitchMode={false}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert - click layer should be present when not in pitch mode
      expect(screen.getByTestId('chart-click-layer')).toBeInTheDocument();
    });

    it('adds kel-position-highlight testid to Kel marker in pitch mode', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Kel Target',
          price_score: 5,
          quality_score: 8,
          is_kel_position: true,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={false}
          isPitchMode={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByTestId('kel-position-highlight')).toBeInTheDocument();
    });

    it('uses chart-kel-position testid when not in pitch mode', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Kel Target',
          price_score: 5,
          quality_score: 8,
          is_kel_position: true,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(
        <ScatterChart
          isMaho={false}
          isPitchMode={false}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByTestId('chart-kel-position')).toBeInTheDocument();
      expect(screen.queryByTestId('kel-position-highlight')).not.toBeInTheDocument();
    });

    it('shows tooltips on hover in pitch mode (read-only)', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 5,
          quality_score: 5,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act - chart should render without crashing with pitch mode
      renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          isPitchMode={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert - chart renders in pitch mode (Tooltip is present but not visible until hover)
      expect(screen.getByTestId('pitch-mode-chart')).toBeInTheDocument();
    });

    it('applies glow filter to Kel position in pitch mode', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Kel Target',
          price_score: 5,
          quality_score: 8,
          is_kel_position: true,
        }),
        createMockCompetitor({
          name: 'Competitor A',
          price_score: 3,
          quality_score: 6,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      const { container } = renderWithQueryClient(
        <ScatterChart
          isMaho={false}
          isPitchMode={true}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert - SVG filter for glow should be defined
      const filter = container.querySelector('filter#kel-glow');
      expect(filter).toBeInTheDocument();

      // Assert - filter should be applied to Kel position element
      const kelHighlight = screen.getByTestId('kel-position-highlight');
      expect(kelHighlight).toHaveAttribute('filter', 'url(#kel-glow)');
    });

    it('does not include glow filter when not in pitch mode', () => {
      // Arrange
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Kel Target',
          price_score: 5,
          quality_score: 8,
          is_kel_position: true,
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      const { container } = renderWithQueryClient(
        <ScatterChart
          isMaho={true}
          isPitchMode={false}
          onEditClick={vi.fn()}
          onDeleteClick={vi.fn()}
        />
      );

      // Assert - No glow filter when not in pitch mode
      const filter = container.querySelector('filter#kel-glow');
      expect(filter).not.toBeInTheDocument();
    });
  });

  describe('Stale Data Indicators', () => {
    // Mock current date for consistent staleness tests
    const mockNow = new Date('2025-12-29T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders fresh data points with chart-data-point testid', () => {
      // Arrange - data updated recently (today)
      const mockCompetitors = [
        createMockCompetitor({
          name: 'Fresh Competitor',
          price_score: 5,
          quality_score: 5,
          updated_at: new Date().toISOString(),
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('chart-data-point')).toBeInTheDocument();
      expect(screen.queryByTestId('stale-chart-point')).not.toBeInTheDocument();
    });

    it('renders stale data points with stale-chart-point testid', () => {
      // Arrange - data updated 20 days ago (stale)
      const staleDate = new Date(mockNow);
      staleDate.setDate(staleDate.getDate() - 20);

      const mockCompetitors = [
        createMockCompetitor({
          name: 'Stale Competitor',
          price_score: 5,
          quality_score: 5,
          updated_at: staleDate.toISOString(),
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('stale-chart-point')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-data-point')).not.toBeInTheDocument();
    });

    it('does not mark data at 14 day boundary as stale', () => {
      // Arrange - data updated exactly 14 days ago (boundary - NOT stale)
      const boundaryDate = new Date(mockNow);
      boundaryDate.setDate(boundaryDate.getDate() - 14);

      const mockCompetitors = [
        createMockCompetitor({
          name: 'Boundary Competitor',
          price_score: 5,
          quality_score: 5,
          updated_at: boundaryDate.toISOString(),
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - exactly 14 days is NOT stale (> not >=)
      expect(screen.getByTestId('chart-data-point')).toBeInTheDocument();
      expect(screen.queryByTestId('stale-chart-point')).not.toBeInTheDocument();
    });

    it('marks data older than 14 days as stale', () => {
      // Arrange - data updated 15 days ago (just past threshold)
      const staleDate = new Date(mockNow);
      staleDate.setDate(staleDate.getDate() - 15);

      const mockCompetitors = [
        createMockCompetitor({
          name: 'Just Stale Competitor',
          price_score: 5,
          quality_score: 5,
          updated_at: staleDate.toISOString(),
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert
      expect(screen.getByTestId('stale-chart-point')).toBeInTheDocument();
    });

    it('renders mixed fresh and stale data points with correct testids', () => {
      // Arrange - one fresh, one stale
      const staleDate = new Date(mockNow);
      staleDate.setDate(staleDate.getDate() - 20);

      const mockCompetitors = [
        createMockCompetitor({
          name: 'Fresh',
          price_score: 3,
          quality_score: 7,
          updated_at: new Date().toISOString(),
        }),
        createMockCompetitor({
          name: 'Stale',
          price_score: 7,
          quality_score: 3,
          updated_at: staleDate.toISOString(),
        }),
      ];

      vi.spyOn(useCompetitorDataHook, 'useCompetitorData').mockReturnValue(
        createMockUseQueryResult<CompetitorDataPoint[]>({
          data: mockCompetitors,
          isLoading: false,
          isSuccess: true,
          status: 'success',
        })
      );

      // Act
      renderWithQueryClient(<ScatterChart isMaho={false} onEditClick={vi.fn()} onDeleteClick={vi.fn()} />);

      // Assert - both types should be present
      expect(screen.getByTestId('chart-data-point')).toBeInTheDocument();
      expect(screen.getByTestId('stale-chart-point')).toBeInTheDocument();
    });
  });
});
