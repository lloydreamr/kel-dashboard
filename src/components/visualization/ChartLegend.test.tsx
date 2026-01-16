/**
 * ChartLegend Component Tests
 *
 * Tests for the chart legend component including marker visibility
 * and loading state handling.
 *
 * Note: Category toggle tests removed per Epic 6 retrospective action item.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ChartLegend } from './ChartLegend';

describe('ChartLegend', () => {
  // AC1: Marker visibility tests
  describe('Marker visibility', () => {
    it('renders competitor marker always', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      expect(screen.getByTestId('legend-competitor-marker')).toBeInTheDocument();
      expect(screen.getByText('Competitor')).toBeInTheDocument();
    });

    it('renders Kel marker when hasKelPosition is true', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={true} />);

      // Assert
      expect(screen.getByTestId('legend-kel-marker')).toBeInTheDocument();
      expect(screen.getByText('Kel Target')).toBeInTheDocument();
    });

    it('hides Kel marker when hasKelPosition is false', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      expect(screen.queryByTestId('legend-kel-marker')).not.toBeInTheDocument();
      expect(screen.queryByText('Kel Target')).not.toBeInTheDocument();
    });
  });

  // AC3: Responsive layout (tested via className presence)
  describe('Responsive layout', () => {
    it('applies responsive flex classes for wrapping', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      const container = screen.getByTestId('chart-legend');
      expect(container).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'flex-wrap');
    });

    it('has proper spacing from chart', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      const container = screen.getByTestId('chart-legend');
      expect(container).toHaveClass('mt-4');
    });
  });

  // AC5: Loading state tests
  describe('Loading state', () => {
    it('returns null when isLoading is true', () => {
      // Arrange & Act
      const { container } = render(<ChartLegend hasKelPosition={false} isLoading={true} />);

      // Assert
      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('chart-legend')).not.toBeInTheDocument();
    });

    it('renders normally when isLoading is false', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} isLoading={false} />);

      // Assert
      expect(screen.getByTestId('chart-legend')).toBeInTheDocument();
    });

    it('renders normally when isLoading is undefined', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      expect(screen.getByTestId('chart-legend')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper ARIA attributes on container', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      const container = screen.getByTestId('chart-legend');
      expect(container).toHaveAttribute('role', 'group');
      expect(container).toHaveAttribute('aria-label', 'Chart legend');
    });
  });
});
