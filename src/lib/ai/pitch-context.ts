/**
 * Pitch Content Context Aggregation
 *
 * Aggregates knowledge base entities into context for pitch content generation.
 * Handles token budget management and section-specific filtering.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import type { PitchGenerationContext } from './pitch-types';
import type { PitchSectionType } from '@/types/pitch';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Entity types from database
type Company = Database['public']['Tables']['companies']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Consumer = Database['public']['Tables']['consumers']['Row'];
type Trend = Database['public']['Tables']['trends']['Row'];
type ResearchDoc = Database['public']['Tables']['research_docs']['Row'];

/**
 * Token estimation constants
 *
 * Using ~4 characters per token as a simple heuristic.
 * Pitch context has a smaller budget than opportunity analysis
 * since we're generating focused content, not broad analysis.
 */
const CHARS_PER_TOKEN = 4;
const PITCH_CONTEXT_TOKEN_BUDGET = 6000;

/**
 * Section-specific entity priorities
 *
 * Different sections benefit from different knowledge base data.
 * Higher weight = more of that entity type in context.
 */
const SECTION_ENTITY_WEIGHTS: Record<PitchSectionType, {
  companies: number;
  products: number;
  consumers: number;
  trends: number;
  research: number;
}> = {
  market_opportunity: {
    companies: 0.2,
    products: 0.2,
    consumers: 0.3,
    trends: 0.2,
    research: 0.1,
  },
  competitive_positioning: {
    companies: 0.4,
    products: 0.3,
    consumers: 0.1,
    trends: 0.1,
    research: 0.1,
  },
  trend_alignment: {
    companies: 0.1,
    products: 0.2,
    consumers: 0.2,
    trends: 0.4,
    research: 0.1,
  },
};

/**
 * Estimate token count from text length
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Format a single company for context
 *
 * Includes key competitive intelligence data.
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
    const truncated = company.raw_content.slice(0, 300);
    parts.push(`**Details:** ${truncated}${company.raw_content.length > 300 ? '...' : ''}`);
  }

  return parts.join('\n');
}

/**
 * Format a single product for context
 *
 * Includes pricing and positioning data for competitive analysis.
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
 * Includes demographics and pain points for market opportunity.
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
 * Includes growth trajectory for trend alignment section.
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
 * Uses summary or truncated content.
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
    const truncated = doc.content.slice(0, 300);
    parts.push(`**Content:** ${truncated}${doc.content.length > 300 ? '...' : ''}`);
  }

  return parts.join('\n');
}

/**
 * Build formatted context from entities with section-specific weighting
 *
 * Allocates token budget based on section type priorities.
 */
function buildWeightedContext(
  sectionType: PitchSectionType,
  companies: Company[],
  products: Product[],
  consumers: Consumer[],
  trends: Trend[],
  research: ResearchDoc[],
  tokenBudget: number
): { context: string; wasTruncated: boolean } {
  const weights = SECTION_ENTITY_WEIGHTS[sectionType];
  const charBudget = tokenBudget * CHARS_PER_TOKEN;

  // Calculate character budgets per entity type
  const budgets = {
    companies: Math.floor(charBudget * weights.companies),
    products: Math.floor(charBudget * weights.products),
    consumers: Math.floor(charBudget * weights.consumers),
    trends: Math.floor(charBudget * weights.trends),
    research: Math.floor(charBudget * weights.research),
  };

  const sections: string[] = [];
  let wasTruncated = false;

  // Helper to add entities within budget
  const addSection = <T>(
    entities: T[],
    formatter: (e: T) => string,
    budget: number,
    header: string
  ): void => {
    if (entities.length === 0) return;

    const formatted: string[] = [];
    let usedChars = 0;

    for (const entity of entities) {
      const text = formatter(entity);
      if (usedChars + text.length > budget) {
        wasTruncated = true;
        break;
      }
      formatted.push(text);
      usedChars += text.length;
    }

    if (formatted.length > 0) {
      sections.push(`## ${header} (${formatted.length}/${entities.length})\n\n${formatted.join('\n\n')}`);
    }
  };

  // Add sections in priority order for the section type
  // Higher weight sections are added first to ensure they get space
  const entityOrder = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key as keyof typeof weights);

  for (const entityType of entityOrder) {
    switch (entityType) {
      case 'companies':
        addSection(companies, formatCompany, budgets.companies, 'COMPANIES');
        break;
      case 'products':
        addSection(products, formatProduct, budgets.products, 'PRODUCTS');
        break;
      case 'consumers':
        addSection(consumers, formatConsumer, budgets.consumers, 'CONSUMER SEGMENTS');
        break;
      case 'trends':
        addSection(trends, formatTrend, budgets.trends, 'MARKET TRENDS');
        break;
      case 'research':
        addSection(research, formatResearchDoc, budgets.research, 'RESEARCH DOCUMENTS');
        break;
    }
  }

  return {
    context: sections.join('\n\n---\n\n'),
    wasTruncated,
  };
}

/**
 * Aggregate knowledge base context for pitch generation
 *
 * Fetches all entities and formats them with section-specific weighting.
 * Uses smaller token budget than opportunity generation since pitch
 * sections are focused, not broad analysis.
 *
 * @param client - Supabase client (server client for API routes)
 * @param sectionType - Type of pitch section being generated
 * @param focusIds - Optional entity IDs to prioritize (from user selection)
 * @returns PitchGenerationContext with formatted entities and metadata
 */
export async function aggregatePitchContext(
  client: SupabaseClient<Database>,
  sectionType: PitchSectionType,
  focusIds?: {
    company_ids?: string[];
    product_ids?: string[];
    consumer_ids?: string[];
    trend_ids?: string[];
  }
): Promise<PitchGenerationContext> {
  // Build queries - prioritize focus IDs if provided
  const companiesQuery = client.from('companies').select('*').order('name');
  const productsQuery = client.from('products').select('*').order('name');
  const consumersQuery = client.from('consumers').select('*').order('segment_name');
  const trendsQuery = client.from('trends').select('*').order('name');
  const researchQuery = client.from('research_docs').select('*').order('title');

  // Fetch all entities in parallel
  const [
    companiesResult,
    productsResult,
    consumersResult,
    trendsResult,
    researchResult,
  ] = await Promise.all([
    companiesQuery,
    productsQuery,
    consumersQuery,
    trendsQuery,
    researchQuery,
  ]);

  // Extract data, defaulting to empty arrays on error
  let companies = companiesResult.data ?? [];
  let products = productsResult.data ?? [];
  let consumers = consumersResult.data ?? [];
  let trends = trendsResult.data ?? [];
  const research = researchResult.data ?? [];

  // Reorder entities to prioritize focus IDs (put them first)
  if (focusIds) {
    if (focusIds.company_ids?.length) {
      const focusSet = new Set(focusIds.company_ids);
      companies = [
        ...companies.filter(c => focusSet.has(c.id)),
        ...companies.filter(c => !focusSet.has(c.id)),
      ];
    }
    if (focusIds.product_ids?.length) {
      const focusSet = new Set(focusIds.product_ids);
      products = [
        ...products.filter(p => focusSet.has(p.id)),
        ...products.filter(p => !focusSet.has(p.id)),
      ];
    }
    if (focusIds.consumer_ids?.length) {
      const focusSet = new Set(focusIds.consumer_ids);
      consumers = [
        ...consumers.filter(c => focusSet.has(c.id)),
        ...consumers.filter(c => !focusSet.has(c.id)),
      ];
    }
    if (focusIds.trend_ids?.length) {
      const focusSet = new Set(focusIds.trend_ids);
      trends = [
        ...trends.filter(t => focusSet.has(t.id)),
        ...trends.filter(t => !focusSet.has(t.id)),
      ];
    }
  }

  // Build weighted context for the section type
  const { context: formattedContext, wasTruncated } = buildWeightedContext(
    sectionType,
    companies,
    products,
    consumers,
    trends,
    research,
    PITCH_CONTEXT_TOKEN_BUDGET
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

/**
 * Resolve source names from entity IDs
 *
 * Used to display human-readable names for sources in UI.
 *
 * @param client - Supabase client
 * @param sources - Array of source references
 * @returns Map of entity_id -> name
 */
export async function resolveSourceNames(
  client: SupabaseClient<Database>,
  sources: Array<{ entity_type: string; entity_id: string }>
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();

  // Group by entity type for batch queries
  const byType: Record<string, string[]> = {};
  for (const source of sources) {
    if (!byType[source.entity_type]) {
      byType[source.entity_type] = [];
    }
    byType[source.entity_type].push(source.entity_id);
  }

  // Fetch names for each type using async functions
  const fetchCompanies = async () => {
    if (byType.company?.length) {
      const { data } = await client
        .from('companies')
        .select('id, name')
        .in('id', byType.company);
      data?.forEach(c => nameMap.set(c.id, c.name));
    }
  };

  const fetchProducts = async () => {
    if (byType.product?.length) {
      const { data } = await client
        .from('products')
        .select('id, name')
        .in('id', byType.product);
      data?.forEach(p => nameMap.set(p.id, p.name));
    }
  };

  const fetchConsumers = async () => {
    if (byType.consumer?.length) {
      const { data } = await client
        .from('consumers')
        .select('id, segment_name')
        .in('id', byType.consumer);
      data?.forEach(c => nameMap.set(c.id, c.segment_name));
    }
  };

  const fetchTrends = async () => {
    if (byType.trend?.length) {
      const { data } = await client
        .from('trends')
        .select('id, name')
        .in('id', byType.trend);
      data?.forEach(t => nameMap.set(t.id, t.name));
    }
  };

  const fetchResearch = async () => {
    if (byType.research?.length) {
      const { data } = await client
        .from('research_docs')
        .select('id, title')
        .in('id', byType.research);
      data?.forEach(r => nameMap.set(r.id, r.title));
    }
  };

  await Promise.all([
    fetchCompanies(),
    fetchProducts(),
    fetchConsumers(),
    fetchTrends(),
    fetchResearch(),
  ]);

  return nameMap;
}
