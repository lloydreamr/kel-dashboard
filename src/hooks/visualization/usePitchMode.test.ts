/**
 * usePitchMode Hook Tests
 *
 * Unit tests for pitch mode URL state management and store sync.
 * Story 11.1: Pitch Mode View (Task 1)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { usePitchModeStore } from '@/stores/pitchMode';

import { usePitchMode } from './usePitchMode';

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush }),
}));

describe('usePitchMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('mode');
    usePitchModeStore.setState({ isPitchMode: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isPitchMode state', () => {
    it('returns false when no mode query param exists', () => {
      // Arrange - no mode param (already cleared in beforeEach)

      // Act
      const { result } = renderHook(() => usePitchMode());

      // Assert
      expect(result.current.isPitchMode).toBe(false);
    });

    it('returns true when mode=pitch query param exists', () => {
      // Arrange
      mockSearchParams.set('mode', 'pitch');

      // Act
      const { result } = renderHook(() => usePitchMode());

      // Assert
      expect(result.current.isPitchMode).toBe(true);
    });

    it('returns false when mode has different value', () => {
      // Arrange
      mockSearchParams.set('mode', 'other');

      // Act
      const { result } = renderHook(() => usePitchMode());

      // Assert
      expect(result.current.isPitchMode).toBe(false);
    });
  });

  describe('store sync', () => {
    it('syncs isPitchMode=true to store when query param is pitch', () => {
      // Arrange
      mockSearchParams.set('mode', 'pitch');

      // Act
      renderHook(() => usePitchMode());

      // Assert
      expect(usePitchModeStore.getState().isPitchMode).toBe(true);
    });

    it('syncs isPitchMode=false to store when query param is removed', () => {
      // Arrange
      usePitchModeStore.setState({ isPitchMode: true });
      mockSearchParams.delete('mode');

      // Act
      renderHook(() => usePitchMode());

      // Assert
      expect(usePitchModeStore.getState().isPitchMode).toBe(false);
    });

    it('syncs on URL changes (re-render)', () => {
      // Arrange - start without pitch mode
      const { rerender } = renderHook(() => usePitchMode());
      expect(usePitchModeStore.getState().isPitchMode).toBe(false);

      // Act - simulate URL change to pitch mode
      mockSearchParams.set('mode', 'pitch');
      rerender();

      // Assert
      expect(usePitchModeStore.getState().isPitchMode).toBe(true);
    });
  });

  describe('enterPitchMode', () => {
    // Story 17.3: Updated route to Market Intelligence
    it('navigates to /market-intelligence/visualization?mode=pitch', () => {
      // Arrange
      const { result } = renderHook(() => usePitchMode());

      // Act
      act(() => {
        result.current.enterPitchMode();
      });

      // Assert
      expect(mockPush).toHaveBeenCalledWith('/market-intelligence/visualization?mode=pitch', { scroll: false });
    });

    it('preserves scroll position on navigation', () => {
      // Arrange
      const { result } = renderHook(() => usePitchMode());

      // Act
      act(() => {
        result.current.enterPitchMode();
      });

      // Assert
      expect(mockPush).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ scroll: false })
      );
    });
  });

  describe('exitPitchMode', () => {
    // Story 17.3: Updated route to Market Intelligence
    it('navigates to /market-intelligence/visualization (without query param)', () => {
      // Arrange
      mockSearchParams.set('mode', 'pitch');
      const { result } = renderHook(() => usePitchMode());

      // Act
      act(() => {
        result.current.exitPitchMode();
      });

      // Assert
      expect(mockPush).toHaveBeenCalledWith('/market-intelligence/visualization', { scroll: false });
    });

    it('preserves scroll position on navigation', () => {
      // Arrange
      mockSearchParams.set('mode', 'pitch');
      const { result } = renderHook(() => usePitchMode());

      // Act
      act(() => {
        result.current.exitPitchMode();
      });

      // Assert
      expect(mockPush).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ scroll: false })
      );
    });
  });

  describe('return type', () => {
    it('returns object with expected properties', () => {
      // Arrange & Act
      const { result } = renderHook(() => usePitchMode());

      // Assert
      expect(result.current).toHaveProperty('isPitchMode');
      expect(result.current).toHaveProperty('enterPitchMode');
      expect(result.current).toHaveProperty('exitPitchMode');
      expect(typeof result.current.isPitchMode).toBe('boolean');
      expect(typeof result.current.enterPitchMode).toBe('function');
      expect(typeof result.current.exitPitchMode).toBe('function');
    });
  });
});
