/**
 * Date Constants
 * @module constants/dates
 */

/**
 * WOFEX 2026 Trade Show Date
 * The target date for Kel Project launch.
 * Per FR32 - countdown display requirement.
 *
 * Uses Philippines timezone (UTC+8) to ensure consistent countdown
 * regardless of user's local timezone.
 */
export const WOFEX_DATE = new Date('2026-07-29T00:00:00+08:00');

/**
 * WOFEX Date Display String
 * Format: "July 29, 2026"
 */
export const WOFEX_DATE_DISPLAY = 'July 29, 2026';
