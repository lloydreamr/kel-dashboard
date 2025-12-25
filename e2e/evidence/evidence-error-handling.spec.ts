/**
 * Evidence Error Handling Test
 *
 * Tests that evidence panel gracefully handles unreachable URLs.
 * The panel should still display evidence metadata even if the URL
 * cannot be reached - we're not fetching content from the URL.
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

// Use serial mode - tests build on each other
test.describe.configure({ mode: 'serial' });

// Test data with unique suffix
const TEST_QUESTION_TITLE = `Error Handling Evidence Test ${Date.now()}`;

test.describe('Evidence Error Handling', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
  });

  let createdQuestionUrl: string;

  test('Setup: Create question for error handling tests', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Create question
    await page.getByTestId('new-question-button').click();
    await page.getByTestId('question-title-input').fill(TEST_QUESTION_TITLE);
    await page.getByTestId('question-category-select').selectOption('market');
    await page.getByTestId('question-submit').click();

    await expect(page.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Save URL for other tests
    createdQuestionUrl = page.url();
  });

  test('Panel displays evidence with invalid/unreachable URL gracefully', async ({ page }) => {
    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Add evidence with unreachable URL
    await page.getByTestId('add-evidence-button').click();
    await page.getByTestId('evidence-title-input').fill('Unreachable Source');
    await page.getByTestId('evidence-url-input').fill('https://this-domain-does-not-exist-12345.com/page');
    await page.getByTestId('evidence-excerpt-input').fill('This URL is intentionally unreachable');
    await page.getByTestId('evidence-submit').click();

    await expect(page.getByTestId('evidence-item')).toBeVisible({
      timeout: 5000,
    });

    // Open panel - should work even though URL is unreachable
    await page.getByTestId('evidence-item').click();
    await expect(page.getByTestId('evidence-panel')).toBeVisible();

    // Panel should show all evidence metadata correctly
    await expect(page.getByTestId('evidence-panel-title')).toHaveText('Unreachable Source');
    await expect(page.getByTestId('evidence-panel-url')).toContainText(
      'this-domain-does-not-exist-12345.com'
    );
    await expect(page.getByTestId('evidence-panel-excerpt')).toContainText(
      'This URL is intentionally unreachable'
    );

    // Open Source button should still be visible (will open in new tab, user handles error)
    await expect(page.getByTestId('evidence-panel-open-source')).toBeVisible();

    // Close panel
    await page.keyboard.press('Escape');
  });

  test('Favicon gracefully handles missing/failed image', async ({ page }) => {
    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Add evidence with a domain that likely has no favicon
    await page.getByTestId('add-evidence-button').click();
    await page.getByTestId('evidence-title-input').fill('No Favicon Source');
    await page.getByTestId('evidence-url-input').fill('https://no-favicon-test-domain-12345.local/doc');
    await page.getByTestId('evidence-excerpt-input').fill('Testing favicon fallback behavior');
    await page.getByTestId('evidence-submit').click();

    // Get the last evidence item (most recently added)
    const evidenceItem = page.getByTestId('evidence-item').last();
    await expect(evidenceItem).toBeVisible({
      timeout: 5000,
    });

    // The title should be visible within the last evidence item
    await expect(page.getByTestId('evidence-title').last()).toHaveText('No Favicon Source');

    // The domain should still display correctly
    await expect(page.getByTestId('evidence-domain').last()).toContainText(
      'no-favicon-test-domain-12345.local'
    );

    // Open panel - should also handle missing favicon gracefully
    await evidenceItem.click();
    await expect(page.getByTestId('evidence-panel')).toBeVisible();
    await expect(page.getByTestId('evidence-panel-title')).toHaveText('No Favicon Source');
  });

  test('Evidence with special characters in URL is handled correctly', async ({ page }) => {
    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Add evidence with special characters in URL
    const specialUrl = 'https://example.com/path?query=test&param=value#section';
    await page.getByTestId('add-evidence-button').click();
    await page.getByTestId('evidence-title-input').fill('URL with Special Characters');
    await page.getByTestId('evidence-url-input').fill(specialUrl);
    await page.getByTestId('evidence-submit').click();

    // Get the last evidence item (most recently added)
    const evidenceItem = page.getByTestId('evidence-item').last();
    await expect(evidenceItem).toBeVisible({
      timeout: 5000,
    });

    await expect(page.getByTestId('evidence-title').last()).toContainText('URL with Special Characters');

    // Open panel
    await evidenceItem.click();
    await expect(page.getByTestId('evidence-panel')).toBeVisible();

    // URL should display correctly with special characters
    await expect(page.getByTestId('evidence-panel-url')).toContainText(
      'query=test&param=value'
    );
  });

  test('Long title and excerpt are handled without breaking layout', async ({ page }) => {
    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Add evidence with long (but valid) title and excerpt
    // Title max: 200 chars, Excerpt max: 500 chars
    const longTitle = 'This is a fairly long title that tests how the UI handles lengthy text content that needs truncation or wrapping for proper display';
    const longExcerpt = 'This is a longer excerpt that contains more text to test how the UI handles it. The excerpt field can contain up to 500 characters which is quite a lot of text for displaying evidence context.';

    await page.getByTestId('add-evidence-button').click();
    await page.getByTestId('evidence-title-input').fill(longTitle);
    await page.getByTestId('evidence-url-input').fill('https://example.com/long-content');
    await page.getByTestId('evidence-excerpt-input').fill(longExcerpt);
    await page.getByTestId('evidence-submit').click();

    // Evidence should still be visible without breaking
    await expect(page.getByTestId('evidence-list')).toBeVisible();

    // Get last evidence item
    const lastItem = page.getByTestId('evidence-item').last();
    await expect(lastItem).toBeVisible();

    // Open panel - should display without breaking
    await lastItem.click();
    await expect(page.getByTestId('evidence-panel')).toBeVisible();

    // Content should be visible (may be truncated but shouldn't break)
    await expect(page.getByTestId('evidence-panel-title')).toBeVisible();
    await expect(page.getByTestId('evidence-panel-excerpt')).toBeVisible();
  });
});
