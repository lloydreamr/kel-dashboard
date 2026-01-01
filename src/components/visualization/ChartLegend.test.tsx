/**
 * ChartLegend Component Tests
 *
 * Tests for the chart legend component including marker visibility,
 * category display, and loading state handling.
 */

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

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
      expect(screen.getByText('Kel Target Position')).toBeInTheDocument();
    });

    it('hides Kel marker when hasKelPosition is false', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      expect(screen.queryByTestId('legend-kel-marker')).not.toBeInTheDocument();
      expect(screen.queryByText('Kel Target Position')).not.toBeInTheDocument();
    });
  });

  // AC2: Category label tests
  describe('Category labels', () => {
    it('renders category labels when provided', () => {
      // Arrange
      const categories = ['Chips', 'Crackers', 'Cookies'];
      const mockOnClick = vi.fn();

      // Act
      render(
        <ChartLegend
          hasKelPosition={false}
          categories={categories}
          onCategoryClick={mockOnClick}
        />
      );

      // Assert
      expect(screen.getByText('Categories:')).toBeInTheDocument();
      categories.forEach((category) => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });

    it('does NOT render category section when categories is empty array', () => {
      // Arrange & Act
      render(
        <ChartLegend
          hasKelPosition={false}
          categories={[]}
          onCategoryClick={vi.fn()}
        />
      );

      // Assert
      expect(screen.queryByTestId('legend-category-filter')).not.toBeInTheDocument();
      expect(screen.queryByText('Categories:')).not.toBeInTheDocument();
    });

    it('does NOT render category section when categories is undefined', () => {
      // Arrange & Act
      render(<ChartLegend hasKelPosition={false} />);

      // Assert
      expect(screen.queryByTestId('legend-category-filter')).not.toBeInTheDocument();
      expect(screen.queryByText('Categories:')).not.toBeInTheDocument();
    });

    it('does NOT render category section when onCategoryClick is missing', () => {
      // Arrange & Act
      render(
        <ChartLegend
          hasKelPosition={false}
          categories={['Chips', 'Crackers']}
        />
      );

      // Assert
      expect(screen.queryByTestId('legend-category-filter')).not.toBeInTheDocument();
      expect(screen.queryByText('Categories:')).not.toBeInTheDocument();
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

  // AC4: Category selection interaction
  describe('Category selection interaction', () => {
    it('calls onCategoryClick with category name when clicked', async () => {
      // Arrange
      const mockOnClick = vi.fn();
      const categories = ['Chips', 'Crackers'];
      const user = userEvent.setup();
      render(
        <ChartLegend
          hasKelPosition={false}
          categories={categories}
          onCategoryClick={mockOnClick}
        />
      );

      // Act
      await user.click(screen.getByText('Chips'));

      // Assert
      expect(mockOnClick).toHaveBeenCalledWith('Chips');
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onCategoryClick with null when selected category clicked again', async () => {
      // Arrange
      const mockOnClick = vi.fn();
      const categories = ['Chips'];
      const user = userEvent.setup();
      render(
        <ChartLegend
          hasKelPosition={false}
          categories={categories}
          selectedCategory="Chips"
          onCategoryClick={mockOnClick}
        />
      );

      // Act
      await user.click(screen.getByText('Chips'));

      // Assert
      expect(mockOnClick).toHaveBeenCalledWith(null);
    });

    it('applies selected styling to selected category', () => {
      // Arrange & Act
      render(
        <ChartLegend
          hasKelPosition={false}
          categories={['Chips', 'Crackers']}
          selectedCategory="Chips"
          onCategoryClick={vi.fn()}
        />
      );

      // Assert
      const chipsButton = screen.getByText('Chips');
      const crackersButton = screen.getByText('Crackers');

      expect(chipsButton).toHaveClass('bg-primary/10', 'text-primary', 'font-medium');
      expect(chipsButton).toHaveAttribute('aria-pressed', 'true');
      expect(crackersButton).not.toHaveClass('bg-primary/10');
      expect(crackersButton).toHaveAttribute('aria-pressed', 'false');
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

    it('has 48px minimum height on category buttons', () => {
      // Arrange & Act
      render(
        <ChartLegend
          hasKelPosition={false}
          categories={['Chips']}
          onCategoryClick={vi.fn()}
        />
      );

      // Assert
      const button = screen.getByText('Chips');
      expect(button).toHaveClass('min-h-[48px]');
    });
  });
});
