import { describe, it, expect } from 'vitest';

import { WOFEX_DATE, WOFEX_DATE_DISPLAY } from './dates';

describe('WOFEX_DATE', () => {
  it('is July 29, 2026', () => {
    expect(WOFEX_DATE.getFullYear()).toBe(2026);
    expect(WOFEX_DATE.getMonth()).toBe(6); // July is 0-indexed month 6
    expect(WOFEX_DATE.getDate()).toBe(29);
  });

  it('has correct display string', () => {
    expect(WOFEX_DATE_DISPLAY).toBe('July 29, 2026');
  });

  it('uses Philippines timezone (UTC+8)', () => {
    // Verify the date was created with explicit timezone
    // The ISO string should reflect UTC time (16:00 UTC = 00:00 PHT next day)
    expect(WOFEX_DATE.toISOString()).toContain('2026-07-28T16:00:00.000Z');
  });
});
