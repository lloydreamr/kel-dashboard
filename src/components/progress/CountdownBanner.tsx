'use client';

import { WOFEX_DATE, WOFEX_DATE_DISPLAY } from '@/lib/constants';

import { CountdownBannerSkeleton } from './CountdownBannerSkeleton';

interface CountdownBannerProps {
  className?: string;
}

/**
 * Calculate days remaining until WOFEX 2026
 * @param today Current date (defaults to now)
 * @returns Number of days until WOFEX (negative if past, 0 if today)
 */
export function calculateDaysUntilWofex(today: Date = new Date()): number {
  // Validate input date
  if (!(today instanceof Date) || isNaN(today.getTime())) {
    return NaN; // Let caller handle invalid input
  }

  // Normalize both dates to midnight to avoid time zone issues
  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);

  const wofexNormalized = new Date(WOFEX_DATE);
  wofexNormalized.setHours(0, 0, 0, 0);

  const diffTime = wofexNormalized.getTime() - todayNormalized.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Validate result
  return isNaN(days) ? NaN : days;
}

export function CountdownBanner({ className }: CountdownBannerProps) {
  const daysRemaining = calculateDaysUntilWofex();

  // Graceful fallback for invalid calculations (silent - no console noise)
  if (isNaN(daysRemaining)) {
    return <CountdownBannerSkeleton />;
  }

  // State 2: Today is WOFEX (AC2)
  if (daysRemaining === 0) {
    return (
      <div
        data-testid="wofex-countdown-banner"
        role="status"
        aria-label="WOFEX 2026 is today"
        className={`bg-green-100 rounded-lg p-4 text-center ${className || ''}`}
      >
        <span className="text-2xl font-bold text-green-700">
          WOFEX 2026 is TODAY! 🎉
        </span>
      </div>
    );
  }

  // State 3: WOFEX has passed (AC3)
  if (daysRemaining < 0) {
    return (
      <div
        data-testid="wofex-countdown-banner"
        role="status"
        aria-label="WOFEX 2026 is complete"
        className={`bg-green-100 rounded-lg p-4 text-center ${className || ''}`}
      >
        <span className="text-xl font-semibold text-green-700">
          WOFEX 2026 complete ✓
        </span>
      </div>
    );
  }

  // State 1: Days remaining (AC1) - most common
  return (
    <div
      data-testid="wofex-countdown-banner"
      role="status"
      aria-label={`${daysRemaining} days until WOFEX 2026`}
      className={`bg-primary/10 border border-primary/20 rounded-lg p-4 ${
        className || ''
      }`}
    >
      <div className="text-center">
        <span
          data-testid="wofex-days-remaining"
          className="text-2xl font-bold text-primary"
        >
          {daysRemaining}
        </span>
        <span className="text-lg text-primary ml-2">
          days until WOFEX 2026
        </span>
      </div>
      <div
        data-testid="wofex-date-display"
        className="text-sm text-muted-foreground text-center mt-1"
      >
        {WOFEX_DATE_DISPLAY}
      </div>
    </div>
  );
}
