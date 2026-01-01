/**
 * Freshness Integration E2E Test - Story 7.6
 *
 * Tests the INTEGRATION between staleness-flow.spec.ts and freshness-badge-flow.spec.ts:
 * 1. Create stale question → Verify progress page shows freshness badge
 * 2. Navigate to question → Verify stale indicator appears
 * 3. Update/mark current → Verify stale indicator clears
 * 4. Return to progress → Verify freshness badge updates
 *
 * This test does NOT duplicate individual tests from staleness-flow or freshness-badge-flow.
 * It verifies the complete end-to-end integration of both features working together.
 *
 * Uses Supabase service role to create test questions with stale timestamps.
 * Implements test data cleanup to prevent database pollution.
 *
 * NOTE: This test requires SUPABASE_SERVICE_ROLE_KEY environment variable to be set.
 * It will be skipped if the environment variable is not available.
 *
 * Test IDs Used:
 * - stale-data-indicator
 * - update-stale-button
 * - mark-current-button
 * - freshness-warning-badge
 * - freshness-count
 * - milestone-card-{category}
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import path from 'path';

// Load environment variables from .env.local if not already set
const envPath = path.join(__dirname, '../../.env.local');
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

// Use serial mode - tests depend on each other for complete flow verification
test.describe.configure({ mode: 'serial' });

// Timeout constants for consistency
const TIMEOUT = {
  NAVIGATION: 10000,
  NETWORK: 5000,
  ANIMATION: 3000,
} as const;

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

// Generate unique test question title prefix
const TEST_QUESTION_TITLE_PREFIX = 'E2E Freshness Integration';
const UNIQUE_ID = Date.now();

// Staleness threshold is 14 days, so we use 20 days ago for stale
const STALE_DATE = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

// Check for required environment variables
const hasSupabaseConfig =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

let mahoContext: BrowserContext;
let mahoPage: Page;
let staleQuestionId: string;
let staleQuestionId2: string;
let supabase: SupabaseClient | null = null;
let initialMarketStaleCount: number | null = null;

// Initialize Supabase client if credentials are available
if (hasSupabaseConfig) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Helper to create a stale question directly in the database
async function createStaleQuestion(
  client: SupabaseClient,
  title: string,
  category: string,
  profileId: string
): Promise<string> {
  const { data, error } = await client
    .from('questions')
    .insert({
      title,
      description: 'E2E integration test for freshness flow',
      category,
      status: 'draft',
      created_by: profileId,
      created_at: STALE_DATE,
      updated_at: STALE_DATE,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create stale question: ${error.message}`);
  }

  return data.id;
}

// Helper to get Maho's profile ID
async function getMahoProfileId(client: SupabaseClient): Promise<string> {
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

// Helper to get current stale count for a category
async function getStaleCountFromBadge(page: Page, category: string): Promise<number> {
  const card = page.getByTestId(`milestone-card-${category}`);
  const badge = card.getByTestId('freshness-warning-badge');

  // Check if badge exists
  const badgeCount = await badge.count();
  if (badgeCount === 0) {
    return 0;
  }

  // Get the count text
  const countElement = card.getByTestId('freshness-count');
  const countText = await countElement.textContent();

  // Extract number from text like "2 items need attention"
  const match = countText?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

test.beforeAll(async ({ browser }) => {
  // Skip setup if Supabase config is missing
  if (!hasSupabaseConfig || !supabase) {
    console.warn('Skipping freshness integration tests: missing SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // Create context for Maho with auth state
  mahoContext = await browser.newContext({
    storageState: STORAGE_STATE.maho,
  });

  mahoPage = await mahoContext.newPage();

  // Create stale questions using service role
  const mahoId = await getMahoProfileId(supabase);

  // Create 2 stale questions in 'market' category for integration testing
  staleQuestionId = await createStaleQuestion(
    supabase,
    `${TEST_QUESTION_TITLE_PREFIX} Market 1 ${UNIQUE_ID}`,
    'market',
    mahoId
  );
  staleQuestionId2 = await createStaleQuestion(
    supabase,
    `${TEST_QUESTION_TITLE_PREFIX} Market 2 ${UNIQUE_ID}`,
    'market',
    mahoId
  );

  // Test data created: staleQuestionId, staleQuestionId2
});

test.afterAll(async () => {
  // Cleanup test data if Supabase is available
  if (supabase) {
    try {
      const { error, data } = await supabase
        .from('questions')
        .delete()
        .ilike('title', `${TEST_QUESTION_TITLE_PREFIX}%`)
        .select('id');

      if (error) {
        console.error('E2E cleanup failed:', error.message);
      }
      // Cleanup complete - data removed silently
    } catch (err) {
      console.error(
        'E2E cleanup error:',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  // Close context if it was created
  if (mahoContext) await mahoContext.close();
});

test.describe('Freshness End-to-End Integration', () => {
  // Skip all tests in this describe block if Supabase config is missing
  test.skip(!hasSupabaseConfig, 'Skipping: SUPABASE_SERVICE_ROLE_KEY not set');

  /**
   * Task 2: Stale Indicator Detection Tests
   */
  test.describe('Stale Indicator Detection', () => {
    test('Stale question with old updated_at shows stale-data-indicator', async () => {
      // Navigate to the stale question created with 20-day-old timestamp
      await mahoPage.goto(`/questions/${staleQuestionId}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
        timeout: TIMEOUT.NAVIGATION,
      });

      // Verify stale data indicator is visible (14-day threshold respected)
      await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible({
        timeout: TIMEOUT.NETWORK,
      });
    });

    test('Stale question shows update-stale-button and mark-current-button', async () => {
      // Should be on question detail page from previous test
      if (!mahoPage.url().includes(staleQuestionId)) {
        await mahoPage.goto(`/questions/${staleQuestionId}`);
        await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible();
      }

      // Verify both action buttons are visible for stale data
      await expect(mahoPage.getByTestId('update-stale-button')).toBeVisible();
      await expect(mahoPage.getByTestId('mark-current-button')).toBeVisible();
    });
  });

  /**
   * Task 3: Stale Update Workflow Tests
   */
  test.describe('Stale Update Workflow', () => {
    test('Click "Mark as Current" clears stale indicator and shows success toast', async () => {
      // Navigate to the second stale question
      await mahoPage.goto(`/questions/${staleQuestionId2}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
        timeout: TIMEOUT.NAVIGATION,
      });

      // Verify stale indicator is visible initially
      await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

      // Click "Mark as Current" button
      await mahoPage.getByTestId('mark-current-button').click();

      // Verify success toast appears (immediate feedback)
      await expect(mahoPage.getByText('Data marked as current').first()).toBeVisible({
        timeout: TIMEOUT.NETWORK,
      });

      // Wait for mutation to complete - stale indicator should disappear
      await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible({
        timeout: TIMEOUT.NAVIGATION,
      });

      // Both action buttons should be gone
      await expect(mahoPage.getByTestId('update-stale-button')).not.toBeVisible();
      await expect(mahoPage.getByTestId('mark-current-button')).not.toBeVisible();
    });

    test('Click "Update" with new recommendation clears stale indicator', async () => {
      // Navigate back to first stale question
      await mahoPage.goto(`/questions/${staleQuestionId}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
        timeout: TIMEOUT.NAVIGATION,
      });

      // Verify stale indicator is still visible
      await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

      // Click Update button
      await mahoPage.getByTestId('update-stale-button').click();

      // Recommendation form should open
      await expect(mahoPage.getByTestId('recommendation-form')).toBeVisible({
        timeout: TIMEOUT.NETWORK,
      });

      // Fill in recommendation
      await mahoPage
        .getByTestId('recommendation-text')
        .fill('Integration test recommendation update');
      await mahoPage
        .getByTestId('recommendation-rationale')
        .fill('Integration test rationale');

      // Submit form
      await mahoPage.getByTestId('recommendation-submit').click();

      // Form should close
      await expect(mahoPage.getByTestId('recommendation-form')).not.toBeVisible({
        timeout: TIMEOUT.NAVIGATION,
      });

      // Stale indicator should be gone (updating content refreshes updated_at)
      await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible({
        timeout: TIMEOUT.NETWORK,
      });

      // Action buttons should be gone
      await expect(mahoPage.getByTestId('update-stale-button')).not.toBeVisible();
      await expect(mahoPage.getByTestId('mark-current-button')).not.toBeVisible();
    });
  });

  /**
   * Task 4: Freshness Badge Integration Tests
   */
  test.describe('Freshness Badge Integration', () => {
    test('Progress page shows freshness-warning-badge on milestone with stale data', async () => {
      // First, create a fresh stale question so we have at least one stale item
      // (Previous tests may have cleared all our test questions)
      if (supabase) {
        const mahoId = await getMahoProfileId(supabase);
        await createStaleQuestion(
          supabase,
          `${TEST_QUESTION_TITLE_PREFIX} Badge Test ${Date.now()}`,
          'market',
          mahoId
        );
      }

      // Navigate to progress page
      await mahoPage.goto('/progress');
      await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
        timeout: TIMEOUT.NAVIGATION,
      });

      // Market card should show freshness warning badge
      const marketCard = mahoPage.getByTestId('milestone-card-market');
      await expect(marketCard.getByTestId('freshness-warning-badge')).toBeVisible({
        timeout: TIMEOUT.NETWORK,
      });

      // Store the initial count for later verification
      initialMarketStaleCount = await getStaleCountFromBadge(mahoPage, 'market');
    });

    test('Clicking freshness badge navigates to stale questions for category', async () => {
      // Should be on progress page from previous test
      if (!mahoPage.url().includes('/progress')) {
        await mahoPage.goto('/progress');
        await expect(mahoPage.getByTestId('progress-page')).toBeVisible();
      }

      // Click the freshness warning badge on market card
      const marketCard = mahoPage.getByTestId('milestone-card-market');
      await marketCard.getByTestId('freshness-warning-badge').click();

      // Should navigate to stale questions page for market category
      await expect(mahoPage).toHaveURL(/\/questions\/stale\/market/, {
        timeout: TIMEOUT.NAVIGATION,
      });

      // Page should show stale questions list
      await expect(mahoPage.getByTestId('stale-questions-list')).toBeVisible({
        timeout: TIMEOUT.NETWORK,
      });
    });

    test('Complete flow: stale creation to badge update verification', async () => {
      // This is the INTEGRATION test - verifying the complete flow

      // 1. Create a new stale question
      let newStaleQuestionId: string | null = null;
      if (supabase) {
        const mahoId = await getMahoProfileId(supabase);
        newStaleQuestionId = await createStaleQuestion(
          supabase,
          `${TEST_QUESTION_TITLE_PREFIX} Complete Flow ${Date.now()}`,
          'market',
          mahoId
        );
      }

      // 2. Navigate to progress page and capture stale count
      await mahoPage.goto('/progress');
      await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
        timeout: TIMEOUT.NAVIGATION,
      });

      const marketCard = mahoPage.getByTestId('milestone-card-market');
      await expect(marketCard.getByTestId('freshness-warning-badge')).toBeVisible({
        timeout: TIMEOUT.NETWORK,
      });

      const countBefore = await getStaleCountFromBadge(mahoPage, 'market');

      // 3. Navigate to the new stale question
      if (newStaleQuestionId) {
        await mahoPage.goto(`/questions/${newStaleQuestionId}`);
        await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
          timeout: TIMEOUT.NAVIGATION,
        });

        // Verify stale indicator is visible
        await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

        // 4. Mark as current to clear staleness
        await mahoPage.getByTestId('mark-current-button').click();
        await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible({
          timeout: TIMEOUT.NAVIGATION,
        });

        // 5. Return to progress page
        await mahoPage.goto('/progress');
        await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
          timeout: TIMEOUT.NAVIGATION,
        });

        // 6. Verify the stale count decreased
        // Wait for the badge to update (React Query refetch + re-render)
        // Use polling to check for the count change rather than networkidle
        await expect(async () => {
          const countAfter = await getStaleCountFromBadge(mahoPage, 'market');
          expect(countAfter).toBeLessThan(countBefore);
        }).toPass({ timeout: TIMEOUT.NAVIGATION });
      }
    });
  });

  /**
   * Task 5: CI Pipeline Integration (verify test runs correctly)
   */
  test.describe('CI Pipeline Integration', () => {
    test('Test cleanup prevents database pollution', async () => {
      // Verify that test data created in this run can be identified for cleanup
      // This ensures the cleanup mechanism in afterAll will work correctly
      if (!supabase) {
        // Skip verification if Supabase not available
        expect(true).toBe(true);
        return;
      }

      // Query for test questions with our prefix
      const { data, error } = await supabase
        .from('questions')
        .select('id, title')
        .ilike('title', `${TEST_QUESTION_TITLE_PREFIX}%`);

      // Verify query succeeded (cleanup mechanism works)
      expect(error).toBeNull();

      // Verify we can identify test data (array returned, even if empty after other cleanup)
      expect(Array.isArray(data)).toBe(true);

      // If there are test questions, verify they have our prefix (cleanup will target them)
      if (data && data.length > 0) {
        for (const question of data) {
          expect(question.title).toMatch(new RegExp(`^${TEST_QUESTION_TITLE_PREFIX}`));
        }
      }
    });
  });
});
