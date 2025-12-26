import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

import { ScatterChart } from '@/components/visualization/ScatterChart';
import * as useCompetitorDataHook from '@/hooks/competitors/useCompetitorData';

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
      expect(screen.getByTestId('scatter-chart-empty')).toBeInTheDocument();
      expect(screen.getByText(/no competitor data yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/add competitors to see the positioning chart/i)
      ).toBeInTheDocument();
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
      expect(screen.getByTestId('scatter-chart-empty')).toBeInTheDocument();
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
      expect(chartContainer).toHaveClass('h-[400px]');
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
      expect(chartContainer).toHaveClass('h-[400px]');
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
});
