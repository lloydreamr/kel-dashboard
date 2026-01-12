/**
 * Market Intelligence Import Script
 * Epic 14 / Story 14.2
 *
 * Imports markdown research files into database tables.
 * Run with: npm run db:import
 * Dry run:  npm run db:import -- --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import type { Database } from '../src/types/database';

// Type aliases from generated database types
type Tables = Database['public']['Tables'];
type CompaniesInsert = Tables['companies']['Insert'];
type ProductsInsert = Tables['products']['Insert'];
type ConsumersInsert = Tables['consumers']['Insert'];
type TrendsInsert = Tables['trends']['Insert'];
type ResearchDocsInsert = Tables['research_docs']['Insert'];
type EntityConnectionsInsert = Tables['entity_connections']['Insert'];

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Parse command-line arguments
const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

if (dryRun) {
  console.log('🏃 DRY RUN MODE - No database writes\n');
}

// Environment validation (skip in dry-run mode)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun) {
  if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   The service role key is required to bypass RLS for import.');
    console.error('   Get it from Supabase Dashboard > Settings > API > service_role key');
    process.exit(1);
  }
}

// Admin client with service role key (bypasses RLS)
// In dry-run mode, we create a dummy client that won't be used
const supabase = createClient<Database>(
  supabaseUrl || 'http://localhost:54321',
  supabaseServiceKey || 'dummy-key-for-dry-run',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Path configuration
// Script is in kel-dashboard/scripts/
// Source data is in ../Kel Docs/market-intelligence/
const projectRoot = path.resolve(__dirname, '../../');
const marketIntelPath = path.join(projectRoot, 'Kel Docs', 'market-intelligence');

// ─────────────────────────────────────────────────────────────────────────────
// Markdown Parsing Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract H1 heading from markdown
 */
function extractH1(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Extract section content under H2 heading
 */
function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`## ${heading}[\\s\\S]*?(?=##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[0].replace(/^## .+\n/, '').trim() : null;
}

/**
 * Parse bullet list into array
 */
function parseBulletList(content: string): string[] {
  const lines = content.split('\n');
  return lines
    .filter((line) => line.match(/^[-*]\s+/))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 0);
}

/**
 * Parse table row value by key (from markdown tables)
 */
function parseTableValue(content: string, key: string): string | null {
  const regex = new RegExp(`\\|\\s*\\*\\*${key}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract first paragraph after metadata for summary
 */
function extractFirstParagraph(content: string): string | null {
  // Skip frontmatter, metadata lines, and horizontal rules
  const lines = content.split('\n');
  let foundHr = false;

  for (const line of lines) {
    if (line.startsWith('---')) {
      foundHr = true;
      continue;
    }
    // Skip empty lines, headings, and metadata
    if (!line.trim() || line.startsWith('#') || line.startsWith('**')) {
      continue;
    }
    // Return first real paragraph after HR
    if (foundHr && line.trim().length > 50) {
      return line.trim().substring(0, 500);
    }
  }
  return null;
}

/**
 * Clean company name from H1 (remove parenthetical abbreviations)
 */
function cleanCompanyName(rawName: string): string {
  // Remove parenthetical abbreviations like "(URC)" or "(PMFTC)"
  return rawName.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// File Skip Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine if a file should be skipped during import
 */
function shouldSkipFile(filename: string): boolean {
  const skipPatterns = [
    /^_TEMPLATE\.md$/i,           // Template files
    /^README\.md$/i,              // Index files
    /^\./,                        // Hidden files
    /^EXPANSION-PROPOSAL\.md$/i,  // Meta docs
    /^GUIDE\.md$/i,               // Documentation
    /-task-list\.md$/i,           // Task tracking files
    /^party-mode-session-/i,      // Session logs
  ];

  return skipPatterns.some((pattern) => pattern.test(filename));
}

// ─────────────────────────────────────────────────────────────────────────────
// File Discovery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all markdown files in a directory (non-recursive)
 */
function getMarkdownFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !shouldSkipFile(f))
    .map((f) => path.join(dirPath, f));
}

/**
 * Get relative path from market-intelligence root
 */
function getRelativePath(fullPath: string): string {
  return path.relative(marketIntelPath, fullPath);
}

/**
 * Infer product category from content and file path
 * Valid categories: 'puffed', 'chips', 'nuts', 'crackers', 'corn', 'other'
 */
function inferProductCategory(
  content: string,
  filePath: string
): 'puffed' | 'chips' | 'nuts' | 'crackers' | 'corn' | 'other' {
  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Check for keyword matches in content or path
  if (lowerContent.includes('puffed') || lowerPath.includes('puffed') || lowerContent.includes('puff')) {
    return 'puffed';
  }
  if (lowerContent.includes('chips') || lowerPath.includes('chips') || lowerContent.includes('chip')) {
    return 'chips';
  }
  if (lowerContent.includes('nuts') || lowerPath.includes('nuts') || lowerContent.includes('peanut')) {
    return 'nuts';
  }
  if (lowerContent.includes('crackers') || lowerPath.includes('crackers') || lowerContent.includes('cracker')) {
    return 'crackers';
  }
  if (lowerContent.includes('corn') || lowerPath.includes('corn')) {
    return 'corn';
  }

  return 'other';
}

/**
 * Infer trend category from content and file path
 * Valid categories: 'flavor', 'health', 'packaging', 'channel', 'technology'
 */
function inferTrendCategory(
  content: string,
  filePath: string
): 'flavor' | 'health' | 'packaging' | 'channel' | 'technology' {
  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Check for keyword matches in content or path
  if (
    lowerContent.includes('flavor') ||
    lowerPath.includes('flavor') ||
    lowerContent.includes('taste') ||
    lowerContent.includes('spicy') ||
    lowerContent.includes('sweet')
  ) {
    return 'flavor';
  }
  if (
    lowerContent.includes('health') ||
    lowerPath.includes('health') ||
    lowerContent.includes('organic') ||
    lowerContent.includes('nutrition') ||
    lowerContent.includes('wellness')
  ) {
    return 'health';
  }
  if (
    lowerContent.includes('packaging') ||
    lowerPath.includes('packaging') ||
    lowerContent.includes('package') ||
    lowerContent.includes('sustainable')
  ) {
    return 'packaging';
  }
  if (
    lowerContent.includes('channel') ||
    lowerPath.includes('channel') ||
    lowerContent.includes('distribution') ||
    lowerContent.includes('retail') ||
    lowerContent.includes('e-commerce')
  ) {
    return 'channel';
  }
  if (
    lowerContent.includes('technology') ||
    lowerPath.includes('technology') ||
    lowerContent.includes('automation') ||
    lowerContent.includes('digital')
  ) {
    return 'technology';
  }

  // Default to 'flavor' as most trends in snack industry relate to taste preferences
  return 'flavor';
}

/**
 * Infer trend status from content
 * Valid statuses: 'emerging', 'growing', 'mature', 'declining'
 */
function inferTrendStatus(content: string): 'emerging' | 'growing' | 'mature' | 'declining' {
  const lowerContent = content.toLowerCase();

  // Check for keyword matches in content
  if (lowerContent.includes('declining') || lowerContent.includes('fading') || lowerContent.includes('shrinking')) {
    return 'declining';
  }
  if (lowerContent.includes('mature') || lowerContent.includes('established') || lowerContent.includes('saturated')) {
    return 'mature';
  }
  if (lowerContent.includes('emerging') || lowerContent.includes('new trend') || lowerContent.includes('nascent')) {
    return 'emerging';
  }
  if (
    lowerContent.includes('growing') ||
    lowerContent.includes('growth') ||
    lowerContent.includes('rising') ||
    lowerContent.includes('increasing')
  ) {
    return 'growing';
  }

  // Default to 'growing' as most trends being documented are current and active
  return 'growing';
}

// ─────────────────────────────────────────────────────────────────────────────
// Import Statistics
// ─────────────────────────────────────────────────────────────────────────────

interface ImportStats {
  companies: { success: number; errors: number; skipped: number };
  products: { success: number; errors: number; skipped: number };
  consumers: { success: number; errors: number; skipped: number };
  trends: { success: number; errors: number; skipped: number };
  research_docs: { success: number; errors: number; skipped: number };
  entity_connections: { success: number; errors: number; skipped: number };
}

const stats: ImportStats = {
  companies: { success: 0, errors: 0, skipped: 0 },
  products: { success: 0, errors: 0, skipped: 0 },
  consumers: { success: 0, errors: 0, skipped: 0 },
  trends: { success: 0, errors: 0, skipped: 0 },
  research_docs: { success: 0, errors: 0, skipped: 0 },
  entity_connections: { success: 0, errors: 0, skipped: 0 },
};

interface ImportError {
  file: string;
  table: string;
  error: string;
}

const errors: ImportError[] = [];

// Store imported company names for FK lookups
const companyNameToId = new Map<string, string>();

// ─────────────────────────────────────────────────────────────────────────────
// Upsert Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upsert company using name-based lookup (unique index on lower(name))
 */
async function upsertCompany(data: CompaniesInsert): Promise<string | null> {
  if (dryRun) {
    console.log(`   [DRY RUN] Would upsert company: ${data.name}`);
    return 'dry-run-id';
  }

  // Query by name (case-insensitive match using unique index)
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', data.name)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('companies')
      .update(data)
      .eq('id', existing.id);

    if (error) throw new Error(error.message);
    return existing.id;
  } else {
    // Insert new record
    const { data: inserted, error } = await supabase
      .from('companies')
      .insert(data)
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return inserted?.id ?? null;
  }
}

/**
 * Upsert product by source_file
 */
async function upsertProduct(data: ProductsInsert): Promise<string | null> {
  if (dryRun) {
    console.log(`   [DRY RUN] Would upsert product: ${data.source_file}`);
    return 'dry-run-id';
  }

  if (!data.source_file) {
    throw new Error('source_file is required for upsert');
  }

  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('source_file', data.source_file)
    .single();

  if (existing) {
    const { error } = await supabase.from('products').update(data).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  } else {
    const { data: inserted, error } = await supabase.from('products').insert(data).select('id').single();
    if (error) throw new Error(error.message);
    return inserted?.id ?? null;
  }
}

/**
 * Upsert consumer by source_file
 */
async function upsertConsumer(data: ConsumersInsert): Promise<string | null> {
  if (dryRun) {
    console.log(`   [DRY RUN] Would upsert consumer: ${data.source_file}`);
    return 'dry-run-id';
  }

  if (!data.source_file) {
    throw new Error('source_file is required for upsert');
  }

  const { data: existing } = await supabase
    .from('consumers')
    .select('id')
    .eq('source_file', data.source_file)
    .single();

  if (existing) {
    const { error } = await supabase.from('consumers').update(data).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  } else {
    const { data: inserted, error } = await supabase.from('consumers').insert(data).select('id').single();
    if (error) throw new Error(error.message);
    return inserted?.id ?? null;
  }
}

/**
 * Upsert trend by source_file
 */
async function upsertTrend(data: TrendsInsert): Promise<string | null> {
  if (dryRun) {
    console.log(`   [DRY RUN] Would upsert trend: ${data.source_file}`);
    return 'dry-run-id';
  }

  if (!data.source_file) {
    throw new Error('source_file is required for upsert');
  }

  const { data: existing } = await supabase
    .from('trends')
    .select('id')
    .eq('source_file', data.source_file)
    .single();

  if (existing) {
    const { error } = await supabase.from('trends').update(data).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  } else {
    const { data: inserted, error } = await supabase.from('trends').insert(data).select('id').single();
    if (error) throw new Error(error.message);
    return inserted?.id ?? null;
  }
}

/**
 * Upsert research doc by source_file
 */
async function upsertResearchDoc(data: ResearchDocsInsert): Promise<string | null> {
  if (dryRun) {
    console.log(`   [DRY RUN] Would upsert research_doc: ${data.source_file}`);
    return 'dry-run-id';
  }

  if (!data.source_file) {
    throw new Error('source_file is required for upsert');
  }

  const { data: existing } = await supabase
    .from('research_docs')
    .select('id')
    .eq('source_file', data.source_file)
    .single();

  if (existing) {
    const { error } = await supabase.from('research_docs').update(data).eq('id', existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  } else {
    const { data: inserted, error } = await supabase.from('research_docs').insert(data).select('id').single();
    if (error) throw new Error(error.message);
    return inserted?.id ?? null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity Importers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse and import a company file
 */
async function importCompany(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = getRelativePath(filePath);

  const h1 = extractH1(content);
  if (!h1) {
    stats.companies.skipped++;
    if (verbose) console.log(`   ⚠️  Skipped (no H1): ${path.basename(filePath)}`);
    return;
  }

  const name = cleanCompanyName(h1);

  // Parse Quick Facts table
  const revenue = parseTableValue(content, 'Annual Revenue');
  const marketPosition = parseTableValue(content, 'Market Position');

  // Parse strengths/weaknesses sections
  const strengthsSection = extractSection(content, 'Strengths');
  const weaknessesSection = extractSection(content, 'Weaknesses');

  const strengths = strengthsSection ? parseBulletList(strengthsSection) : null;
  const weaknesses = weaknessesSection ? parseBulletList(weaknessesSection) : null;

  // Parse products if present
  const portfolioSection = extractSection(content, 'Current Portfolio')
    || extractSection(content, 'Products')
    || extractSection(content, 'Key Brands');
  const products = portfolioSection ? parseBulletList(portfolioSection) : null;

  // Parse market share (try to extract number)
  let marketShare: number | null = null;
  if (marketPosition) {
    const shareMatch = marketPosition.match(/(\d+(?:\.\d+)?)\s*%/);
    if (shareMatch) {
      marketShare = parseFloat(shareMatch[1]);
    }
  }

  const companyData: CompaniesInsert = {
    name,
    category: 'local_major', // Default, can be refined later
    revenue_estimate: revenue,
    market_share: marketShare,
    strengths: strengths && strengths.length > 0 ? strengths : null,
    weaknesses: weaknesses && weaknesses.length > 0 ? weaknesses : null,
    products: products && products.length > 0 ? products : null,
    raw_content: content,
    source_file: relativePath,
  };

  try {
    const id = await upsertCompany(companyData);
    if (id) {
      companyNameToId.set(name.toLowerCase(), id);
    }
    stats.companies.success++;
  } catch (err) {
    stats.companies.errors++;
    errors.push({
      file: relativePath,
      table: 'companies',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Parse and import a product file
 */
async function importProduct(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = getRelativePath(filePath);

  const h1 = extractH1(content);
  if (!h1) {
    stats.products.skipped++;
    if (verbose) console.log(`   ⚠️  Skipped (no H1): ${path.basename(filePath)}`);
    return;
  }

  const name = h1;

  // Try to find company reference
  let companyId: string | null = null;
  for (const [companyName, id] of companyNameToId) {
    if (content.toLowerCase().includes(companyName)) {
      companyId = id;
      break;
    }
  }

  // Parse price info
  const priceStr = parseTableValue(content, 'Price') || parseTableValue(content, 'Price Point');
  let pricePoint: number | null = null;
  if (priceStr) {
    const priceMatch = priceStr.match(/PHP?\s*(\d+(?:\.\d+)?)/i);
    if (priceMatch) {
      pricePoint = parseFloat(priceMatch[1]);
    }
  }

  // Infer category from file content or path
  // Valid categories: 'puffed', 'chips', 'nuts', 'crackers', 'corn', 'other'
  const rawCategory = parseTableValue(content, 'Category')?.toLowerCase() || '';
  const validProductCategories = ['puffed', 'chips', 'nuts', 'crackers', 'corn', 'other'] as const;
  const category = validProductCategories.find((c) => rawCategory.includes(c))
    || inferProductCategory(content, filePath);

  const productData: ProductsInsert = {
    name,
    category,
    company_id: companyId,
    price_point: pricePoint,
    source_file: relativePath,
  };

  try {
    await upsertProduct(productData);
    stats.products.success++;
  } catch (err) {
    stats.products.errors++;
    errors.push({
      file: relativePath,
      table: 'products',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Parse and import a consumer segment file
 */
async function importConsumer(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = getRelativePath(filePath);

  const h1 = extractH1(content);
  if (!h1) {
    stats.consumers.skipped++;
    if (verbose) console.log(`   ⚠️  Skipped (no H1): ${path.basename(filePath)}`);
    return;
  }

  const segmentName = h1;

  // Parse demographics (try to extract as object)
  const demographicsSection = extractSection(content, 'Demographics');
  let demographics: Record<string, string> | null = null;
  if (demographicsSection) {
    // Try to parse table rows
    const rows = demographicsSection.match(/\|[^|]+\|[^|]+\|/g);
    if (rows) {
      demographics = {};
      for (const row of rows) {
        const parts = row.split('|').filter((p) => p.trim());
        if (parts.length >= 2) {
          const key = parts[0].replace(/\*\*/g, '').trim();
          const value = parts[1].trim();
          if (key && value && !key.includes('---')) {
            demographics[key] = value;
          }
        }
      }
    }
  }

  // Parse behaviors, preferences, pain points
  const behaviorsSection = extractSection(content, 'Behaviors') || extractSection(content, 'Snacking Behavior');
  const preferencesSection = extractSection(content, 'Preferences') || extractSection(content, 'Flavor Preferences');
  const painPointsSection = extractSection(content, 'Pain Points') || extractSection(content, 'Barriers');

  const behaviors = behaviorsSection ? parseBulletList(behaviorsSection) : null;
  const preferences = preferencesSection ? parseBulletList(preferencesSection) : null;
  const painPoints = painPointsSection ? parseBulletList(painPointsSection) : null;

  const consumerData: ConsumersInsert = {
    segment_name: segmentName,
    demographics: demographics && Object.keys(demographics).length > 0 ? demographics : null,
    behaviors: behaviors && behaviors.length > 0 ? behaviors : null,
    preferences: preferences && preferences.length > 0 ? preferences : null,
    pain_points: painPoints && painPoints.length > 0 ? painPoints : null,
    source_file: relativePath,
  };

  try {
    await upsertConsumer(consumerData);
    stats.consumers.success++;
  } catch (err) {
    stats.consumers.errors++;
    errors.push({
      file: relativePath,
      table: 'consumers',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Parse and import a trend file
 */
async function importTrend(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = getRelativePath(filePath);

  const h1 = extractH1(content);
  if (!h1) {
    stats.trends.skipped++;
    if (verbose) console.log(`   ⚠️  Skipped (no H1): ${path.basename(filePath)}`);
    return;
  }

  const name = h1;

  // Extract description from Executive Summary or first paragraph
  const summary = extractSection(content, 'Executive Summary') || extractFirstParagraph(content);

  // Try to extract growth rate
  const growthRate = parseTableValue(content, 'Growth Rate') || parseTableValue(content, 'Growth');

  // Infer trend category from content
  // Valid categories: 'flavor', 'health', 'packaging', 'channel', 'technology'
  const trendCategory = inferTrendCategory(content, filePath);

  // Infer trend status from content
  // Valid statuses: 'emerging', 'growing', 'mature', 'declining'
  const trendStatus = inferTrendStatus(content);

  const trendData: TrendsInsert = {
    name,
    category: trendCategory,
    description: summary ? summary.substring(0, 1000) : null,
    growth_rate: growthRate,
    status: trendStatus,
    source_file: relativePath,
  };

  try {
    await upsertTrend(trendData);
    stats.trends.success++;
  } catch (err) {
    stats.trends.errors++;
    errors.push({
      file: relativePath,
      table: 'trends',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Parse and import a research document file
 */
async function importResearchDoc(filePath: string, category: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = getRelativePath(filePath);

  const h1 = extractH1(content);
  if (!h1) {
    stats.research_docs.skipped++;
    if (verbose) console.log(`   ⚠️  Skipped (no H1): ${path.basename(filePath)}`);
    return;
  }

  const title = h1;
  const summary = extractSection(content, 'Executive Summary')
    || extractSection(content, 'Overview')
    || extractFirstParagraph(content);

  const docData: ResearchDocsInsert = {
    title,
    category,
    summary: summary ? summary.substring(0, 500) : null,
    content,
    source_file: relativePath,
  };

  try {
    await upsertResearchDoc(docData);
    stats.research_docs.success++;
  } catch (err) {
    stats.research_docs.errors++;
    errors.push({
      file: relativePath,
      table: 'research_docs',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity Connection Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect and create company mentions in product files
 */
async function createEntityConnections(): Promise<void> {
  if (dryRun) {
    console.log('\n📎 [DRY RUN] Would create entity connections...');
    return;
  }

  console.log('\n📎 Creating entity connections...');

  // Get all products with their company_id already set
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, company_id')
    .not('company_id', 'is', null);

  if (error) {
    console.error('   ❌ Failed to fetch products:', error.message);
    return;
  }

  // Create connections for each product-company pair
  for (const product of products || []) {
    if (!product.company_id) continue;

    // Note: Relationship is from target perspective (company produces product)
    // Valid relationships: 'produces', 'competes_with', 'targets', 'related_to', 'mentions'
    // Strength must be between 0 and 1
    const connectionData: EntityConnectionsInsert = {
      source_type: 'company',
      source_id: product.company_id,
      target_type: 'product',
      target_id: product.id,
      relationship: 'produces',
      strength: 1.0, // Direct relationship
    };

    // Check if connection exists (company -> product)
    const { data: existing } = await supabase
      .from('entity_connections')
      .select('id')
      .eq('source_id', product.company_id)
      .eq('target_id', product.id)
      .single();

    if (!existing) {
      const { error: insertError } = await supabase
        .from('entity_connections')
        .insert(connectionData);

      if (insertError) {
        stats.entity_connections.errors++;
        errors.push({
          file: `product:${product.name}`,
          table: 'entity_connections',
          error: insertError.message,
        });
      } else {
        stats.entity_connections.success++;
      }
    } else {
      stats.entity_connections.skipped++;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-flight Checks
// ─────────────────────────────────────────────────────────────────────────────

async function preflight(): Promise<boolean> {
  console.log('🔍 Running pre-flight checks...\n');

  // 1. Check source folder exists
  if (!fs.existsSync(marketIntelPath)) {
    console.error(`❌ Source folder not found: ${marketIntelPath}`);
    return false;
  }
  console.log('✅ Source folder exists');

  // Skip database checks in dry-run mode
  if (dryRun) {
    console.log('⏭️  Skipping database checks (dry-run mode)\n');
    return true;
  }

  // 2. Check Supabase connection
  const { error: connError } = await supabase.from('companies').select('count').limit(1);
  if (connError) {
    console.error(`❌ Database connection failed: ${connError.message}`);
    return false;
  }
  console.log('✅ Database connected');

  // 3. Verify tables exist (migration applied)
  const tables = ['companies', 'products', 'consumers', 'trends', 'research_docs', 'entity_connections'] as const;
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.error(`❌ Table "${table}" not found. Run migration first.`);
      return false;
    }
  }
  console.log('✅ All tables exist\n');

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Import Flow
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📥 Market Intelligence Import Script\n');
  console.log(`   Source: ${marketIntelPath}`);
  console.log(`   Dry Run: ${dryRun}`);
  console.log(`   Verbose: ${verbose}\n`);

  // Pre-flight checks
  const ready = await preflight();
  if (!ready) {
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Import Companies (first, for FK lookups)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📁 Importing companies...');
  const companyFiles = getMarkdownFiles(path.join(marketIntelPath, 'companies'));
  console.log(`   Found ${companyFiles.length} files\n`);

  for (let i = 0; i < companyFiles.length; i++) {
    const file = companyFiles[i];
    const progress = `[${i + 1}/${companyFiles.length}]`;
    try {
      await importCompany(file);
      console.log(`${progress} ✅ ${path.basename(file)}`);
    } catch (err) {
      console.error(`${progress} ❌ ${path.basename(file)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Import Products
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📁 Importing products...');
  const productFiles = getMarkdownFiles(path.join(marketIntelPath, 'products'));
  console.log(`   Found ${productFiles.length} files\n`);

  for (let i = 0; i < productFiles.length; i++) {
    const file = productFiles[i];
    const progress = `[${i + 1}/${productFiles.length}]`;
    try {
      await importProduct(file);
      console.log(`${progress} ✅ ${path.basename(file)}`);
    } catch (err) {
      console.error(`${progress} ❌ ${path.basename(file)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Import Consumers
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📁 Importing consumers...');
  const consumerFiles = getMarkdownFiles(path.join(marketIntelPath, 'consumers'));
  console.log(`   Found ${consumerFiles.length} files\n`);

  for (let i = 0; i < consumerFiles.length; i++) {
    const file = consumerFiles[i];
    const progress = `[${i + 1}/${consumerFiles.length}]`;
    try {
      await importConsumer(file);
      console.log(`${progress} ✅ ${path.basename(file)}`);
    } catch (err) {
      console.error(`${progress} ❌ ${path.basename(file)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Import Trends
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📁 Importing trends...');
  const trendFiles = getMarkdownFiles(path.join(marketIntelPath, 'trends'));
  console.log(`   Found ${trendFiles.length} files\n`);

  for (let i = 0; i < trendFiles.length; i++) {
    const file = trendFiles[i];
    const progress = `[${i + 1}/${trendFiles.length}]`;
    try {
      await importTrend(file);
      console.log(`${progress} ✅ ${path.basename(file)}`);
    } catch (err) {
      console.error(`${progress} ❌ ${path.basename(file)}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Import Research Docs (multiple folders)
  // ─────────────────────────────────────────────────────────────────────────
  const researchFolders = ['distribution', 'regulatory', 'research', 'supply-chain', 'stakeholders'];

  for (const folder of researchFolders) {
    console.log(`\n📁 Importing ${folder}...`);
    const files = getMarkdownFiles(path.join(marketIntelPath, folder));
    console.log(`   Found ${files.length} files\n`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = `[${i + 1}/${files.length}]`;
      try {
        await importResearchDoc(file, folder);
        console.log(`${progress} ✅ ${path.basename(file)}`);
      } catch (err) {
        console.error(`${progress} ❌ ${path.basename(file)}`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Create Entity Connections
  // ─────────────────────────────────────────────────────────────────────────
  await createEntityConnections();

  // ─────────────────────────────────────────────────────────────────────────
  // Final Report
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Import Summary');
  console.log('═'.repeat(60));

  const tables: (keyof ImportStats)[] = ['companies', 'products', 'consumers', 'trends', 'research_docs', 'entity_connections'];

  for (const table of tables) {
    const s = stats[table];
    console.log(`   ${table}: ✅ ${s.success} | ❌ ${s.errors} | ⏭️ ${s.skipped}`);
  }

  const totalSuccess = tables.reduce((sum, t) => sum + stats[t].success, 0);
  const totalErrors = tables.reduce((sum, t) => sum + stats[t].errors, 0);
  const totalSkipped = tables.reduce((sum, t) => sum + stats[t].skipped, 0);

  console.log('─'.repeat(60));
  console.log(`   TOTAL: ✅ ${totalSuccess} | ❌ ${totalErrors} | ⏭️ ${totalSkipped}`);

  if (errors.length > 0) {
    console.log('\n❌ Failed imports:');
    for (const e of errors) {
      console.log(`   - [${e.table}] ${e.file}: ${e.error}`);
    }
  }

  if (dryRun) {
    console.log('\n🏃 This was a DRY RUN - no changes were made to the database.');
  } else {
    console.log('\n✨ Import complete!');
  }
}

// Run import
main().catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
