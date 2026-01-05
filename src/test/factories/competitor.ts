/**
 * Competitor Test Factory
 *
 * Creates mock CompetitorDataPoint objects for testing.
 * Used by visualization component tests and hook tests.
 */

import type { CompetitorDataPoint } from '@/types/database';

/**
 * Creates a mock CompetitorDataPoint with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @example
 * // Basic usage
 * const competitor = createMockCompetitor();
 *
 * @example
 * // Kel's target position
 * const kelPosition = createMockCompetitor({
 *   name: "Kel's Target",
 *   is_kel_position: true,
 * });
 */
export function createMockCompetitor(
  overrides?: Partial<CompetitorDataPoint>
): CompetitorDataPoint {
  return {
    id: crypto.randomUUID(),
    name: 'Test Competitor',
    price_score: 5,
    quality_score: 5,
    category: 'chips',
    notes: null,
    is_kel_position: false,
    created_by: 'maho@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock CompetitorDataPoint marked as Kel's target position.
 * Uses star marker in visualization.
 */
export function createMockKelPosition(
  overrides?: Partial<CompetitorDataPoint>
): CompetitorDataPoint {
  return createMockCompetitor({
    name: "Kel's Target Position",
    is_kel_position: true,
    price_score: 6,
    quality_score: 8,
    ...overrides,
  });
}

/**
 * Creates an array of mock competitors for chart testing.
 * Provides diverse positioning across the price/quality grid.
 */
export function createMockCompetitorList(count = 5): CompetitorDataPoint[] {
  const categories = ['chips', 'crackers', 'cookies', 'nuts', 'candy'];
  return Array.from({ length: count }, (_, i) =>
    createMockCompetitor({
      name: `Competitor ${i + 1}`,
      price_score: Math.min(10, 3 + i),
      quality_score: Math.min(10, 4 + i),
      category: categories[i % categories.length],
    })
  );
}
