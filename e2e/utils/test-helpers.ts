/**
 * E2E Test Helpers
 *
 * Shared utilities for E2E tests to improve isolation and reduce duplication.
 * Provides consistent test data creation, cleanup, and environment setup.
 *
 * @see Epic 7 Retrospective: "E2E test isolation matters"
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import path from 'path';

// ============================================================================
// Environment Setup
// ============================================================================

/**
 * Load environment variables from .env.local if not already set.
 * Call this at module level in test files.
 */
export function loadEnvFromFile(baseDir: string): void {
  const envPath = path.join(baseDir, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

/**
 * Check if Supabase config is available for E2E tests.
 */
export function hasSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Create a Supabase client with service role for test data management.
 * Returns null if config is not available.
 */
export function createServiceClient(): SupabaseClient | null {
  if (!hasSupabaseConfig()) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================================
// Auth State Paths
// ============================================================================

/**
 * Get storage state paths for authenticated users.
 */
export function getStorageStatePaths(baseDir: string) {
  return {
    maho: path.join(baseDir, '.auth/maho.json'),
    kel: path.join(baseDir, '.auth/kel.json'),
  };
}

// ============================================================================
// Profile Helpers
// ============================================================================

/**
 * Get Maho's profile ID from the database.
 */
export async function getMahoProfileId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('role', 'maho')
    .single();

  if (error) {
    throw new Error(`Failed to get Maho profile: ${error.message}`);
  }

  return data.id;
}

/**
 * Get Kel's profile ID from the database.
 */
export async function getKelProfileId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('role', 'kel')
    .single();

  if (error) {
    throw new Error(`Failed to get Kel profile: ${error.message}`);
  }

  return data.id;
}

// ============================================================================
// Test Data Factories
// ============================================================================

/** Default staleness: 20 days ago (threshold is 14 days) */
const DEFAULT_STALE_DAYS = 20;

/**
 * Create a stale question directly in the database.
 * Returns the question ID for use in tests.
 */
export async function createStaleQuestion(
  client: SupabaseClient,
  options: {
    title: string;
    category?: 'market' | 'product' | 'distribution';
    profileId: string;
    staleDays?: number;
    description?: string;
  }
): Promise<string> {
  const staleDays = options.staleDays ?? DEFAULT_STALE_DAYS;
  const staleDate = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('questions')
    .insert({
      title: options.title,
      description: options.description ?? 'E2E test question',
      category: options.category ?? 'market',
      status: 'draft',
      created_by: options.profileId,
      created_at: staleDate,
      updated_at: staleDate,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create stale question: ${error.message}`);
  }

  return data.id;
}

/**
 * Create a fresh question (not stale) in the database.
 */
export async function createFreshQuestion(
  client: SupabaseClient,
  options: {
    title: string;
    category?: 'market' | 'product' | 'distribution';
    profileId: string;
    description?: string;
  }
): Promise<string> {
  const now = new Date().toISOString();

  const { data, error } = await client
    .from('questions')
    .insert({
      title: options.title,
      description: options.description ?? 'E2E test question',
      category: options.category ?? 'market',
      status: 'draft',
      created_by: options.profileId,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create question: ${error.message}`);
  }

  return data.id;
}

/**
 * Create a competitor data point in the database.
 */
export async function createCompetitor(
  client: SupabaseClient,
  options: {
    name: string;
    priceScore?: number;
    qualityScore?: number;
    category?: string;
    isKelPosition?: boolean;
    profileId: string;
  }
): Promise<string> {
  const { data, error } = await client
    .from('competitor_data')
    .insert({
      name: options.name,
      price_score: options.priceScore ?? 5,
      quality_score: options.qualityScore ?? 5,
      category: options.category ?? 'chips',
      is_kel_position: options.isKelPosition ?? false,
      created_by: options.profileId,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create competitor: ${error.message}`);
  }

  return data.id;
}

// ============================================================================
// Test Data Cleanup
// ============================================================================

/**
 * Clean up test questions by title prefix.
 * Use a unique prefix per test file to avoid conflicts.
 */
export async function cleanupQuestionsByPrefix(
  client: SupabaseClient,
  titlePrefix: string
): Promise<number> {
  const { data, error } = await client
    .from('questions')
    .delete()
    .ilike('title', `${titlePrefix}%`)
    .select('id');

  if (error) {
    console.error(`E2E cleanup failed: ${error.message}`);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * Clean up test competitors by name prefix.
 */
export async function cleanupCompetitorsByPrefix(
  client: SupabaseClient,
  namePrefix: string
): Promise<number> {
  const { data, error } = await client
    .from('competitor_data')
    .delete()
    .ilike('name', `${namePrefix}%`)
    .select('id');

  if (error) {
    console.error(`E2E cleanup failed: ${error.message}`);
    return 0;
  }

  return data?.length ?? 0;
}

// ============================================================================
// Test Isolation Helpers
// ============================================================================

/**
 * Generate a unique test ID for this test run.
 * Use this to create unique test data that won't collide with parallel runs.
 */
export function generateTestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Create a unique test prefix for data isolation.
 * Format: "E2E {testName} {uniqueId}"
 */
export function createTestPrefix(testName: string): string {
  return `E2E ${testName} ${generateTestId()}`;
}

// ============================================================================
// Timeout Constants
// ============================================================================

/**
 * Standard timeouts for E2E tests.
 * Use these instead of magic numbers for consistency.
 */
export const TIMEOUTS = {
  /** Page navigation and initial load */
  NAVIGATION: 10000,
  /** Network requests (API calls) */
  NETWORK: 5000,
  /** UI animations and transitions */
  ANIMATION: 3000,
  /** Short waits for immediate feedback */
  SHORT: 1000,
} as const;
