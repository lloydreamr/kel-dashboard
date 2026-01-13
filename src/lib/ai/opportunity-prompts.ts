/**
 * Opportunity Generation Prompts
 *
 * System prompt templates for AI-powered opportunity analysis.
 * Instructs Claude to analyze the knowledge base and identify market opportunities.
 *
 * Story 16-2: AI Opportunity Generation Job
 */

import type { GenerationContext } from './opportunity-types';

/**
 * System prompt template for opportunity analysis
 *
 * Instructs Claude to:
 * - Analyze all knowledge base entities
 * - Identify opportunities in 4 categories
 * - Return structured JSON with confidence scores
 * - Link supporting evidence to specific entities
 */
const OPPORTUNITY_ANALYSIS_PROMPT = `You are an AI market analyst helping Kel, a snack company entering the Philippine market.

Analyze the provided knowledge base and identify actionable opportunities.

CATEGORIES TO IDENTIFY:
1. **market_gap**: Underserved segments or unmet needs in the market
   - Examples: Geographic gaps, demographic gaps, price tier gaps, occasion gaps
   - Look for areas where demand exists but supply is weak

2. **product_opportunity**: Product ideas based on trends/preferences
   - Examples: Flavor innovations, format innovations, health positioning
   - Look for emerging preferences that competitors haven't addressed

3. **competitive_weakness**: Vulnerabilities in existing players
   - Examples: Distribution gaps, quality issues, brand perception problems
   - Look for competitor weaknesses Kel could exploit

4. **trend_alignment**: Rising trends Kel could leverage
   - Examples: Health trends, convenience trends, premiumization
   - Look for momentum Kel could ride

FOR EACH OPPORTUNITY:
- **Title**: Concise, actionable name (e.g., "Health-Conscious Teen Snacking Gap")
- **Description**: 2-3 sentences explaining the opportunity and its potential
- **Confidence Score**: 0.0-1.0 based on evidence strength
  - 0.9-1.0: Multiple strong data points confirm the opportunity
  - 0.7-0.89: Good evidence with some gaps
  - 0.5-0.69: Moderate evidence, needs validation
  - Below 0.5: Speculative, limited evidence
- **Supporting Evidence**: Link to specific entities with excerpts
  - Use the exact entity IDs from the [ID: uuid] markers
  - Include relevance scores and key excerpts
- **Reasoning**: Explain WHY this is an opportunity for Kel

IMPORTANT GUIDELINES:
- Only identify opportunities that have supporting evidence in the knowledge base
- Do NOT make up opportunities without data backing
- Aim for 5-15 high-quality opportunities rather than many low-quality ones
- Prioritize opportunities that are actionable for a market entrant
- Consider Kel's position as a newcomer - what can they uniquely offer?

KNOWLEDGE BASE CONTEXT:
{context}

ENTITY COUNTS:
- Companies: {companies_count}
- Products: {products_count}
- Consumer Segments: {consumers_count}
- Market Trends: {trends_count}
- Research Documents: {research_count}

Analyze the above context and return your findings as structured JSON.`;

/**
 * Build the opportunity analysis prompt with context
 *
 * Injects the knowledge base context and entity counts into the template.
 *
 * @param context - GenerationContext with formatted entities and counts
 * @returns Complete system prompt ready for generateObject()
 */
export function buildOpportunityPrompt(context: GenerationContext): string {
  return OPPORTUNITY_ANALYSIS_PROMPT
    .replace('{context}', context.formattedContext)
    .replace('{companies_count}', String(context.entityCounts.companies))
    .replace('{products_count}', String(context.entityCounts.products))
    .replace('{consumers_count}', String(context.entityCounts.consumers))
    .replace('{trends_count}', String(context.entityCounts.trends))
    .replace('{research_count}', String(context.entityCounts.research));
}

/**
 * Prompt for when no knowledge base context is available
 *
 * Used when the knowledge base is empty or inaccessible.
 * Instructs Claude to return zero opportunities gracefully.
 */
export const NO_CONTEXT_OPPORTUNITY_PROMPT = `You are an AI market analyst helping Kel, a snack company entering the Philippine market.

The knowledge base appears to be empty or unavailable. Without data to analyze, you cannot identify market opportunities.

Please return an empty analysis result with zero opportunities.

Note: This is expected behavior when the knowledge base hasn't been populated yet.`;
