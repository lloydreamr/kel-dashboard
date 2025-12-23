/**
 * Question Creation Flow E2E Test
 *
 * Tests the complete question lifecycle from creation through archive/restore:
 * 1. Maho creates a question
 * 2. Maho adds recommendation
 * 3. Maho sends to Kel
 * 4. Kel views question
 * 5. Maho sees "Kel viewed" indicator
 * 6. Maho archives question
 * 7. Maho views archived questions
 * 8. Maho restores question
 *
 * Uses multi-user contexts with different storageState files.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

// Use serial mode - tests depend on each other
test.describe.configure({ mode: 'serial' });

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
};

// Generate unique test question title to avoid collisions
const TEST_QUESTION_TITLE = `E2E Test Question ${Date.now()}`;

let mahoContext: BrowserContext;
let kelContext: BrowserContext;
let mahoPage: Page;
let kelPage: Page;
let createdQuestionId: string;

test.beforeAll(async ({ browser }) => {
  // Create contexts for both users with their auth states
  mahoContext = await browser.newContext({
    storageState: STORAGE_STATE.maho,
  });
  kelContext = await browser.newContext({
    storageState: STORAGE_STATE.kel,
  });

  mahoPage = await mahoContext.newPage();
  kelPage = await kelContext.newPage();
});

test.afterAll(async () => {
  await mahoContext.close();
  await kelContext.close();
});

test.describe('Question Creation Flow', () => {
  test('Maho creates a new question', async () => {
    // Navigate to questions page
    await mahoPage.goto('/questions');
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();

    // Click new question button
    await mahoPage.getByTestId('new-question-button').click();

    // Fill question form
    await expect(mahoPage.getByTestId('question-form')).toBeVisible();
    await mahoPage.getByTestId('question-title-input').fill(TEST_QUESTION_TITLE);
    await mahoPage
      .getByTestId('question-description-input')
      .fill('This is an E2E test question for testing the full flow');

    // Select market category
    await mahoPage.getByTestId('question-category-select').selectOption('market');

    // Submit form
    await mahoPage.getByTestId('question-submit').click();

    // Should redirect to question detail
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });
    await expect(mahoPage.getByTestId('question-title')).toHaveText(TEST_QUESTION_TITLE);

    // Capture question ID from URL for later tests
    const url = mahoPage.url();
    const match = url.match(/\/questions\/([^/]+)/);
    createdQuestionId = match?.[1] ?? '';
    expect(createdQuestionId).toBeTruthy();
  });

  test('Maho adds recommendation to question', async () => {
    // Ensure we're on the question detail page
    if (!mahoPage.url().includes(createdQuestionId)) {
      await mahoPage.goto(`/questions/${createdQuestionId}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible();
    }

    // Click add recommendation button
    await mahoPage.getByTestId('add-recommendation-button').click();

    // Fill recommendation form
    await expect(mahoPage.getByTestId('recommendation-form')).toBeVisible();
    await mahoPage
      .getByTestId('recommendation-text')
      .fill('Recommended approach for E2E test: proceed with market validation');
    await mahoPage
      .getByTestId('recommendation-rationale')
      .fill('This rationale explains why we recommend this approach');

    // Submit recommendation
    await mahoPage.getByTestId('recommendation-submit').click();

    // Should show recommendation display (form disappears, display appears)
    await expect(mahoPage.getByTestId('recommendation-display')).toBeVisible({
      timeout: 10000,
    });
    await expect(mahoPage.getByTestId('recommendation-form')).not.toBeVisible();
  });

  test('Maho sends question to Kel', async () => {
    // Ensure we're on the question detail page
    if (!mahoPage.url().includes(createdQuestionId)) {
      await mahoPage.goto(`/questions/${createdQuestionId}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible();
    }

    // Click send to Kel button
    await mahoPage.getByTestId('send-to-kel-button').click();

    // Confirm in dialog
    await expect(mahoPage.getByTestId('send-to-kel-confirm-dialog')).toBeVisible();
    await mahoPage.getByRole('button', { name: /send/i }).click();

    // Dialog should close and status should update
    await expect(mahoPage.getByTestId('send-to-kel-confirm-dialog')).not.toBeVisible();

    // Send to Kel button should no longer be visible (question is no longer draft)
    await expect(mahoPage.getByTestId('send-to-kel-button')).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('Kel views question', async () => {
    // Navigate to question detail as Kel
    await kelPage.goto(`/questions/${createdQuestionId}`);

    // Should see question detail
    await expect(kelPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });
    await expect(kelPage.getByTestId('question-title')).toHaveText(TEST_QUESTION_TITLE);

    // Kel should see the recommendation
    await expect(kelPage.getByTestId('recommendation-display')).toBeVisible();
  });

  test('Maho sees Kel viewed indicator', async () => {
    // Refresh Maho's page to see the updated indicator
    await mahoPage.reload();
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible();

    // Should show Kel viewed indicator
    await expect(mahoPage.getByTestId('kel-viewed-indicator')).toBeVisible({
      timeout: 10000,
    });
  });

  test('Maho archives question', async () => {
    // Ensure we're on the question detail page
    if (!mahoPage.url().includes(createdQuestionId)) {
      await mahoPage.goto(`/questions/${createdQuestionId}`);
      await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible();
    }

    // Click archive button
    await mahoPage.getByTestId('archive-button').click();

    // Confirm in dialog
    await expect(mahoPage.getByTestId('archive-confirm-dialog')).toBeVisible();
    await mahoPage.getByRole('button', { name: /archive/i }).click();

    // Should redirect to questions list
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible({
      timeout: 10000,
    });

    // Question should not be in active list
    await expect(mahoPage.getByText(TEST_QUESTION_TITLE)).not.toBeVisible();
  });

  test('Maho views archived questions and finds the question', async () => {
    // Click view archived button
    await mahoPage.getByTestId('view-archived-button').click();

    // Should see archived questions list (or empty state if this is the only one)
    const archivedList = mahoPage.getByTestId('archived-questions-list');
    const emptyState = mahoPage.getByTestId('archived-questions-empty');

    // Wait for either the list or empty state to appear
    await expect(archivedList.or(emptyState)).toBeVisible({ timeout: 5000 });

    // Archived question should be visible
    await expect(mahoPage.getByText(TEST_QUESTION_TITLE)).toBeVisible();
  });

  test('Maho restores question', async () => {
    // Find the restore button for our question
    // Since there could be multiple archived questions, find the right one
    const questionRow = mahoPage.locator('[data-testid="archived-questions-list"]').locator('div', {
      has: mahoPage.getByText(TEST_QUESTION_TITLE),
    });

    // Click restore button within that question's row
    await questionRow.getByTestId('restore-button').click();

    // Wait for restore to complete - the question should disappear from archived list
    await expect(mahoPage.getByText(TEST_QUESTION_TITLE)).not.toBeVisible({ timeout: 5000 });

    // Navigate back to active questions
    await mahoPage.getByTestId('view-archived-button').click();

    // Should be back on active questions page
    await expect(mahoPage.getByTestId('questions-list').or(mahoPage.getByTestId('questions-empty-state'))).toBeVisible();

    // Question should be back in active list
    await expect(mahoPage.getByText(TEST_QUESTION_TITLE)).toBeVisible({ timeout: 5000 });
  });
});
