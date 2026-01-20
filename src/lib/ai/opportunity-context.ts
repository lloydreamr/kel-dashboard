/**
 * Opportunity Context Aggregation
 *
 * Aggregates knowledge base entities into a context string for AI analysis.
 * Handles token budget management and truncation when needed.
 *
 * Story 16-2: AI Opportunity Generation Job
 */

import type { GenerationContext } from './opportunity-types';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';


// Entity types from repositories
type Company = Database['public']['Tables']['companies']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Consumer = Database['public']['Tables']['consumers']['Row'];
type Trend = Database['public']['Tables']['trends']['Row'];
type ResearchDoc = Database['public']['Tables']['research_docs']['Row'];

/**
 * Token estimation constants
 *
 * Using ~4 characters per token as a simple heuristic.
 * This is conservative - actual tokens may be fewer.
 */
const CHARS_PER_TOKEN = 4;
const CONTEXT_TOKEN_BUDGET = 8000;

/**
 * Estimate token count from text length
 *
 * @param text - Input text
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Format a single company for context
 *
 * Includes: name, category, market share, strengths, weaknesses
 *
 * @param company - Company entity from database
 * @returns Formatted company string with ID marker
 */
function formatCompany(company: Company): string {
  const parts: string[] = [
    `### [ID: ${company.id}] ${company.name}`,
  ];

  if (company.category) {
    parts.push(`**Category:** ${company.category}`);
  }
  if (company.market_share !== null) {
    parts.push(`**Market Share:** ${company.market_share}%`);
  }
  if (company.revenue_estimate) {
    parts.push(`**Revenue:** ${company.revenue_estimate}`);
  }
  if (company.distribution_reach) {
    parts.push(`**Distribution:** ${company.distribution_reach}`);
  }
  if (company.strengths && company.strengths.length > 0) {
    parts.push(`**Strengths:** ${company.strengths.join(', ')}`);
  }
  if (company.weaknesses && company.weaknesses.length > 0) {
    parts.push(`**Weaknesses:** ${company.weaknesses.join(', ')}`);
  }
  if (company.raw_content) {
    // Truncate raw content to first 500 chars for context efficiency
    const truncated = company.raw_content.slice(0, 500);
    parts.push(`**Details:** ${truncated}${company.raw_content.length > 500 ? '...' : ''}`);
  }

  return parts.join('\n');
}

/**
 * Format a single product for context
 *
 * Includes: name, category, price info, flavor profile, market position
 *
 * @param product - Product entity from database
 * @returns Formatted product string with ID marker
 */
function formatProduct(product: Product): string {
  const parts: string[] = [
    `### [ID: ${product.id}] ${product.name}`,
  ];

  if (product.category) {
    parts.push(`**Category:** ${product.category}`);
  }
  if (product.price_tier) {
    parts.push(`**Price Tier:** ${product.price_tier}`);
  }
  if (product.price_point !== null) {
    parts.push(`**Price Point:** ₱${product.price_point}`);
  }
  if (product.flavor_profile && product.flavor_profile.length > 0) {
    parts.push(`**Flavors:** ${product.flavor_profile.join(', ')}`);
  }
  if (product.market_position) {
    parts.push(`**Position:** ${product.market_position}`);
  }

  return parts.join('\n');
}

/**
 * Format a single consumer segment for context
 *
 * Includes: segment name, demographics, preferences, behaviors, pain points
 *
 * @param consumer - Consumer entity from database
 * @returns Formatted consumer string with ID marker
 */
function formatConsumer(consumer: Consumer): string {
  const parts: string[] = [
    `### [ID: ${consumer.id}] ${consumer.segment_name}`,
  ];

  if (consumer.demographics) {
    parts.push(`**Demographics:** ${JSON.stringify(consumer.demographics)}`);
  }
  if (consumer.preferences && consumer.preferences.length > 0) {
    parts.push(`**Preferences:** ${consumer.preferences.join(', ')}`);
  }
  if (consumer.behaviors && consumer.behaviors.length > 0) {
    parts.push(`**Behaviors:** ${consumer.behaviors.join(', ')}`);
  }
  if (consumer.pain_points && consumer.pain_points.length > 0) {
    parts.push(`**Pain Points:** ${consumer.pain_points.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Format a single trend for context
 *
 * Includes: name, category, description, growth rate, status
 *
 * @param trend - Trend entity from database
 * @returns Formatted trend string with ID marker
 */
function formatTrend(trend: Trend): string {
  const parts: string[] = [
    `### [ID: ${trend.id}] ${trend.name}`,
  ];

  if (trend.category) {
    parts.push(`**Category:** ${trend.category}`);
  }
  if (trend.description) {
    parts.push(`**Description:** ${trend.description}`);
  }
  if (trend.growth_rate) {
    parts.push(`**Growth Rate:** ${trend.growth_rate}`);
  }
  if (trend.status) {
    parts.push(`**Status:** ${trend.status}`);
  }

  return parts.join('\n');
}

/**
 * Format a single research document for context
 *
 * Includes: title, category, summary or content excerpt
 *
 * @param doc - Research document from database
 * @returns Formatted document string with ID marker
 */
function formatResearchDoc(doc: ResearchDoc): string {
  const parts: string[] = [
    `### [ID: ${doc.id}] ${doc.title}`,
  ];

  if (doc.category) {
    parts.push(`**Category:** ${doc.category}`);
  }
  if (doc.summary) {
    parts.push(`**Summary:** ${doc.summary}`);
  } else if (doc.content) {
    // Use first 500 chars of content if no summary
    const truncated = doc.content.slice(0, 500);
    parts.push(`**Content:** ${truncated}${doc.content.length > 500 ? '...' : ''}`);
  }

  return parts.join('\n');
}

/**
 * Format all knowledge base entities into a context string
 *
 * Creates sections for each entity type with clear labeling.
 * Each entity is marked with [ID: uuid] for AI to reference.
 *
 * @param companies - Company entities
 * @param products - Product entities
 * @param consumers - Consumer segment entities
 * @param trends - Market trend entities
 * @param research - Research document entities
 * @returns Formatted context string
 */
function formatKnowledgeBaseContext(
  companies: Company[],
  products: Product[],
  consumers: Consumer[],
  trends: Trend[],
  research: ResearchDoc[]
): string {
  const sections: string[] = [];

  if (companies.length > 0) {
    sections.push(
      `## COMPANIES (${companies.length})\n\n` +
      companies.map(formatCompany).join('\n\n')
    );
  }

  if (products.length > 0) {
    sections.push(
      `## PRODUCTS (${products.length})\n\n` +
      products.map(formatProduct).join('\n\n')
    );
  }

  if (consumers.length > 0) {
    sections.push(
      `## CONSUMER SEGMENTS (${consumers.length})\n\n` +
      consumers.map(formatConsumer).join('\n\n')
    );
  }

  if (trends.length > 0) {
    sections.push(
      `## MARKET TRENDS (${trends.length})\n\n` +
      trends.map(formatTrend).join('\n\n')
    );
  }

  if (research.length > 0) {
    sections.push(
      `## RESEARCH DOCUMENTS (${research.length})\n\n` +
      research.map(formatResearchDoc).join('\n\n')
    );
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Truncate context to fit token budget
 *
 * If context exceeds budget, truncates and adds notice.
 *
 * @param context - Full context string
 * @param budget - Token budget
 * @returns Object with truncated context and truncation flag
 */
function truncateToTokenBudget(
  context: string,
  budget: number
): { context: string; wasTruncated: boolean } {
  const charBudget = budget * CHARS_PER_TOKEN;

  if (context.length <= charBudget) {
    return { context, wasTruncated: false };
  }

  const truncated = context.slice(0, charBudget);
  // Try to truncate at a section boundary for cleaner output
  const lastSectionBreak = truncated.lastIndexOf('\n\n---\n\n');
  const finalContext = lastSectionBreak > charBudget * 0.5
    ? truncated.slice(0, lastSectionBreak)
    : truncated;

  return {
    context: finalContext + '\n\n[Context truncated to fit token budget]',
    wasTruncated: true,
  };
}

/**
 * Aggregate all knowledge base entities into generation context
 *
 * Fetches all entities from the database and formats them for AI analysis.
 * Handles token budget management and truncation when needed.
 *
 * @param client - Supabase client (server client for API routes)
 * @returns GenerationContext with formatted entities and metadata
 */
export async function aggregateKnowledgeBaseContext(
  client: SupabaseClient<Database>
): Promise<GenerationContext> {
  // Fetch all entities in parallel for efficiency
  const [
    companiesResult,
    productsResult,
    consumersResult,
    trendsResult,
    researchResult,
  ] = await Promise.all([
    client.from('companies').select('*').order('name'),
    client.from('products').select('*').order('name'),
    client.from('consumers').select('*').order('segment_name'),
    client.from('trends').select('*').order('name'),
    client.from('research_docs').select('*').order('title'),
  ]);

  // Extract data, defaulting to empty arrays on error
  const companies = companiesResult.data ?? [];
  const products = productsResult.data ?? [];
  const consumers = consumersResult.data ?? [];
  const trends = trendsResult.data ?? [];
  const research = researchResult.data ?? [];

  // Format the full context
  const fullContext = formatKnowledgeBaseContext(
    companies,
    products,
    consumers,
    trends,
    research
  );

  // Apply token budget truncation
  const { context: formattedContext, wasTruncated } = truncateToTokenBudget(
    fullContext,
    CONTEXT_TOKEN_BUDGET
  );

  return {
    formattedContext,
    entityCounts: {
      companies: companies.length,
      products: products.length,
      consumers: consumers.length,
      trends: trends.length,
      research: research.length,
    },
    estimatedTokens: estimateTokens(formattedContext),
    wasTruncated,
  };
}

/**
 * Check if knowledge base has any entities
 *
 * Quick check without fetching full data.
 * Used to detect empty knowledge base scenario.
 *
 * @param client - Supabase client
 * @returns True if at least one entity exists
 */
export async function hasKnowledgeBaseEntities(
  client: SupabaseClient<Database>
): Promise<boolean> {
  // Check each table for at least one row - stop at first hit
  const tables = ['companies', 'products', 'consumers', 'trends', 'research_docs'] as const;

  for (const table of tables) {
    const { count, error } = await client
      .from(table)
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (!error && count && count > 0) {
      return true;
    }
  }

  return false;
}
