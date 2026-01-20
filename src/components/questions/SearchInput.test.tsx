/**
 * SearchInput Component Tests
 *
 * Tests for the search input component that filters questions.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders search input with placeholder', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      const input = screen.getByTestId('search-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search questions...');
    });

    it('renders with custom placeholder', () => {
      render(
        <SearchInput value="" onChange={vi.fn()} placeholder="Find something..." />
      );

      expect(screen.getByPlaceholderText('Find something...')).toBeInTheDocument();
    });

    it('displays search icon', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      const container = screen.getByTestId('search-input-container');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('shows initial value', () => {
      render(<SearchInput value="test query" onChange={vi.fn()} />);

      expect(screen.getByTestId('search-input')).toHaveValue('test query');
    });
  });

  describe('clear button', () => {
    it('does not show clear button when empty', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      expect(screen.queryByTestId('search-clear-button')).not.toBeInTheDocument();
    });

    it('shows clear button when has value', () => {
      render(<SearchInput value="test" onChange={vi.fn()} />);

      expect(screen.getByTestId('search-clear-button')).toBeInTheDocument();
    });

    it('clears input when clear button clicked', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="test" onChange={onChange} />);

      fireEvent.click(screen.getByTestId('search-clear-button'));

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('debouncing', () => {
    it('debounces onChange calls', async () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} debounceMs={300} />);

      const input = screen.getByTestId('search-input');

      // Type quickly
      fireEvent.change(input, { target: { value: 't' } });
      fireEvent.change(input, { target: { value: 'te' } });
      fireEvent.change(input, { target: { value: 'tes' } });
      fireEvent.change(input, { target: { value: 'test' } });

      // onChange should not be called yet (debouncing)
      expect(onChange).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now it should be called with final value
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('test');
    });

    it('immediately updates internal value while debouncing', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} debounceMs={300} />);

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'test' } });

      // Input shows value immediately
      expect(input).toHaveValue('test');

      // But onChange not called yet
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('sync with external value', () => {
    it('updates internal value when prop changes', () => {
      const { rerender } = render(<SearchInput value="initial" onChange={vi.fn()} />);

      expect(screen.getByTestId('search-input')).toHaveValue('initial');

      rerender(<SearchInput value="updated" onChange={vi.fn()} />);

      expect(screen.getByTestId('search-input')).toHaveValue('updated');
    });
  });

  describe('accessibility', () => {
    it('has aria-label on input', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      expect(screen.getByTestId('search-input')).toHaveAttribute(
        'aria-label',
        'Search questions'
      );
    });

    it('has aria-label on clear button', () => {
      render(<SearchInput value="test" onChange={vi.fn()} />);

      expect(screen.getByTestId('search-clear-button')).toHaveAttribute(
        'aria-label',
        'Clear search'
      );
    });

    it('uses type="search" for native semantics', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      expect(screen.getByTestId('search-input')).toHaveAttribute('type', 'search');
    });
  });
});
