/**
 * Metric Glossary Definitions
 *
 * Provides definitions for metrics displayed in the Pitch Mode competitor table.
 * Used by MetricTooltip to show explanatory tooltips on hover.
 */

export interface MetricDefinition {
  label: string;
  definition: string;
  scale: string;
  goodValue: string;
  testId: string;
}

/**
 * Glossary entries for all metrics displayed in PitchCompetitorTable.
 * Each metric includes a definition, scale explanation, and "good value" guidance.
 */
export const METRIC_GLOSSARY = {
  qualityScore: {
    label: 'Quality Score',
    definition: 'Perceived product quality based on taste, texture, and packaging.',
    scale: '1-10, where 10 is highest quality',
    goodValue: '7+ is considered premium quality',
    testId: 'tooltip-quality-score',
  },
  priceRange: {
    label: 'Price Range',
    definition: 'Retail price positioning in the market.',
    scale: 'Budget (1-3), Mid-Range (4-6), Premium (7-10)',
    goodValue: 'Depends on target segment; Kel targets Mid-Range to Premium',
    testId: 'tooltip-price-range',
  },
  marketPosition: {
    label: 'Market Position',
    definition: 'Quadrant position based on price and quality combination.',
    scale: 'Premium, Value, Budget, or Low Quality',
    goodValue: '"Value" (high quality, affordable price) is the ideal sweet spot',
    testId: 'tooltip-market-position',
  },
} as const;

export type MetricKey = keyof typeof METRIC_GLOSSARY;
