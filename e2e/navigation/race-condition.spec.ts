/**
 * Navigation Race Condition E2E Tests
 *
 * Story 13.4: BUG-009 - Navigation Race Condition Fix
 *
 * Tests that router.push() in async mutation callbacks doesn't fire
 * after the user has navigated away from the originating page.
 *
 * The fix uses useMountedRef to check if the component is still mounted
 * before executing navigation in onSuccess callbacks.
 *
 * Test scenarios:
 * 1. Create question, navigate away before completion → should NOT redirect back
 * 2. Create question, stay on page → should redirect normally (regression)
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

// Storage state files (created by auth setup)
const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

// Generate unique test identifiers
const TEST_RUN_ID = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// =============================================================================
// BUG-009: Race Condition Tests
// Tests that navigation doesn't fire after user leaves the page
// =============================================================================
test.describe('Navigation Race Condition (BUG-009)', () => {
  let mahoContext: BrowserContext;
  let mahoPage: Page;

  test.beforeAll(async ({ browser }) => {
    mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    mahoPage = await mahoContext.newPage();
  });

  test.afterAll(async () => {
    await mahoContext?.close();
  });

  test('navigating away during question creation prevents redirect back', async () => {
    // Navigate to questions page
    await mahoPage.goto('/questions');
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();

    // Set up route interception to delay the API response
    // This simulates a slow network/server response
    let resolveApiCall: () => void;
    const apiPromise = new Promise<void>((resolve) => {
      resolveApiCall = resolve;
    });

    await mahoPage.route('**/api/**questions**', async (route) => {
      // Only delay POST requests (creation)
      if (route.request().method() === 'POST') {
        // Wait for our signal before continuing
        await apiPromise;
      }
      // Continue with the request
      await route.continue();
    });

    // Click new question button
    await mahoPage.getByTestId('new-question-button').click();

    // Fill question form quickly
    await expect(mahoPage.getByTestId('question-form')).toBeVisible();
    await mahoPage.getByTestId('question-title-input').fill(`Race Condition Test ${TEST_RUN_ID}`);
    await mahoPage.getByTestId('question-category-select').selectOption('market');

    // Submit form (this will be delayed by our route interception)
    await mahoPage.getByTestId('question-submit').click();

    // Immediately navigate away before the API responds
    // This simulates user clicking back/navigating during slow submission
    await mahoPage.goto('/visualization');
    await expect(mahoPage).toHaveURL(/\/visualization/);

    // Now let the API call complete
    resolveApiCall!();

    // Wait a moment for any potential redirect to occur
    await mahoPage.waitForTimeout(500);

    // CRITICAL ASSERTION: User should still be on visualization page
    // BUG-009 would have redirected them to /questions/<id>
    await expect(mahoPage).toHaveURL(/\/visualization/);
    await expect(mahoPage.getByTestId('visualization-page')).toBeVisible();

    // Clean up route interception
    await mahoPage.unroute('**/api/**questions**');
  });

  test('staying on page during creation redirects normally (regression)', async () => {
    // Navigate to questions page
    await mahoPage.goto('/questions');
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();

    // Click new question button
    await mahoPage.getByTestId('new-question-button').click();

    // Fill question form
    await expect(mahoPage.getByTestId('question-form')).toBeVisible();
    await mahoPage.getByTestId('question-title-input').fill(`Regression Test ${TEST_RUN_ID}`);
    await mahoPage.getByTestId('question-description-input').fill('Testing normal redirect behavior');
    await mahoPage.getByTestId('question-category-select').selectOption('market');

    // Submit form and wait on the same page
    await mahoPage.getByTestId('question-submit').click();

    // Should redirect to question detail (normal behavior)
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // URL should be question detail
    await expect(mahoPage).toHaveURL(/\/questions\/[^/]+$/);
  });
});

// =============================================================================
// Pitch Mode Race Condition Test
// Tests enterPitchMode/exitPitchMode navigation guards
// =============================================================================
test.describe('Pitch Mode Navigation Guard (BUG-009)', () => {
  let mahoContext: BrowserContext;
  let mahoPage: Page;

  test.beforeAll(async ({ browser }) => {
    mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    mahoPage = await mahoContext.newPage();
  });

  test.afterAll(async () => {
    await mahoContext?.close();
  });

  test('pitch mode toggle works when staying on page (regression)', async () => {
    // Navigate to visualization
    await mahoPage.goto('/visualization');
    await expect(mahoPage.getByTestId('visualization-page')).toBeVisible();

    // Enter pitch mode
    const enterButton = mahoPage.getByTestId('enter-pitch-mode-button');
    if (await enterButton.isVisible()) {
      await enterButton.click();
      await expect(mahoPage).toHaveURL(/mode=pitch/);
    }

    // Exit pitch mode
    const exitButton = mahoPage.getByTestId('exit-pitch-mode-button');
    if (await exitButton.isVisible()) {
      await exitButton.click();
      await expect(mahoPage).not.toHaveURL(/mode=pitch/);
    }
  });
});
