/**
 * Pitch Template Configuration System
 *
 * Defines pre-built pitch templates optimized for different distributor types.
 * Templates are code-based config, not database-stored, for easy versioning.
 *
 * Story 18-4: Pitch Template Library
 */

import type { PitchSectionType, PitchTemplateType } from '@/types/pitch';

// ============================================================================
// Template Configuration Types
// ============================================================================

/**
 * Context weight configuration for AI generation.
 * Determines how MI data sources are weighted when aggregating context.
 * Values should sum to 1.0 for normalization.
 */
export interface TemplateContextWeights {
  companies?: number;
  products?: number;
  consumers?: number;
  trends?: number;
}

/**
 * Section configuration within a template.
 * Defines what sections are auto-created and how AI generates content.
 */
export interface PitchTemplateSection {
  /** Section type from pitch section types */
  type: PitchSectionType;
  /** Placeholder text shown to user before generation */
  placeholder: string;
  /** Additional prompt modifier for AI generation */
  aiPromptModifier?: string;
  /** Custom context weights for this section (overrides template defaults) */
  contextWeights?: TemplateContextWeights;
}

/**
 * Complete template configuration.
 * Defines all aspects of a pitch template.
 */
export interface PitchTemplateConfig {
  /** Template identifier matching PitchTemplateType */
  id: NonNullable<PitchTemplateType>;
  /** Display name for UI */
  name: string;
  /** Brief description of template purpose */
  description: string;
  /** Target audience description */
  targetAudience: string;
  /** Sections to auto-create with this template */
  sections: PitchTemplateSection[];
  /** Default tone for AI-generated content */
  defaultTone: 'formal' | 'conversational' | 'energetic';
  /** Default context weights for all sections (can be overridden per-section) */
  defaultContextWeights: TemplateContextWeights;
}

// ============================================================================
// Default Context Weights
// ============================================================================

/**
 * Default context weights when no template is selected.
 * Equal weighting across all MI data sources.
 */
export const DEFAULT_CONTEXT_WEIGHTS: TemplateContextWeights = {
  companies: 0.25,
  products: 0.25,
  consumers: 0.25,
  trends: 0.25,
};

// ============================================================================
// Template Configurations
// ============================================================================

/**
 * Mid-Size Distributor Template
 *
 * For established distributors like EFC with Metro Manila coverage.
 * Focuses on business growth potential, portfolio synergy, margin opportunities.
 */
export const MID_SIZE_TEMPLATE: PitchTemplateConfig = {
  id: 'mid_size',
  name: 'Mid-Size Distributor Pitch',
  description: 'For established distributors like EFC with Metro Manila coverage',
  targetAudience: 'Mid-size distributors (₱50M-500M revenue)',
  defaultTone: 'formal',
  defaultContextWeights: {
    companies: 0.35,
    products: 0.35,
    consumers: 0.15,
    trends: 0.15,
  },
  sections: [
    {
      type: 'market_opportunity',
      placeholder: `The Philippine snack market represents a significant growth opportunity...

**Key points to cover:**
- Market size and growth trajectory
- Underserved segments in Metro Manila
- Why timing is right for Kel entry
- Revenue potential for distributor portfolio`,
      aiPromptModifier: `Focus on business growth potential and market size data.
Emphasize portfolio synergy and margin opportunities.
Use formal, data-driven language suitable for business presentations.
Include specific market figures and growth projections where available.`,
      contextWeights: {
        companies: 0.3,
        products: 0.3,
        consumers: 0.2,
        trends: 0.2,
      },
    },
    {
      type: 'competitive_positioning',
      placeholder: `How Kel differentiates from existing players in the market...

**Key points to cover:**
- Current competitive landscape gaps
- Kel's unique value proposition
- Price-quality positioning
- Portfolio fit with distributor's existing brands`,
      aiPromptModifier: `Highlight clear differentiation from established competitors.
Focus on gaps in current market offerings that Kel fills.
Emphasize compatibility with existing distributor portfolio.
Use comparative data to support positioning claims.`,
      contextWeights: {
        companies: 0.4,
        products: 0.4,
        consumers: 0.1,
        trends: 0.1,
      },
    },
    {
      type: 'trend_alignment',
      placeholder: `Consumer trends that Kel products address...

**Key points to cover:**
- Rising consumer preferences Kel aligns with
- Health and wellness trends in snacking
- Premium/value segment movements
- Long-term market trajectory`,
      aiPromptModifier: `Connect Kel products to quantifiable consumer trends.
Emphasize long-term market trajectory and sustainability.
Focus on trends that translate to business growth.
Use formal language with data-backed trend analysis.`,
      contextWeights: {
        consumers: 0.5,
        trends: 0.5,
        companies: 0,
        products: 0,
      },
    },
  ],
};

/**
 * Regional Distributor Template
 *
 * For provincial distributors with regional market focus.
 * Emphasizes local market potential and practical logistics.
 */
export const REGIONAL_TEMPLATE: PitchTemplateConfig = {
  id: 'regional',
  name: 'Regional Distributor Pitch',
  description: 'For provincial distributors with regional market focus',
  targetAudience: 'Regional distributors covering Visayas/Mindanao',
  defaultTone: 'conversational',
  defaultContextWeights: {
    companies: 0.25,
    products: 0.30,
    consumers: 0.30,
    trends: 0.15,
  },
  sections: [
    {
      type: 'market_opportunity',
      placeholder: `The regional snack market opportunity outside Metro Manila...

**Key points to cover:**
- Provincial market growth rates
- Underserved regional segments
- Local consumer preferences
- Distribution logistics considerations`,
      aiPromptModifier: `Focus on provincial market potential and regional growth.
Emphasize local consumer preferences and regional trends.
Address logistics and supply chain considerations.
Use relationship-focused, practical language.
Highlight opportunities specific to regional markets.`,
      contextWeights: {
        companies: 0.2,
        products: 0.3,
        consumers: 0.35,
        trends: 0.15,
      },
    },
    {
      type: 'competitive_positioning',
      placeholder: `How Kel competes in regional markets...

**Key points to cover:**
- Regional competitive landscape
- Local brand positioning
- Price sensitivity considerations
- Sari-sari store fit`,
      aiPromptModifier: `Focus on regional competitive dynamics.
Emphasize practical value proposition for local markets.
Address price sensitivity and value positioning.
Consider traditional trade (sari-sari) channel fit.`,
      contextWeights: {
        companies: 0.35,
        products: 0.35,
        consumers: 0.2,
        trends: 0.1,
      },
    },
    {
      type: 'trend_alignment',
      placeholder: `Regional consumer trends Kel addresses...

**Key points to cover:**
- Provincial consumer behavior shifts
- Local taste preferences
- Economic trends in regions
- Emerging opportunities`,
      aiPromptModifier: `Focus on regional consumer behavior and preferences.
Highlight trends specific to provincial markets.
Use practical, relationship-focused language.
Emphasize local market understanding.`,
      contextWeights: {
        consumers: 0.45,
        trends: 0.45,
        companies: 0.05,
        products: 0.05,
      },
    },
  ],
};

/**
 * WOFEX Booth Conversation Template
 *
 * For trade show conversations at WOFEX.
 * Short, punchy content focused on quick engagement.
 */
export const WOFEX_BOOTH_TEMPLATE: PitchTemplateConfig = {
  id: 'wofex_booth',
  name: 'WOFEX Booth Conversation',
  description: 'For trade show conversations at WOFEX 2026',
  targetAudience: 'Trade show visitors and potential partners',
  defaultTone: 'energetic',
  defaultContextWeights: {
    companies: 0.1,
    products: 0.3,
    consumers: 0.35,
    trends: 0.25,
  },
  sections: [
    {
      type: 'market_opportunity',
      placeholder: `Quick market snapshot for trade show context...

**Key points to cover:**
- Consumer demand signals
- Gap in current offerings
- Immediate opportunity for early partners
- Why now is the time`,
      aiPromptModifier: `Keep content concise and punchy for trade show context.
Focus on immediate opportunities and quick hooks.
Use energetic, conversational language.
Emphasize consumer demand and market excitement.
Aim for memorable sound bites, not detailed analysis.`,
      contextWeights: {
        consumers: 0.4,
        trends: 0.35,
        products: 0.2,
        companies: 0.05,
      },
    },
    {
      type: 'competitive_positioning',
      placeholder: `Quick differentiation points for booth conversations...

**Key points to cover:**
- One-liner value proposition
- Key taste/quality differentiators
- Visual appeal points
- Trial generation hooks`,
      aiPromptModifier: `Create memorable, concise differentiation points.
Focus on taste and sensory appeal.
Use energetic language that generates interest.
Optimize for verbal delivery in noisy booth environment.
Include conversation starters and hooks.`,
      contextWeights: {
        products: 0.5,
        consumers: 0.3,
        companies: 0.15,
        trends: 0.05,
      },
    },
    {
      type: 'trend_alignment',
      placeholder: `Trending topics to mention in booth conversations...

**Key points to cover:**
- Hot consumer trends to reference
- Industry buzz topics
- Quick credibility points
- Conversation hooks`,
      aiPromptModifier: `Identify trending topics that resonate at trade shows.
Focus on buzzworthy, timely trends.
Create quick reference points for conversations.
Use energetic, engaging language.
Optimize for verbal delivery and memorability.`,
      contextWeights: {
        trends: 0.5,
        consumers: 0.35,
        products: 0.1,
        companies: 0.05,
      },
    },
  ],
};

// ============================================================================
// Template Registry
// ============================================================================

/**
 * All available templates indexed by ID.
 */
const TEMPLATE_REGISTRY: Record<NonNullable<PitchTemplateType>, PitchTemplateConfig> = {
  mid_size: MID_SIZE_TEMPLATE,
  regional: REGIONAL_TEMPLATE,
  wofex_booth: WOFEX_BOOTH_TEMPLATE,
};

/**
 * Array of all template configurations for iteration.
 */
export const ALL_TEMPLATES: PitchTemplateConfig[] = Object.values(TEMPLATE_REGISTRY);

// ============================================================================
// Template Access Functions
// ============================================================================

/**
 * Get template configuration by type.
 *
 * @param templateType - Template type or null for custom
 * @returns Template config or null if custom/not found
 */
export function getTemplateConfig(
  templateType: PitchTemplateType
): PitchTemplateConfig | null {
  if (!templateType) {
    return null;
  }
  return TEMPLATE_REGISTRY[templateType] ?? null;
}

/**
 * Get context weights for a template.
 * Falls back to default weights if template is null or not found.
 *
 * @param templateType - Template type or null
 * @returns Context weights to use
 */
export function getTemplateContextWeights(
  templateType: PitchTemplateType
): TemplateContextWeights {
  const template = getTemplateConfig(templateType);
  return template?.defaultContextWeights ?? DEFAULT_CONTEXT_WEIGHTS;
}

/**
 * Get context weights for a specific section within a template.
 * Uses section-specific weights if defined, otherwise template defaults.
 *
 * @param templateType - Template type or null
 * @param sectionType - Section type
 * @returns Context weights for the section
 */
export function getSectionContextWeights(
  templateType: PitchTemplateType,
  sectionType: PitchSectionType
): TemplateContextWeights {
  const template = getTemplateConfig(templateType);
  if (!template) {
    return DEFAULT_CONTEXT_WEIGHTS;
  }

  const section = template.sections.find((s) => s.type === sectionType);
  return section?.contextWeights ?? template.defaultContextWeights;
}

/**
 * Get sections to create for a template.
 *
 * @param templateType - Template type or null
 * @returns Array of sections to create, empty for custom
 */
export function getTemplateSections(
  templateType: PitchTemplateType
): PitchTemplateSection[] {
  const template = getTemplateConfig(templateType);
  return template?.sections ?? [];
}

/**
 * Get AI prompt modifier for a section within a template.
 *
 * @param templateType - Template type or null
 * @param sectionType - Section type
 * @returns Prompt modifier string or undefined
 */
export function getSectionPromptModifier(
  templateType: PitchTemplateType,
  sectionType: PitchSectionType
): string | undefined {
  const template = getTemplateConfig(templateType);
  if (!template) {
    return undefined;
  }

  const section = template.sections.find((s) => s.type === sectionType);
  return section?.aiPromptModifier;
}

/**
 * Get default tone for a template.
 *
 * @param templateType - Template type or null
 * @returns Tone string, defaults to 'formal' for custom
 */
export function getTemplateTone(
  templateType: PitchTemplateType
): 'formal' | 'conversational' | 'energetic' {
  const template = getTemplateConfig(templateType);
  return template?.defaultTone ?? 'formal';
}
