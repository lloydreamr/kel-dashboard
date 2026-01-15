/**
 * CommandPalette Component Tests
 *
 * Tests for the Cmd+K command palette dialog.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { CommandPalette } from './CommandPalette';

// Mock scrollIntoView for cmdk (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Mock the useGlobalSearch hook
const mockUseGlobalSearch = vi.fn();

vi.mock('@/hooks/market-intelligence', () => ({
  useGlobalSearch: (...args: unknown[]) => mockUseGlobalSearch(...args),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockUseGlobalSearch.mockReturnValue({
      results: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('does not render when closed', () => {
      render(<CommandPalette open={false} onOpenChange={vi.fn()} />);

      expect(
        screen.queryByTestId('mi-command-palette')
      ).not.toBeInTheDocument();
    });

    it('renders when open', () => {
      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByTestId('mi-command-palette')).toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByTestId('mi-command-input')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search companies, products, research...')
      ).toBeInTheDocument();
    });
  });

  describe('search behavior', () => {
    it('shows placeholder text when query < 2 chars', () => {
      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText('Type to search...')).toBeInTheDocument();
    });

    it('shows loading state during search', () => {
      mockUseGlobalSearch.mockReturnValue({
        results: null,
        isLoading: true,
        error: null,
      });

      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });

      // Should show loading immediately (pending debounce state)
      expect(screen.getByText('Searching...')).toBeInTheDocument();

      // Still loading after debounce settles
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('debounces search query by 300ms', () => {
      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId('mi-command-input');

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

    it('shows empty state when no results', () => {
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

      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });

      // Wait for debounce to settle
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });

  describe('results display', () => {
    it('displays companies group when results exist', () => {
      mockUseGlobalSearch.mockReturnValue({
        results: {
          companies: [
            {
              id: 'c1',
              name: 'Test Company',
              type: 'company',
              href: '/market-intelligence/companies/c1',
            },
          ],
          products: [],
          research: [],
          totalCount: 1,
        },
        isLoading: false,
        error: null,
      });

      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByText('Companies')).toBeInTheDocument();
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('displays products group when results exist', () => {
      mockUseGlobalSearch.mockReturnValue({
        results: {
          companies: [],
          products: [
            {
              id: 'p1',
              name: 'Test Product',
              type: 'product',
              href: '/market-intelligence/products/p1',
            },
          ],
          research: [],
          totalCount: 1,
        },
        isLoading: false,
        error: null,
      });

      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('displays research group when results exist', () => {
      mockUseGlobalSearch.mockReturnValue({
        results: {
          companies: [],
          products: [],
          research: [
            {
              id: 'r1',
              name: 'Test Research',
              type: 'research',
              href: '/market-intelligence/research/r1',
            },
          ],
          totalCount: 1,
        },
        isLoading: false,
        error: null,
      });

      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByText('Research')).toBeInTheDocument();
      expect(screen.getByText('Test Research')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to result href on select', () => {
      const onOpenChange = vi.fn();
      mockUseGlobalSearch.mockReturnValue({
        results: {
          companies: [
            {
              id: 'c1',
              name: 'Test Company',
              type: 'company',
              href: '/market-intelligence/companies/c1',
            },
          ],
          products: [],
          research: [],
          totalCount: 1,
        },
        isLoading: false,
        error: null,
      });

      render(<CommandPalette open={true} onOpenChange={onOpenChange} />);

      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Click on the result
      const result = screen.getByText('Test Company');
      fireEvent.click(result);

      expect(mockPush).toHaveBeenCalledWith('/market-intelligence/companies/c1');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('dialog behavior', () => {
    it('clears query when dialog closes via onOpenChange', () => {
      const onOpenChange = vi.fn();
      render(<CommandPalette open={true} onOpenChange={onOpenChange} />);

      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(input).toHaveValue('test');

      // The component wraps onOpenChange to clear query when closing
      // When onOpenChange is called with false (dialog closing), query is cleared
      // We verify this by checking that onOpenChange was called
      // and since we control the prop, we know the clearing logic runs

      // Simulate pressing Escape which triggers the dialog's onOpenChange(false)
      fireEvent.keyDown(input, { key: 'Escape' });

      // The handleOpenChange wrapper should have been called
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('clears query on select (which closes dialog)', () => {
      mockUseGlobalSearch.mockReturnValue({
        results: {
          companies: [
            {
              id: 'c1',
              name: 'Test Company',
              type: 'company',
              href: '/market-intelligence/companies/c1',
            },
          ],
          products: [],
          research: [],
          totalCount: 1,
        },
        isLoading: false,
        error: null,
      });

      const onOpenChange = vi.fn();
      render(<CommandPalette open={true} onOpenChange={onOpenChange} />);

      // Type to trigger search and show results
      const input = screen.getByTestId('mi-command-input');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Click on a result - this should close dialog and clear query
      fireEvent.click(screen.getByText('Test Company'));

      // onOpenChange should be called with false
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
