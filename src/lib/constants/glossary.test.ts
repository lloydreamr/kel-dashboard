import { describe, expect, it } from 'vitest';

import { METRIC_GLOSSARY, type MetricDefinition } from './glossary';

describe('METRIC_GLOSSARY', () => {
  const requiredMetrics = ['qualityScore', 'priceRange', 'marketPosition'] as const;

  it('has definitions for all required metrics', () => {
    requiredMetrics.forEach((metric) => {
      expect(METRIC_GLOSSARY).toHaveProperty(metric);
    });
  });

  it.each(requiredMetrics)('%s has all required fields', (metricKey) => {
    const metric = METRIC_GLOSSARY[metricKey] as MetricDefinition;

    expect(metric).toHaveProperty('label');
    expect(metric).toHaveProperty('definition');
    expect(metric).toHaveProperty('scale');
    expect(metric).toHaveProperty('goodValue');
    expect(metric).toHaveProperty('testId');
  });

  it.each(requiredMetrics)('%s has non-empty field values', (metricKey) => {
    const metric = METRIC_GLOSSARY[metricKey] as MetricDefinition;

    expect(metric.label.length).toBeGreaterThan(0);
    expect(metric.definition.length).toBeGreaterThan(0);
    expect(metric.scale.length).toBeGreaterThan(0);
    expect(metric.goodValue.length).toBeGreaterThan(0);
    expect(metric.testId.length).toBeGreaterThan(0);
  });

  it('has unique test IDs for each metric', () => {
    const testIds = Object.values(METRIC_GLOSSARY).map((m) => m.testId);
    const uniqueIds = new Set(testIds);

    expect(uniqueIds.size).toBe(testIds.length);
  });

  it('qualityScore has correct test ID', () => {
    expect(METRIC_GLOSSARY.qualityScore.testId).toBe('tooltip-quality-score');
  });

  it('priceRange has correct test ID', () => {
    expect(METRIC_GLOSSARY.priceRange.testId).toBe('tooltip-price-range');
  });

  it('marketPosition has correct test ID', () => {
    expect(METRIC_GLOSSARY.marketPosition.testId).toBe('tooltip-market-position');
  });
});
