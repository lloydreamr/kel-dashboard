/**
 * Embedding Generation CLI Script
 *
 * Generates vector embeddings for all documents in the knowledge base.
 * Uses OpenAI text-embedding-3-small model.
 *
 * Usage:
 *   npm run embeddings:generate           # Generate all embeddings
 *   npm run embeddings:generate -- --dry-run   # Preview without generating
 *   npm run embeddings:generate -- --type companies  # Only companies
 *
 * Prerequisites:
 * 1. Supabase project with document_embeddings table created
 * 2. .env.local configured with:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *    - OPENAI_API_KEY
 */

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../src/types/database';
import type { DocumentType } from '../src/lib/repositories/embeddings';
import {
  extractCompanyContent,
  extractProductContent,
  extractConsumerContent,
  extractTrendContent,
  extractResearchDocContent,
} from '../src/lib/embeddings/contentExtractor';
import { chunkMarkdown } from '../src/lib/embeddings/chunker';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const typeFlag = args.indexOf('--type');
const typeFilter: DocumentType | undefined =
  typeFlag !== -1 ? (args[typeFlag + 1] as DocumentType) : undefined;
const resumeFlag = args.indexOf('--resume');
const resumeFrom = resumeFlag !== -1 ? args[resumeFlag + 1] : undefined;

// Validate environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error(
    'Get it from Supabase Dashboard > Settings > API > service_role key'
  );
  process.exit(1);
}

if (!openaiApiKey && !dryRun) {
  console.error('❌ Missing OPENAI_API_KEY in .env.local');
  console.error('Get it from https://platform.openai.com/api-keys');
  process.exit(1);
}

// Create admin client with service role key (bypasses RLS)
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Lazy-load OpenAI to avoid errors in dry-run mode
let generateEmbeddings: (texts: string[]) => Promise<number[][]>;

async function initOpenAI() {
  if (dryRun) return;

  // Dynamic import to avoid bundling issues
  const { default: OpenAI } = await import('openai');
  const { default: pRetry } = await import('p-retry');
  const { default: pLimit } = await import('p-limit');

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const limit = pLimit(5);

  generateEmbeddings = async (texts: string[]) => {
    if (texts.length === 0) return [];

    const MAX_BATCH_SIZE = 2048;
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      batches.push(texts.slice(i, i + MAX_BATCH_SIZE));
    }

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const embeddings = await limit(() =>
        pRetry(
          async () => {
            const response = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: batch,
              encoding_format: 'float',
            });
            return response.data
              .sort((a, b) => a.index - b.index)
              .map(item => item.embedding);
          },
          { retries: 3, minTimeout: 1000, factor: 2 }
        )
      );
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  };
}

interface DocumentItem {
  type: DocumentType;
  id: string;
  name: string;
  content: string;
}

async function fetchAllDocuments(): Promise<DocumentItem[]> {
  console.log('📚 Fetching documents from database...\n');

  const documents: DocumentItem[] = [];

  // Fetch all entity types (or filter by type)
  const types: DocumentType[] = typeFilter
    ? [typeFilter]
    : ['companies', 'products', 'consumers', 'trends', 'research_docs'];

  for (const type of types) {
    if (type === 'companies') {
      const { data, error } = await supabase.from('companies').select('*');
      if (error) {
        console.error(`❌ Failed to fetch companies: ${error.message}`);
        continue;
      }
      for (const item of data ?? []) {
        documents.push({
          type: 'companies',
          id: item.id,
          name: item.name,
          content: extractCompanyContent(item),
        });
      }
      console.log(`   ✓ ${data?.length ?? 0} companies`);
    }

    if (type === 'products') {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error(`❌ Failed to fetch products: ${error.message}`);
        continue;
      }
      for (const item of data ?? []) {
        documents.push({
          type: 'products',
          id: item.id,
          name: item.name,
          content: extractProductContent(item),
        });
      }
      console.log(`   ✓ ${data?.length ?? 0} products`);
    }

    if (type === 'consumers') {
      const { data, error } = await supabase.from('consumers').select('*');
      if (error) {
        console.error(`❌ Failed to fetch consumers: ${error.message}`);
        continue;
      }
      for (const item of data ?? []) {
        documents.push({
          type: 'consumers',
          id: item.id,
          name: item.segment_name,
          content: extractConsumerContent(item),
        });
      }
      console.log(`   ✓ ${data?.length ?? 0} consumer segments`);
    }

    if (type === 'trends') {
      const { data, error } = await supabase.from('trends').select('*');
      if (error) {
        console.error(`❌ Failed to fetch trends: ${error.message}`);
        continue;
      }
      for (const item of data ?? []) {
        documents.push({
          type: 'trends',
          id: item.id,
          name: item.name,
          content: extractTrendContent(item),
        });
      }
      console.log(`   ✓ ${data?.length ?? 0} trends`);
    }

    if (type === 'research_docs') {
      const { data, error } = await supabase.from('research_docs').select('*');
      if (error) {
        console.error(`❌ Failed to fetch research docs: ${error.message}`);
        continue;
      }
      for (const item of data ?? []) {
        documents.push({
          type: 'research_docs',
          id: item.id,
          name: item.title,
          content: extractResearchDocContent(item),
        });
      }
      console.log(`   ✓ ${data?.length ?? 0} research docs`);
    }
  }

  console.log(`\n📊 Total: ${documents.length} documents\n`);

  return documents;
}

async function processDocument(
  doc: DocumentItem
): Promise<{ success: boolean; chunks: number; error?: string }> {
  try {
    // Chunk the content
    const chunks = chunkMarkdown(doc.content);

    if (chunks.length === 0) {
      return { success: true, chunks: 0 };
    }

    if (dryRun) {
      return { success: true, chunks: chunks.length };
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks.map(c => c.text));

    // Build records for upsert
    const records = chunks.map((chunk, i) => ({
      document_type: doc.type,
      document_id: doc.id,
      chunk_index: chunk.index,
      chunk_text: chunk.text,
      token_count: chunk.tokenCount,
      embedding: JSON.stringify(embeddings[i]), // Supabase expects string for vector
    }));

    // Delete existing embeddings for this document
    // Cast to any to bypass type checking until types are regenerated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteResult = await (supabase as any)
      .from('document_embeddings')
      .delete()
      .eq('document_type', doc.type)
      .eq('document_id', doc.id);

    if (deleteResult.error) {
      throw new Error(`Delete failed: ${deleteResult.error.message}`);
    }

    // Insert new embeddings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertResult = await (supabase as any)
      .from('document_embeddings')
      .insert(records);

    if (insertResult.error) {
      throw new Error(`Insert failed: ${insertResult.error.message}`);
    }

    return { success: true, chunks: chunks.length };
  } catch (error) {
    return {
      success: false,
      chunks: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log('🚀 Embedding Generation Script\n');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  if (typeFilter) {
    console.log(`   Filter: ${typeFilter} only`);
  }
  if (resumeFrom) {
    console.log(`   Resume from: ${resumeFrom}`);
  }
  console.log('');

  // Initialize OpenAI (if not dry run)
  await initOpenAI();

  // Fetch all documents
  const documents = await fetchAllDocuments();

  if (documents.length === 0) {
    console.log('⚠️  No documents found to process');
    return;
  }

  // Apply resume filter if specified
  let startIndex = 0;
  if (resumeFrom) {
    const idx = documents.findIndex(d => d.id === resumeFrom);
    if (idx !== -1) {
      startIndex = idx;
      console.log(`📍 Resuming from document ${startIndex + 1}/${documents.length}\n`);
    }
  }

  // Process documents
  let succeeded = 0;
  let failed = 0;
  let totalChunks = 0;

  for (let i = startIndex; i < documents.length; i++) {
    const doc = documents[i];
    const progress = `[${i + 1}/${documents.length}]`;

    process.stdout.write(
      `\r${progress} Processing ${doc.type}/${doc.name.slice(0, 30).padEnd(30)}...`
    );

    const result = await processDocument(doc);

    if (result.success) {
      succeeded++;
      totalChunks += result.chunks;
    } else {
      failed++;
      console.error(`\n❌ ${doc.type}/${doc.id}: ${result.error}`);
      // Log failed ID for resume capability
      console.error(`   Resume with: --resume ${doc.id}`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`   Documents processed: ${succeeded + failed}`);
  console.log(`   Succeeded: ${succeeded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total chunks: ${totalChunks}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No embeddings were actually generated');
    console.log('   Run without --dry-run to generate embeddings');
  }

  console.log('\n✨ Done!');
}

// Run
main().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});
