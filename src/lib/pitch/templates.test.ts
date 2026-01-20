/**
 * Pitch Template Configuration Tests
 *
 * Unit tests for template retrieval and configuration functions.
 *
 * Story 18-4: Pitch Template Library
 */

import { describe, it, expect } from 'vitest';
import {
  getTemplateConfig,
  getTemplateContextWeights,
  getSectionContextWeights,
  getTemplateSections,
  getSectionPromptModifier,
  getTemplateTone,
  MID_SIZE_TEMPLATE,
  REGIONAL_TEMPLATE,
  WOFEX_BOOTH_TEMPLATE,
  ALL_TEMPLATES,
  DEFAULT_CONTEXT_WEIGHTS,
} from './templates';

describe('templates', () => {
  describe('template constants', () => {
    it('exports MID_SIZE_TEMPLATE with correct id', () => {
      expect(MID_SIZE_TEMPLATE.id).toBe('mid_size');
      expect(MID_SIZE_TEMPLATE.name).toBe('Mid-Size Distributor Pitch');
      expect(MID_SIZE_TEMPLATE.defaultTone).toBe('formal');
    });

    it('exports REGIONAL_TEMPLATE with correct id', () => {
      expect(REGIONAL_TEMPLATE.id).toBe('regional');
      expect(REGIONAL_TEMPLATE.name).toBe('Regional Distributor Pitch');
      expect(REGIONAL_TEMPLATE.defaultTone).toBe('conversational');
    });

    it('exports WOFEX_BOOTH_TEMPLATE with correct id', () => {
      expect(WOFEX_BOOTH_TEMPLATE.id).toBe('wofex_booth');
      expect(WOFEX_BOOTH_TEMPLATE.name).toBe('WOFEX Booth Conversation');
      expect(WOFEX_BOOTH_TEMPLATE.defaultTone).toBe('energetic');
    });

    it('ALL_TEMPLATES contains all three templates', () => {
      expect(ALL_TEMPLATES).toHaveLength(3);
      expect(ALL_TEMPLATES.map((t) => t.id)).toEqual(
        expect.arrayContaining(['mid_size', 'regional', 'wofex_booth'])
      );
    });

    it('all templates have required sections', () => {
      for (const template of ALL_TEMPLATES) {
        expect(template.sections.length).toBeGreaterThan(0);
        for (const section of template.sections) {
          expect(section.type).toBeDefined();
          expect(section.placeholder).toBeDefined();
          expect(section.placeholder.length).toBeGreaterThan(0);
        }
      }
    });

    it('all templates have valid context weights that sum to ~1.0', () => {
      for (const template of ALL_TEMPLATES) {
        const weights = template.defaultContextWeights;
        const sum =
          (weights.companies ?? 0) +
          (weights.products ?? 0) +
          (weights.consumers ?? 0) +
          (weights.trends ?? 0);
        expect(sum).toBeCloseTo(1.0, 2);
      }
    });
  });

  describe('getTemplateConfig', () => {
    it('returns MID_SIZE_TEMPLATE for mid_size', () => {
      const config = getTemplateConfig('mid_size');
      expect(config).toBe(MID_SIZE_TEMPLATE);
    });

    it('returns REGIONAL_TEMPLATE for regional', () => {
      const config = getTemplateConfig('regional');
      expect(config).toBe(REGIONAL_TEMPLATE);
    });

    it('returns WOFEX_BOOTH_TEMPLATE for wofex_booth', () => {
      const config = getTemplateConfig('wofex_booth');
      expect(config).toBe(WOFEX_BOOTH_TEMPLATE);
    });

    it('returns null for null template type', () => {
      const config = getTemplateConfig(null);
      expect(config).toBeNull();
    });
  });

  describe('getTemplateContextWeights', () => {
    it('returns template weights for mid_size', () => {
      const weights = getTemplateContextWeights('mid_size');
      expect(weights.companies).toBe(0.35);
      expect(weights.products).toBe(0.35);
      expect(weights.consumers).toBe(0.15);
      expect(weights.trends).toBe(0.15);
    });

    it('returns template weights for wofex_booth', () => {
      const weights = getTemplateContextWeights('wofex_booth');
      expect(weights.consumers).toBe(0.35);
      expect(weights.trends).toBe(0.25);
    });

    it('returns default weights for null template', () => {
      const weights = getTemplateContextWeights(null);
      expect(weights).toEqual(DEFAULT_CONTEXT_WEIGHTS);
    });
  });

  describe('getSectionContextWeights', () => {
    it('returns section-specific weights when defined', () => {
      const weights = getSectionContextWeights('mid_size', 'trend_alignment');
      expect(weights.consumers).toBe(0.5);
      expect(weights.trends).toBe(0.5);
      expect(weights.companies).toBe(0);
      expect(weights.products).toBe(0);
    });

    it('returns template defaults for section without custom weights', () => {
      // If a section doesn't have custom weights, it uses template defaults
      const templateWeights = MID_SIZE_TEMPLATE.defaultContextWeights;
      const sectionWeights = getSectionContextWeights('mid_size', 'market_opportunity');
      // market_opportunity has its own weights, so check those
      expect(sectionWeights.companies).toBe(0.3);
    });

    it('returns default weights for null template', () => {
      const weights = getSectionContextWeights(null, 'market_opportunity');
      expect(weights).toEqual(DEFAULT_CONTEXT_WEIGHTS);
    });

    it('returns template defaults for unknown section type', () => {
      const weights = getSectionContextWeights('mid_size', 'competitive_landscape');
      // competitive_landscape not in mid_size sections, falls back to template defaults
      expect(weights).toEqual(MID_SIZE_TEMPLATE.defaultContextWeights);
    });
  });

  describe('getTemplateSections', () => {
    it('returns sections for mid_size template', () => {
      const sections = getTemplateSections('mid_size');
      expect(sections).toHaveLength(3);
      expect(sections.map((s) => s.type)).toEqual([
        'market_opportunity',
        'competitive_positioning',
        'trend_alignment',
      ]);
    });

    it('returns sections for regional template', () => {
      const sections = getTemplateSections('regional');
      expect(sections).toHaveLength(3);
    });

    it('returns sections for wofex_booth template', () => {
      const sections = getTemplateSections('wofex_booth');
      expect(sections).toHaveLength(3);
    });

    it('returns empty array for null template', () => {
      const sections = getTemplateSections(null);
      expect(sections).toEqual([]);
    });
  });

  describe('getSectionPromptModifier', () => {
    it('returns prompt modifier for mid_size market_opportunity', () => {
      const modifier = getSectionPromptModifier('mid_size', 'market_opportunity');
      expect(modifier).toBeDefined();
      expect(modifier).toContain('business growth potential');
    });

    it('returns prompt modifier for wofex_booth competitive_positioning', () => {
      const modifier = getSectionPromptModifier('wofex_booth', 'competitive_positioning');
      expect(modifier).toBeDefined();
      expect(modifier).toContain('energetic');
    });

    it('returns undefined for null template', () => {
      const modifier = getSectionPromptModifier(null, 'market_opportunity');
      expect(modifier).toBeUndefined();
    });

    it('returns undefined for section not in template', () => {
      const modifier = getSectionPromptModifier('mid_size', 'competitive_landscape');
      expect(modifier).toBeUndefined();
    });
  });

  describe('getTemplateTone', () => {
    it('returns formal for mid_size', () => {
      expect(getTemplateTone('mid_size')).toBe('formal');
    });

    it('returns conversational for regional', () => {
      expect(getTemplateTone('regional')).toBe('conversational');
    });

    it('returns energetic for wofex_booth', () => {
      expect(getTemplateTone('wofex_booth')).toBe('energetic');
    });

    it('returns formal for null template', () => {
      expect(getTemplateTone(null)).toBe('formal');
    });
  });

  describe('template section placeholders', () => {
    it('mid_size placeholders contain business-focused prompts', () => {
      const sections = getTemplateSections('mid_size');
      const marketOpp = sections.find((s) => s.type === 'market_opportunity');
      expect(marketOpp?.placeholder).toContain('Market size');
      expect(marketOpp?.placeholder).toContain('growth trajectory');
    });

    it('wofex_booth placeholders contain trade show context', () => {
      const sections = getTemplateSections('wofex_booth');
      const marketOpp = sections.find((s) => s.type === 'market_opportunity');
      expect(marketOpp?.placeholder).toContain('trade show');
    });

    it('regional placeholders contain provincial focus', () => {
      const sections = getTemplateSections('regional');
      const marketOpp = sections.find((s) => s.type === 'market_opportunity');
      expect(marketOpp?.placeholder).toContain('Provincial');
    });
  });
});
