/**
 * @fileoverview SSR-safe responsive chart height hook
 *
 * Provides responsive chart dimensions for the visualization page.
 * Handles mobile/desktop breakpoints with hydration-safe defaults.
 *
 * Story 10.1: Mobile Visualization Responsive Layout
 *
 * @example
 * const { isMobile, isSmallMobile, chartHeight } = useResponsiveChartHeight();
 * // isMobile: true for < 640px
 * // isSmallMobile: true for < 375px (iPhone SE)
 * // chartHeight: dynamic 280-400px on mobile, fixed 400px on desktop
 */

import { useState, useEffect } from 'react';

/** Breakpoint for mobile detection (< 640px per Tailwind sm:) */
export const MOBILE_BREAKPOINT = 639;

/** Breakpoint for small mobile detection (< 375px for iPhone SE) */
export const SMALL_MOBILE_BREAKPOINT = 374;

/** Minimum chart height on mobile */
const MIN_CHART_HEIGHT = 280;

/** Maximum/desktop chart height */
const MAX_CHART_HEIGHT = 400;

/** Viewport height multiplier for mobile chart height */
const MOBILE_HEIGHT_RATIO = 0.4;

export interface UseResponsiveChartHeightResult {
  /** True when viewport width <= 639px */
  isMobile: boolean;
  /** True when viewport width <= 374px (iPhone SE size) */
  isSmallMobile: boolean;
  /** Calculated chart height in pixels */
  chartHeight: number;
}

/**
 * Hook for responsive chart height calculation.
 *
 * SSR-safe: Defaults to desktop values (400px height, not mobile)
 * to prevent hydration mismatches. Updates on client mount and resize.
 *
 * @returns Responsive chart dimensions
 */
export function useResponsiveChartHeight(): UseResponsiveChartHeightResult {
  // SSR-safe defaults: desktop values prevent hydration mismatch
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    // Client-side only: measure actual viewport
    const updateViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width <= MOBILE_BREAKPOINT);
      setIsSmallMobile(width <= SMALL_MOBILE_BREAKPOINT);
      setViewportHeight(window.innerHeight);
    };

    // Initial measurement
    updateViewport();

    // Listen for breakpoint changes (more efficient than resize for width)
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const smallMobileQuery = window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT}px)`);

    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const handleSmallMobileChange = (e: MediaQueryListEvent) => setIsSmallMobile(e.matches);

    mobileQuery.addEventListener('change', handleMobileChange);
    smallMobileQuery.addEventListener('change', handleSmallMobileChange);

    // Also listen for resize to track height changes
    window.addEventListener('resize', updateViewport);

    return () => {
      mobileQuery.removeEventListener('change', handleMobileChange);
      smallMobileQuery.removeEventListener('change', handleSmallMobileChange);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Calculate chart height: dynamic on mobile, fixed on desktop
  const chartHeight = isMobile
    ? Math.min(
        Math.max(MIN_CHART_HEIGHT, Math.floor(viewportHeight * MOBILE_HEIGHT_RATIO)),
        MAX_CHART_HEIGHT
      )
    : MAX_CHART_HEIGHT;

  return { isMobile, isSmallMobile, chartHeight };
}
