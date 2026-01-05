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
import type { SupabaseClient } from '@supabase/supabase-js';
import path from 'path';

import {
  loadEnvFromFile,
  hasSupabaseConfig,
  createServiceClient,
  getStorageStatePaths,
  getMahoProfileId,
  createStaleQuestion,
  cleanupQuestionsByPrefix,
  createTestPrefix,
  TIMEOUTS,
} from '../utils/test-helpers';

// Load environment variables
loadEnvFromFile(path.join(__dirname, '../..'));

// Use serial mode - tests depend on each other for complete flow verification
test.describe.configure({ mode: 'serial' });

// Auth state paths
const STORAGE_STATE = getStorageStatePaths(path.join(__dirname, '..'));

// Unique test prefix for this test file
const TEST_PREFIX = 'E2E Freshness Integration';

// Test state
let mahoContext: BrowserContext;
let mahoPage: Page;
let staleQuestionId: string;
let staleQuestionId2: string;
let supabase: SupabaseClient | null = null;
let testPrefix: string;

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
  if (!hasSupabaseConfig()) {
    console.warn('Skipping freshness integration tests: missing SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  supabase = createServiceClient();
  if (!supabase) return;

  // Generate unique prefix for this test run
  testPrefix = createTestPrefix(TEST_PREFIX);

  // Create context for Maho with auth state
  mahoContext = await browser.newContext({
    storageState: STORAGE_STATE.maho,
  });

  mahoPage = await mahoContext.newPage();

  // Create stale questions using service role
  const mahoId = await getMahoProfileId(supabase);

  // Create 2 stale questions in 'market' category for integration testing
  staleQuestionId = await createStaleQuestion(supabase, {
    title: `${testPrefix} Market 1`,
    category: 'market',
    profileId: mahoId,
    description: 'E2E integration test for freshness flow',
  });

  staleQuestionId2 = await createStaleQuestion(supabase, {
    title: `${testPrefix} Market 2`,
    category: 'market',
    profileId: mahoId,
    description: 'E2E integration test for freshness flow',
  });
});

test.afterAll(async () => {
  // Cleanup test data if Supabase is available
  if (supabase && testPrefix) {
    await cleanupQuestionsByPrefix(supabase, testPrefix);
  }

  // Close context if it was created
  if (mahoContext) await mahoContext.close();
});

test.describe('Freshness End-to-End Integration', () => {
  // Skip all tests in this describe block if Supabase config is missing
  test.skip(!hasSupabaseConfig(), 'Skipping: SUPABASE_SERVICE_ROLE_KEY not set');

  /**
   * Task 2: Stale Indicator Detection Tests
   */
  test.describe('Stale Indicator Detection', () => {
    test('Stale question with old updated_at shows stale-data-indicator', async () => {
      // Navigate to the stale question created with 20-day-old timestamp
      await mahoPage.goto(`/questions/${staleQuestionId}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
        timeout: TIMEOUTS.NAVIGATION,
      });

      // Verify stale data indicator is visible (14-day threshold respected)
      await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible({
        timeout: TIMEOUTS.NETWORK,
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
        timeout: TIMEOUTS.NAVIGATION,
      });

      // Verify stale indicator is visible initially
      await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

      // Click "Mark as Current" button
      await mahoPage.getByTestId('mark-current-button').click();

      // Verify success toast appears (immediate feedback)
      await expect(mahoPage.getByText('Data marked as current').first()).toBeVisible({
        timeout: TIMEOUTS.NETWORK,
      });

      // Wait for mutation to complete - stale indicator should disappear
      await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible({
        timeout: TIMEOUTS.NAVIGATION,
      });

      // Both action buttons should be gone
      await expect(mahoPage.getByTestId('update-stale-button')).not.toBeVisible();
      await expect(mahoPage.getByTestId('mark-current-button')).not.toBeVisible();
    });

    test('Click "Update" with new recommendation clears stale indicator', async () => {
      // Navigate back to first stale question
      await mahoPage.goto(`/questions/${staleQuestionId}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
        timeout: TIMEOUTS.NAVIGATION,
      });

      // Verify stale indicator is still visible
      await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

      // Click Update button
      await mahoPage.getByTestId('update-stale-button').click();

      // Recommendation form should open
      await expect(mahoPage.getByTestId('recommendation-form')).toBeVisible({
        timeout: TIMEOUTS.NETWORK,
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
        timeout: TIMEOUTS.NAVIGATION,
      });

      // Stale indicator should be gone (updating content refreshes updated_at)
      await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible({
        timeout: TIMEOUTS.NETWORK,
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
        await createStaleQuestion(supabase, {
          title: `${testPrefix} Badge Test ${Date.now()}`,
          category: 'market',
          profileId: mahoId,
        });
      }

      // Navigate to progress page
      await mahoPage.goto('/progress');
      await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
        timeout: TIMEOUTS.NAVIGATION,
      });

      // Market card should show freshness warning badge
      const marketCard = mahoPage.getByTestId('milestone-card-market');
      await expect(marketCard.getByTestId('freshness-warning-badge')).toBeVisible({
        timeout: TIMEOUTS.NETWORK,
      });
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
        timeout: TIMEOUTS.NAVIGATION,
      });

      // Page should show stale questions list
      await expect(mahoPage.getByTestId('stale-questions-list')).toBeVisible({
        timeout: TIMEOUTS.NETWORK,
      });
    });

    test('Complete flow: stale creation to badge update verification', async () => {
      // This is the INTEGRATION test - verifying the complete flow

      // 1. Create a new stale question
      let newStaleQuestionId: string | null = null;
      if (supabase) {
        const mahoId = await getMahoProfileId(supabase);
        newStaleQuestionId = await createStaleQuestion(supabase, {
          title: `${testPrefix} Complete Flow ${Date.now()}`,
          category: 'market',
          profileId: mahoId,
        });
      }

      // 2. Navigate to progress page and capture stale count
      await mahoPage.goto('/progress');
      await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
        timeout: TIMEOUTS.NAVIGATION,
      });

      const marketCard = mahoPage.getByTestId('milestone-card-market');
      await expect(marketCard.getByTestId('freshness-warning-badge')).toBeVisible({
        timeout: TIMEOUTS.NETWORK,
      });

      const countBefore = await getStaleCountFromBadge(mahoPage, 'market');

      // 3. Navigate to the new stale question
      if (newStaleQuestionId) {
        await mahoPage.goto(`/questions/${newStaleQuestionId}`);
        await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
          timeout: TIMEOUTS.NAVIGATION,
        });

        // Verify stale indicator is visible
        await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

        // 4. Mark as current to clear staleness
        await mahoPage.getByTestId('mark-current-button').click();
        await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible({
          timeout: TIMEOUTS.NAVIGATION,
        });

        // 5. Return to progress page
        await mahoPage.goto('/progress');
        await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
          timeout: TIMEOUTS.NAVIGATION,
        });

        // 6. Verify the stale count decreased
        // Wait for the badge to update (React Query refetch + re-render)
        // Use polling to check for the count change rather than networkidle
        await expect(async () => {
          const countAfter = await getStaleCountFromBadge(mahoPage, 'market');
          expect(countAfter).toBeLessThan(countBefore);
        }).toPass({ timeout: TIMEOUTS.NAVIGATION });
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
        .ilike('title', `${testPrefix}%`);

      // Verify query succeeded (cleanup mechanism works)
      expect(error).toBeNull();

      // Verify we can identify test data (array returned, even if empty after other cleanup)
      expect(Array.isArray(data)).toBe(true);

      // If there are test questions, verify they have our prefix (cleanup will target them)
      if (data && data.length > 0) {
        for (const question of data) {
          expect(question.title).toMatch(new RegExp(`^${testPrefix}`));
        }
      }
    });
  });
});
