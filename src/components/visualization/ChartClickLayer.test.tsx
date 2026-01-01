import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ChartClickLayer } from '@/components/visualization/ChartClickLayer';

import type { CompetitorDataPoint } from '@/types';
import type { OverlayPoint } from '@/components/visualization/ChartClickLayer';

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
 * Create overlay point from competitor
 */
function createOverlayPoint(
  competitor: CompetitorDataPoint,
  position: { x: number; y: number }
): OverlayPoint {
  return {
    id: competitor.id,
    x: position.x,
    y: position.y,
    name: competitor.name,
    priceScore: competitor.price_score,
    qualityScore: competitor.quality_score,
    isKel: competitor.is_kel_position ?? false,
  };
}

describe('ChartClickLayer', () => {
  describe('Rendering', () => {
    it('renders overlay button for each point', () => {
      // Arrange
      const competitor1 = createMockCompetitor({ name: 'Comp A' });
      const competitor2 = createMockCompetitor({ name: 'Comp B' });
      const competitors = [competitor1, competitor2];
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor1, { x: 100, y: 100 }),
        createOverlayPoint(competitor2, { x: 200, y: 200 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={competitors}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const overlays = screen.getAllByRole('button');
      expect(overlays).toHaveLength(2);
    });

    it('renders with correct test IDs for regular competitors', () => {
      // Arrange
      const competitor = createMockCompetitor({ id: 'test-comp-id' });
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      expect(
        screen.getByTestId(`chart-click-overlay-${competitor.id}`)
      ).toBeInTheDocument();
    });

    it('renders with kel test ID for Kel position', () => {
      // Arrange
      const kelCompetitor = createMockCompetitor({
        name: 'Kel Target',
        is_kel_position: true,
      });
      const points: OverlayPoint[] = [
        { ...createOverlayPoint(kelCompetitor, { x: 150, y: 150 }), isKel: true },
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[kelCompetitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      expect(screen.getByTestId('chart-click-overlay-kel')).toBeInTheDocument();
    });

    it('renders chart-click-layer container', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      expect(screen.getByTestId('chart-click-layer')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onPointClick with correct competitor data', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const competitor = createMockCompetitor({ name: 'Click Test' });
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={handleClick}
          isMaho={true}
        />
      );
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(competitor);
    });

    it('does not call onPointClick when disabled (not Maho)', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const competitor = createMockCompetitor({ id: 'disabled-test-id' });
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={handleClick}
          isMaho={false}
        />
      );

      // Use getByTestId because aria-hidden makes it inaccessible via role
      const button = screen.getByTestId('chart-click-overlay-disabled-test-id');
      // Button should be disabled
      expect(button).toBeDisabled();

      // Attempt click on disabled button
      await user.click(button);

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Touch Target Compliance', () => {
    it('overlays have 48px minimum dimensions', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const overlay = screen.getByRole('button');
      expect(overlay).toHaveClass('min-w-[48px]');
      expect(overlay).toHaveClass('min-h-[48px]');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('responds to Enter key', async () => {
      // Arrange
      const handleClick = vi.fn();
      const competitor = createMockCompetitor({ name: 'Keyboard Test' });
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={handleClick}
          isMaho={true}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(competitor);
    });

    it('responds to Space key', async () => {
      // Arrange
      const handleClick = vi.fn();
      const competitor = createMockCompetitor({ name: 'Space Test' });
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={handleClick}
          isMaho={true}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ' });

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(competitor);
    });

    it('has correct tabIndex for Maho (focusable)', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('has correct tabIndex for non-Maho (not focusable)', () => {
      // Arrange
      const competitor = createMockCompetitor({ id: 'tabindex-test-id' });
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={false}
        />
      );

      // Assert - use getByTestId because aria-hidden makes it inaccessible via role
      const button = screen.getByTestId('chart-click-overlay-tabindex-test-id');
      expect(button).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Accessibility', () => {
    it('has appropriate aria-label for regular competitor', () => {
      // Arrange
      const competitor = createMockCompetitor({
        name: 'ARIA Test',
        price_score: 7,
        quality_score: 8,
      });
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'ARIA Test: Price 7, Quality 8'
      );
    });

    it('has appropriate aria-label for Kel position', () => {
      // Arrange
      const kelCompetitor = createMockCompetitor({
        name: 'Kel Target',
        price_score: 4,
        quality_score: 9,
        is_kel_position: true,
      });
      const points: OverlayPoint[] = [
        { ...createOverlayPoint(kelCompetitor, { x: 150, y: 150 }), isKel: true },
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[kelCompetitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Kel Target: Price 4, Quality 9 (Kel target)'
      );
    });
  });

  describe('Positioning', () => {
    it('positions overlays correctly using style', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 150, y: 250 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ left: '150px', top: '250px' });
    });

    it('applies centering transform', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('-translate-x-1/2');
      expect(button).toHaveClass('-translate-y-1/2');
    });
  });

  describe('Visual Styling', () => {
    it('is transparent by default', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('has hover styling class', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-primary/10');
    });

    it('has rounded-full for circular shape', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
    });

    it('has chart-click-overlay class for E2E selection', () => {
      // Arrange
      const competitor = createMockCompetitor();
      const points: OverlayPoint[] = [
        createOverlayPoint(competitor, { x: 100, y: 100 }),
      ];

      // Act
      render(
        <ChartClickLayer
          points={points}
          competitors={[competitor]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('chart-click-overlay');
    });
  });

  describe('Empty State', () => {
    it('renders empty container when no points', () => {
      // Arrange & Act
      render(
        <ChartClickLayer
          points={[]}
          competitors={[]}
          onPointClick={vi.fn()}
          isMaho={true}
        />
      );

      // Assert
      expect(screen.getByTestId('chart-click-layer')).toBeInTheDocument();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });
});
