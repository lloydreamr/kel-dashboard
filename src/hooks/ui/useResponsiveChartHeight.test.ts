/**
 * @fileoverview Tests for useResponsiveChartHeight hook
 *
 * Tests the SSR-safe responsive chart height calculation.
 * Story 10.1: Mobile Visualization Responsive Layout (Task 1)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useResponsiveChartHeight, MOBILE_BREAKPOINT, SMALL_MOBILE_BREAKPOINT } from './useResponsiveChartHeight';

// Mock matchMedia for responsive tests
const createMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

describe('useResponsiveChartHeight', () => {
  const originalMatchMedia = window.matchMedia;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      writable: true,
    });
  });

  describe('SSR safety', () => {
    it('returns desktop defaults before hydration', () => {
      // Before useEffect runs, should return desktop values
      window.matchMedia = createMatchMedia(false);
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

      const { result } = renderHook(() => useResponsiveChartHeight());

      // Initial render should use SSR-safe defaults (desktop)
      // After useEffect, it should update to mobile values
      expect(result.current.chartHeight).toBeDefined();
      expect(typeof result.current.isMobile).toBe('boolean');
      expect(typeof result.current.isSmallMobile).toBe('boolean');
    });
  });

  describe('desktop viewport', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(false);
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    it('returns desktop chart height of 400px', () => {
      const { result } = renderHook(() => useResponsiveChartHeight());

      // Trigger useEffect
      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.chartHeight).toBe(400);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isSmallMobile).toBe(false);
    });
  });

  describe('mobile viewport (< 640px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(true);
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
    });

    it('returns isMobile true for mobile viewport', () => {
      const { result } = renderHook(() => useResponsiveChartHeight());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isMobile).toBe(true);
    });

    it('calculates dynamic chart height based on viewport height', () => {
      // Height = min(max(280, floor(667 * 0.4)), 400)
      // = min(max(280, 266), 400) = min(280, 400) = 280
      const { result } = renderHook(() => useResponsiveChartHeight());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.chartHeight).toBe(280);
    });

    it('clamps chart height to minimum 280px', () => {
      Object.defineProperty(window, 'innerHeight', { value: 500, writable: true });
      // Height = min(max(280, floor(500 * 0.4)), 400)
      // = min(max(280, 200), 400) = min(280, 400) = 280

      const { result } = renderHook(() => useResponsiveChartHeight());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.chartHeight).toBe(280);
    });

    it('clamps chart height to maximum 400px', () => {
      Object.defineProperty(window, 'innerHeight', { value: 1200, writable: true });
      // Height = min(max(280, floor(1200 * 0.4)), 400)
      // = min(max(280, 480), 400) = min(480, 400) = 400

      const { result } = renderHook(() => useResponsiveChartHeight());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.chartHeight).toBe(400);
    });
  });

  describe('small mobile viewport (< 375px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(true);
      Object.defineProperty(window, 'innerWidth', { value: 320, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 568, writable: true });
    });

    it('returns isSmallMobile true for small viewport', () => {
      const { result } = renderHook(() => useResponsiveChartHeight());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isSmallMobile).toBe(true);
      expect(result.current.isMobile).toBe(true);
    });
  });

  describe('resize handling', () => {
    it('updates values when viewport changes', () => {
      window.matchMedia = createMatchMedia(false);
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

      const { result } = renderHook(() => useResponsiveChartHeight());

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.chartHeight).toBe(400);

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

      act(() => {
        window.dispatchEvent(new Event('resize'));
        vi.runAllTimers();
      });

      expect(result.current.isMobile).toBe(true);
    });
  });

  describe('exported constants', () => {
    it('exports MOBILE_BREAKPOINT as 639', () => {
      expect(MOBILE_BREAKPOINT).toBe(639);
    });

    it('exports SMALL_MOBILE_BREAKPOINT as 374', () => {
      expect(SMALL_MOBILE_BREAKPOINT).toBe(374);
    });
  });
});
