/**
 * GlobalSearch Component Tests
 *
 * Tests for the global search input component with dropdown results.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GlobalSearch } from './GlobalSearch';

// Mock the useGlobalSearch hook
const mockUseGlobalSearch = vi.fn();

vi.mock('@/hooks/market-intelligence', () => ({
  useGlobalSearch: (...args: unknown[]) => mockUseGlobalSearch(...args),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseGlobalSearch.mockReturnValue({
      results: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders search input with placeholder', () => {
      render(<GlobalSearch />);

      expect(screen.getByTestId('mi-global-search')).toBeInTheDocument();
      expect(screen.getByTestId('mi-global-search-input')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search companies, products, research...')
      ).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<GlobalSearch className="custom-class" />);

      const container = screen.getByTestId('mi-global-search');
      expect(container).toHaveClass('custom-class');
    });

    it('has search icon', () => {
      render(<GlobalSearch />);

      const container = screen.getByTestId('mi-global-search');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('clear button', () => {
    it('does not show clear button when empty', () => {
      render(<GlobalSearch />);

      expect(
        screen.queryByTestId('mi-global-search-clear')
      ).not.toBeInTheDocument();
    });

    it('shows clear button when has value', () => {
      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByTestId('mi-global-search-clear')).toBeInTheDocument();
    });

    it('clears input when clear button clicked', () => {
      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByTestId('mi-global-search-clear');
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
    });

    it('has 48px touch target for clear button', () => {
      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      const clearButton = screen.getByTestId('mi-global-search-clear');
      expect(clearButton).toHaveClass('min-h-[48px]');
      expect(clearButton).toHaveClass('min-w-[48px]');
    });
  });

  describe('debouncing', () => {
    it('debounces search query by 300ms', () => {
      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');

      // Type quickly
      fireEvent.change(input, { target: { value: 't' } });
      fireEvent.change(input, { target: { value: 'te' } });
      fireEvent.change(input, { target: { value: 'tes' } });
      fireEvent.change(input, { target: { value: 'test' } });

      // Hook should have been called with empty string initially
      expect(mockUseGlobalSearch).toHaveBeenLastCalledWith('');

      // Fast-forward past debounce delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now it should be called with final value
      expect(mockUseGlobalSearch).toHaveBeenLastCalledWith('test');
    });
  });

  describe('dropdown behavior', () => {
    it('does not show dropdown when query < 2 chars', () => {
      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');
      fireEvent.change(input, { target: { value: 'a' } });

      // No dropdown should appear
      expect(
        screen.queryByRole('list', { hidden: true })
      ).not.toBeInTheDocument();
    });

    it('shows dropdown when query >= 2 chars', () => {
      mockUseGlobalSearch.mockReturnValue({
        results: {
          companies: [],
          products: [],
          research: [],
          totalCount: 0,
        },
        isLoading: false,
        error: null,
      });

      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');
      fireEvent.change(input, { target: { value: 'te' } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Dropdown should now be visible (check for results container)
      const container = screen.getByTestId('mi-global-search');
      expect(container.querySelector('.absolute')).toBeInTheDocument();
    });

    it('closes dropdown on outside click', () => {
      mockUseGlobalSearch.mockReturnValue({
        results: {
          companies: [],
          products: [],
          research: [],
          totalCount: 0,
        },
        isLoading: false,
        error: null,
      });

      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Simulate outside click
      fireEvent.mouseDown(document.body);

      // Dropdown should close (check for the popover container, not any .absolute)
      const container = screen.getByTestId('mi-global-search');
      expect(container.querySelector('.bg-popover')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-label on input', () => {
      render(<GlobalSearch />);

      expect(screen.getByTestId('mi-global-search-input')).toHaveAttribute(
        'aria-label',
        'Search knowledge base'
      );
    });

    it('has aria-label on clear button', () => {
      render(<GlobalSearch />);

      const input = screen.getByTestId('mi-global-search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.getByTestId('mi-global-search-clear')).toHaveAttribute(
        'aria-label',
        'Clear search'
      );
    });
  });
});
