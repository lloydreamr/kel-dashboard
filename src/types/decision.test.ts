import { describe, expect, it } from 'vitest';

import {
  isValidConstraintsArray,
  getDecisionTypeLabel,
  getDecisionTypeColor,
  DECISION_TYPES,
  CONSTRAINT_PRESETS,
} from './decision';

describe('isValidConstraintsArray', () => {
  it('accepts valid constraints array', () => {
    expect(isValidConstraintsArray([{ type: 'price' }])).toBe(true);
    expect(
      isValidConstraintsArray([
        { type: 'price', context: 'Under $50k' },
        { type: 'timeline' },
      ])
    ).toBe(true);
  });

  it('accepts empty array', () => {
    expect(isValidConstraintsArray([])).toBe(true);
  });

  it('rejects non-array', () => {
    expect(isValidConstraintsArray('budget')).toBe(false);
    expect(isValidConstraintsArray({ type: 'budget' })).toBe(false);
    expect(isValidConstraintsArray(null)).toBe(false);
    expect(isValidConstraintsArray(undefined)).toBe(false);
  });

  it('rejects array with invalid items', () => {
    expect(isValidConstraintsArray([null])).toBe(false);
    expect(isValidConstraintsArray(['budget'])).toBe(false);
    expect(isValidConstraintsArray([{ context: 'no type' }])).toBe(false);
    expect(isValidConstraintsArray([{ type: '' }])).toBe(false);
    expect(isValidConstraintsArray([{ type: '  ' }])).toBe(false);
  });

  it('rejects array with non-string context', () => {
    expect(isValidConstraintsArray([{ type: 'budget', context: 123 }])).toBe(
      false
    );
  });
});

describe('getDecisionTypeLabel', () => {
  it('returns correct labels', () => {
    expect(getDecisionTypeLabel('approved')).toBe('Approved');
    expect(getDecisionTypeLabel('approved_with_constraint')).toBe(
      'Approved with Constraints'
    );
    expect(getDecisionTypeLabel('explore_alternatives')).toBe(
      'Exploring Alternatives'
    );
  });
});

describe('getDecisionTypeColor', () => {
  it('returns correct colors', () => {
    expect(getDecisionTypeColor('approved')).toBe('success');
    expect(getDecisionTypeColor('approved_with_constraint')).toBe('success');
    expect(getDecisionTypeColor('explore_alternatives')).toBe('warning');
  });
});

describe('constants', () => {
  it('exports decision types', () => {
    expect(DECISION_TYPES.APPROVED).toBe('approved');
    expect(DECISION_TYPES.APPROVED_WITH_CONSTRAINT).toBe(
      'approved_with_constraint'
    );
    expect(DECISION_TYPES.EXPLORE_ALTERNATIVES).toBe('explore_alternatives');
  });

  it('exports constraint presets', () => {
    expect(CONSTRAINT_PRESETS.PRICE).toBe('price');
    expect(CONSTRAINT_PRESETS.VOLUME).toBe('volume');
    expect(CONSTRAINT_PRESETS.RISK).toBe('risk');
    expect(CONSTRAINT_PRESETS.TIMELINE).toBe('timeline');
  });
});
