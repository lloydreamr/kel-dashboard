/**
 * Content Extraction Utilities
 *
 * Extracts embeddable text content from database entities.
 * Each entity type has specific fields that contribute to searchable content.
 *
 * The extracted content is then chunked and embedded for similarity search.
 */

import type { Database } from '@/types/database';

// Entity types from database
type Company = Database['public']['Tables']['companies']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Consumer = Database['public']['Tables']['consumers']['Row'];
type Trend = Database['public']['Tables']['trends']['Row'];
type ResearchDoc = Database['public']['Tables']['research_docs']['Row'];

/**
 * Sanitize markdown headings in user content
 * Removes heading markers (# ## ###) that could interfere with chunking
 * The chunker splits on headings, so user content with headings breaks chunking
 */
function sanitizeMarkdown(text: string | null | undefined): string | null {
  if (!text) return null;
  // Remove markdown heading markers at start of lines
  // Converts "## Heading" to "Heading" to prevent chunk boundary issues
  return text.replace(/^#{1,6}\s+/gm, '');
}

/**
 * Extract searchable content from a company entity
 *
 * Includes: name, category, raw content, strengths, weaknesses, distribution
 */
export function extractCompanyContent(company: Company): string {
  const parts: (string | null | undefined)[] = [
    `# ${company.name}`,
    company.category && `Category: ${company.category}`,
    sanitizeMarkdown(company.raw_content),
    company.strengths?.length
      ? `## Strengths\n${company.strengths.map(s => `- ${s}`).join('\n')}`
      : null,
    company.weaknesses?.length
      ? `## Weaknesses\n${company.weaknesses.map(w => `- ${w}`).join('\n')}`
      : null,
    company.distribution_reach &&
      `## Distribution\n${sanitizeMarkdown(company.distribution_reach)}`,
    company.products?.length
      ? `## Products\n${company.products.join(', ')}`
      : null,
    company.market_share != null
      ? `Market share: ${company.market_share}%`
      : null,
    company.revenue_estimate &&
      `Revenue estimate: ${company.revenue_estimate}`,
  ];

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Extract searchable content from a product entity
 *
 * Includes: name, category, market position, price tier, flavor profile
 */
export function extractProductContent(product: Product): string {
  const parts: (string | null | undefined)[] = [
    `# ${product.name}`,
    product.category && `Category: ${product.category}`,
    product.market_position && `## Market Position\n${sanitizeMarkdown(product.market_position)}`,
    product.price_tier && `Price tier: ${product.price_tier}`,
    product.price_point != null ? `Price point: ₱${product.price_point}` : null,
    product.flavor_profile?.length
      ? `Flavors: ${product.flavor_profile.join(', ')}`
      : null,
  ];

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Extract searchable content from a consumer segment entity
 *
 * Includes: segment name, behaviors, preferences, pain points, demographics
 */
export function extractConsumerContent(consumer: Consumer): string {
  const parts: (string | null | undefined)[] = [
    `# Consumer Segment: ${consumer.segment_name}`,
    consumer.behaviors?.length
      ? `## Behaviors\n${consumer.behaviors.map(b => `- ${b}`).join('\n')}`
      : null,
    consumer.preferences?.length
      ? `## Preferences\n${consumer.preferences.map(p => `- ${p}`).join('\n')}`
      : null,
    consumer.pain_points?.length
      ? `## Pain Points\n${consumer.pain_points.map(p => `- ${p}`).join('\n')}`
      : null,
    consumer.demographics
      ? `## Demographics\n${formatDemographics(consumer.demographics)}`
      : null,
  ];

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Extract searchable content from a market trend entity
 *
 * Includes: name, category, description, growth rate, status
 */
export function extractTrendContent(trend: Trend): string {
  const parts: (string | null | undefined)[] = [
    `# Trend: ${trend.name}`,
    trend.category && `Category: ${trend.category}`,
    trend.description && `## Description\n${sanitizeMarkdown(trend.description)}`,
    trend.growth_rate && `Growth rate: ${trend.growth_rate}`,
    trend.status && `Status: ${trend.status}`,
  ];

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Extract searchable content from a research document
 *
 * Includes: title, category, full content (or summary if content unavailable)
 */
export function extractResearchDocContent(doc: ResearchDoc): string {
  const parts: (string | null | undefined)[] = [
    `# ${doc.title}`,
    doc.category && `Category: ${doc.category}`,
    sanitizeMarkdown(doc.content) || sanitizeMarkdown(doc.summary),
  ];

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Helper to format demographics JSON as readable text
 */
function formatDemographics(demographics: unknown): string {
  if (typeof demographics === 'string') {
    return demographics;
  }

  if (typeof demographics === 'object' && demographics !== null) {
    return Object.entries(demographics as Record<string, unknown>)
      .map(([key, value]) => `- ${key}: ${formatValue(value)}`)
      .join('\n');
  }

  return String(demographics);
}

/**
 * Helper to format a value for display
 */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value ?? '');
}
