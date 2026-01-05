/**
 * Staleness Flow E2E Test - Story 7.3
 *
 * Tests the stale data update workflow:
 * 1. Stale question shows indicator and action buttons
 * 2. Click "Update" button → RecommendationForm opens
 * 3. Save recommendation → stale indicator disappears, toast shows
 * 4. Click "Mark as Current" → stale indicator disappears (no content change), toast shows
 *
 * Uses Supabase service role to create test questions with stale timestamps.
 * Implements test data cleanup to prevent database pollution.
 *
 * NOTE: This test requires SUPABASE_SERVICE_ROLE_KEY environment variable to be set.
 * It will be skipped if the environment variable is not available.
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

// Use serial mode - tests depend on each other
test.describe.configure({ mode: 'serial' });

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
};

// Generate unique test question title
const TEST_QUESTION_TITLE_PREFIX = 'E2E Staleness Test';
const TEST_QUESTION_1 = `${TEST_QUESTION_TITLE_PREFIX} Update ${Date.now()}`;
const TEST_QUESTION_2 = `${TEST_QUESTION_TITLE_PREFIX} MarkCurrent ${Date.now()}`;

// Staleness threshold is 14 days, so we use 20 days ago
const STALE_DATE = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

// Check for required environment variables
const hasSupabaseConfig =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

let mahoContext: BrowserContext;
let kelContext: BrowserContext;
let mahoPage: Page;
let kelPage: Page;
let staleQuestionId1: string;
let staleQuestionId2: string;
let supabase: SupabaseClient | null = null;

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
  profileId: string
): Promise<string> {
  const { data, error } = await client
    .from('questions')
    .insert({
      title,
      description: 'E2E test question for staleness testing',
      category: 'market',
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

// Helper to get Maho's profile ID (using the test user email)
async function getMahoProfileId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('email', 'maho@test.kel-dashboard.local')
    .single();

  if (error) {
    throw new Error(`Failed to get Maho profile: ${error.message}`);
  }

  return data.id;
}

test.beforeAll(async ({ browser }) => {
  // Skip setup if Supabase config is missing
  if (!hasSupabaseConfig || !supabase) {
    console.warn('Skipping staleness tests: missing SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // Create contexts for both users with their auth states
  mahoContext = await browser.newContext({
    storageState: STORAGE_STATE.maho,
  });
  kelContext = await browser.newContext({
    storageState: STORAGE_STATE.kel,
  });

  mahoPage = await mahoContext.newPage();
  kelPage = await kelContext.newPage();

  // Create stale questions using service role
  const mahoId = await getMahoProfileId(supabase);
  staleQuestionId1 = await createStaleQuestion(supabase, TEST_QUESTION_1, mahoId);
  staleQuestionId2 = await createStaleQuestion(supabase, TEST_QUESTION_2, mahoId);

  console.log(`Created stale questions: ${staleQuestionId1}, ${staleQuestionId2}`);
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
      } else {
        console.log(`E2E cleanup: removed ${data?.length ?? 0} test questions`);
      }
    } catch (err) {
      console.error('E2E cleanup error:', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // Close contexts if they were created
  if (mahoContext) await mahoContext.close();
  if (kelContext) await kelContext.close();
});

test.describe('Stale Data Update Flow', () => {
  // Skip all tests in this describe block if Supabase config is missing
  test.skip(!hasSupabaseConfig, 'Skipping: SUPABASE_SERVICE_ROLE_KEY not set');

  test('Stale question shows indicator and action buttons (Maho)', async () => {
    // Navigate to the stale question
    await mahoPage.goto(`/questions/${staleQuestionId1}`);
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Verify question title
    await expect(mahoPage.getByTestId('question-title')).toHaveText(TEST_QUESTION_1);

    // Verify stale data indicator is visible
    await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

    // Verify action buttons are visible
    await expect(mahoPage.getByTestId('update-stale-button')).toBeVisible();
    await expect(mahoPage.getByTestId('mark-current-button')).toBeVisible();
  });

  test('Click "Update" button opens RecommendationForm', async () => {
    // Ensure we're on the question detail page
    if (!mahoPage.url().includes(staleQuestionId1)) {
      await mahoPage.goto(`/questions/${staleQuestionId1}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible();
    }

    // Click Update button
    await mahoPage.getByTestId('update-stale-button').click();

    // Recommendation form should open
    await expect(mahoPage.getByTestId('recommendation-form')).toBeVisible({
      timeout: 5000,
    });
  });

  test('Save recommendation clears stale indicator and shows toast', async () => {
    // Form should still be open from previous test
    await expect(mahoPage.getByTestId('recommendation-form')).toBeVisible();

    // Fill in recommendation
    await mahoPage
      .getByTestId('recommendation-text')
      .fill('Updated recommendation to clear stale indicator');
    await mahoPage
      .getByTestId('recommendation-rationale')
      .fill('Rationale for the updated recommendation');

    // Submit form
    await mahoPage.getByTestId('recommendation-submit').click();

    // Form should close
    await expect(mahoPage.getByTestId('recommendation-form')).not.toBeVisible({
      timeout: 10000,
    });

    // Recommendation display should appear
    await expect(mahoPage.getByTestId('recommendation-display')).toBeVisible();

    // Stale indicator should be gone (updating content refreshes updated_at)
    await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible({
      timeout: 5000,
    });

    // Action buttons should be gone
    await expect(mahoPage.getByTestId('update-stale-button')).not.toBeVisible();
    await expect(mahoPage.getByTestId('mark-current-button')).not.toBeVisible();
  });

  test('Click "Mark as Current" clears stale indicator without content change', async () => {
    // Navigate to the second stale question
    await mahoPage.goto(`/questions/${staleQuestionId2}`);
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Verify stale indicator is visible initially
    await expect(mahoPage.getByTestId('stale-data-indicator')).toBeVisible();

    // Verify there's no recommendation yet
    await expect(mahoPage.getByTestId('add-recommendation-button')).toBeVisible();

    // Click "Mark as Current" button
    await mahoPage.getByTestId('mark-current-button').click();

    // Wait for the mutation to complete (button shows loading state)
    await expect(mahoPage.getByTestId('mark-current-button')).not.toBeVisible({
      timeout: 10000,
    });

    // Stale indicator should be gone
    await expect(mahoPage.getByTestId('stale-data-indicator')).not.toBeVisible();

    // Update button should also be gone
    await expect(mahoPage.getByTestId('update-stale-button')).not.toBeVisible();

    // Verify success toast appears
    await expect(mahoPage.getByText('Data marked as current').first()).toBeVisible({
      timeout: 5000,
    });

    // Verify the "Add Recommendation" button is still there (content unchanged)
    await expect(mahoPage.getByTestId('add-recommendation-button')).toBeVisible();
  });

  test('Kel does not see stale action buttons (view-only)', async () => {
    // Navigate to question 1 (which now has a recommendation from earlier test)
    // The key test here is that Kel never sees the stale action buttons,
    // regardless of whether the question is stale or not
    await kelPage.goto(`/questions/${staleQuestionId1}`);

    // Wait for page to fully load
    await kelPage.waitForLoadState('networkidle');

    await expect(kelPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Kel should see the question (may have recommendation from earlier test)
    await expect(kelPage.getByTestId('question-title')).toHaveText(TEST_QUESTION_1, {
      timeout: 10000,
    });

    // Kel should NOT see stale action buttons (Maho-only feature)
    // These buttons are role-gated and should never appear for Kel
    await expect(kelPage.getByTestId('update-stale-button')).not.toBeVisible();
    await expect(kelPage.getByTestId('mark-current-button')).not.toBeVisible();
  });
});
