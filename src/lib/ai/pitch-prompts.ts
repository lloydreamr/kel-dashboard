/**
 * Pitch Content Generation Prompts
 *
 * System prompt templates for AI-powered pitch section generation.
 * Instructs Claude to generate compelling pitch content based on MI data.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import type { PitchSectionType } from '@/types/pitch';
import type { PitchGenerationContext, TemplatePromptContext } from './pitch-types';

// ============================================================================
// Section-Specific Prompts
// ============================================================================

/**
 * Prompt template for Market Opportunity section
 *
 * Focuses on: market size, growth potential, white space, target segments
 */
const MARKET_OPPORTUNITY_PROMPT = `You are a market strategist helping Kel, a snack company entering the Philippine market.

Generate a compelling MARKET OPPORTUNITY statement for a distributor pitch.

CONTENT REQUIREMENTS:
1. **Market Size & Growth**: Use data from the knowledge base about market size, growth rates
2. **White Space**: Identify gaps in the current market that Kel can fill
3. **Target Segments**: Reference specific consumer segments with unmet needs
4. **Quantifiable Data**: Include specific numbers, percentages, and trends when available

TONE & STYLE:
- Professional but engaging
- Data-driven with clear evidence
- Actionable insights for the distributor
- 200-400 words for optimal pitch length

FORMAT:
- Use bullet points for key statistics
- Bold important figures and percentages
- Keep sentences concise and impactful

IMPORTANT:
- Only reference entities that are in the knowledge base
- Include confidence score based on evidence quality:
  - 0.9-1.0: Strong quantitative data with multiple sources
  - 0.7-0.89: Good data with some assumptions
  - 0.5-0.69: Limited data, more inference required
  - Below 0.5: Mostly inference, needs validation
- Link to specific entity IDs using the [ID: uuid] markers

KNOWLEDGE BASE CONTEXT:
{context}

Generate a market opportunity statement that would convince a distributor to partner with Kel.`;

/**
 * Prompt template for Competitive Positioning section
 *
 * Focuses on: competitor analysis, differentiation, unique value proposition
 */
const COMPETITIVE_POSITIONING_PROMPT = `You are a competitive analyst helping Kel, a snack company entering the Philippine market.

Generate a compelling COMPETITIVE POSITIONING section for a distributor pitch.

CONTENT REQUIREMENTS:
1. **Competitor Landscape**: Summarize key players and their positions
2. **Competitor Weaknesses**: Identify vulnerabilities Kel can exploit
3. **Kel's Differentiation**: How Kel products stand apart
4. **Value Proposition**: Clear statement of why Kel is a better choice

TONE & STYLE:
- Confident but not arrogant
- Evidence-based critique of competitors
- Focus on opportunity, not just criticism
- 200-400 words for optimal pitch length

FORMAT:
- Use comparison points where relevant
- Highlight key differentiators clearly
- Keep the focus on Kel's strengths

IMPORTANT:
- Base competitor analysis ONLY on knowledge base data
- Do not invent competitor weaknesses without evidence
- Include confidence score based on evidence quality:
  - 0.9-1.0: Direct competitive data with clear gaps
  - 0.7-0.89: Good competitive intelligence
  - 0.5-0.69: Limited competitive data
  - Below 0.5: Mostly inference
- Link to specific entity IDs using the [ID: uuid] markers

KNOWLEDGE BASE CONTEXT:
{context}

Generate a competitive positioning statement that shows why Kel has an advantage.`;

/**
 * Prompt template for Trend Alignment section
 *
 * Focuses on: market trends, consumer preferences, future outlook
 */
const TREND_ALIGNMENT_PROMPT = `You are a trend analyst helping Kel, a snack company entering the Philippine market.

Generate a compelling TREND ALIGNMENT section for a distributor pitch.

CONTENT REQUIREMENTS:
1. **Rising Trends**: Identify consumer and industry trends Kel aligns with
2. **Consumer Preferences**: Reference evolving taste and behavior patterns
3. **Future Outlook**: Show how Kel is positioned for growth
4. **Evidence**: Support claims with trend data and consumer insights

TONE & STYLE:
- Forward-looking and optimistic
- Grounded in real data
- Shows Kel as ahead of the curve
- 200-400 words for optimal pitch length

FORMAT:
- Organize by trend relevance
- Show clear connection between trends and Kel products
- Use concrete examples where possible

IMPORTANT:
- Only reference trends present in the knowledge base
- Connect trends to specific consumer segments when available
- Include confidence score based on evidence quality:
  - 0.9-1.0: Strong trend data with clear trajectory
  - 0.7-0.89: Good trend data
  - 0.5-0.69: Limited trend data
  - Below 0.5: Mostly speculation
- Link to specific entity IDs using the [ID: uuid] markers

KNOWLEDGE BASE CONTEXT:
{context}

Generate a trend alignment statement that shows Kel riding momentum.`;

// ============================================================================
// Prompt Selection
// ============================================================================

/**
 * Section-specific prompt templates
 */
/**
 * Placeholder prompt for dynamic data sections
 *
 * These sections (competitive_landscape, market_gaps) use live data
 * from hooks instead of AI generation, but we need prompts for type completeness.
 */
const DYNAMIC_SECTION_PLACEHOLDER = `This section uses live data from the database and does not require AI generation.`;

const SECTION_PROMPTS: Record<PitchSectionType, string> = {
  market_opportunity: MARKET_OPPORTUNITY_PROMPT,
  competitive_positioning: COMPETITIVE_POSITIONING_PROMPT,
  trend_alignment: TREND_ALIGNMENT_PROMPT,
  // Dynamic data sections (Story 18-2) - not used for AI generation
  competitive_landscape: DYNAMIC_SECTION_PLACEHOLDER,
  market_gaps: DYNAMIC_SECTION_PLACEHOLDER,
};

/**
 * Tone descriptions for prompt injection
 *
 * Story 18-4: Templates specify tone, which modifies the style instructions.
 */
const TONE_INSTRUCTIONS: Record<NonNullable<TemplatePromptContext['tone']>, string> = {
  formal: 'Use professional, data-driven language suitable for formal business presentations.',
  conversational: 'Use friendly, relationship-focused language that builds rapport.',
  energetic: 'Use dynamic, punchy language that generates excitement and interest.',
};

/**
 * Build the pitch generation prompt with context
 *
 * Injects the knowledge base context into the appropriate template.
 * Story 18-4: When templateContext is provided, injects the template's
 * prompt modifier and adjusts tone for different distributor types.
 *
 * @param sectionType - Type of section to generate
 * @param context - PitchGenerationContext with formatted entities
 * @param templateContext - Optional template-specific instructions
 * @returns Complete prompt ready for generateObject()
 */
export function buildPitchPrompt(
  sectionType: PitchSectionType,
  context: PitchGenerationContext,
  templateContext?: TemplatePromptContext
): string {
  const template = SECTION_PROMPTS[sectionType];
  let prompt = template.replace('{context}', context.formattedContext);

  // Story 18-4: Inject template-specific instructions if provided
  if (templateContext) {
    const additions: string[] = [];

    // Add tone instruction if specified
    if (templateContext.tone) {
      additions.push(`\nTONE: ${TONE_INSTRUCTIONS[templateContext.tone]}`);
    }

    // Add template-specific prompt modifier
    if (templateContext.promptModifier) {
      additions.push(`\nTEMPLATE GUIDANCE:\n${templateContext.promptModifier}`);
    }

    // Insert before the KNOWLEDGE BASE CONTEXT section
    if (additions.length > 0) {
      const contextMarker = 'KNOWLEDGE BASE CONTEXT:';
      const insertPoint = prompt.indexOf(contextMarker);
      if (insertPoint !== -1) {
        prompt =
          prompt.slice(0, insertPoint) +
          additions.join('\n') +
          '\n\n' +
          prompt.slice(insertPoint);
      }
    }
  }

  return prompt;
}

/**
 * Prompt for when no knowledge base context is available
 *
 * Instructs Claude to return empty/minimal content gracefully.
 */
export const NO_CONTEXT_PITCH_PROMPT = `You are a market strategist helping Kel, a snack company entering the Philippine market.

The knowledge base appears to be empty or unavailable. Without data to reference, you cannot generate evidence-based pitch content.

Please return a minimal placeholder response indicating that content cannot be generated without market intelligence data. Suggest that the user add data to the knowledge base first.

Keep the response brief and professional.`;

/**
 * Get human-readable label for section type
 */
export function getSectionLabel(sectionType: PitchSectionType): string {
  const labels: Record<PitchSectionType, string> = {
    market_opportunity: 'Market Opportunity',
    competitive_positioning: 'Competitive Positioning',
    trend_alignment: 'Trend Alignment',
    // Dynamic data sections (Story 18-2)
    competitive_landscape: 'Competitive Landscape',
    market_gaps: 'Market Gaps',
  };
  return labels[sectionType];
}
