/**
 * Evidence Flow E2E Test
 *
 * Tests the complete evidence lifecycle:
 * 1. Maho adds evidence to a question
 * 2. Verify evidence count updates
 * 3. Click evidence to open panel
 * 4. Verify panel content
 * 5. Dismiss panel
 * 6. Edit evidence
 * 7. Verify edit saved
 * 8. Remove evidence
 * 9. Verify count decrements
 * 10. Verify Kel cannot edit/remove (role-based)
 *
 * Uses multi-user contexts with different storageState files.
 *
 * Timeout strategy:
 * - 3000ms: UI animations (panel dismiss, dialog close)
 * - 5000ms: Form submissions with network (create, edit, delete)
 * - 10000ms: Page navigation and initial load
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

// Use serial mode - tests depend on each other
test.describe.configure({ mode: 'serial' });

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
};

// Generate unique test data
const TEST_QUESTION_TITLE = `Evidence E2E Test Question ${Date.now()}`;
const TEST_EVIDENCE = {
  title: 'PSA Market Research Report',
  url: 'https://psa.gov.ph/statistics/test-report',
  anchor: '#pricing',
  excerpt: 'This report shows market pricing trends in the Philippines',
};
const UPDATED_EVIDENCE = {
  title: 'PSA Market Research Report (Updated)',
  excerpt: 'Updated excerpt with new pricing data from Q4',
};

let mahoContext: BrowserContext;
let kelContext: BrowserContext;
let mahoPage: Page;
let kelPage: Page;
let createdQuestionId: string;

test.beforeAll(async ({ browser }) => {
  mahoContext = await browser.newContext({ storageState: STORAGE_STATE.maho });
  kelContext = await browser.newContext({ storageState: STORAGE_STATE.kel });
  mahoPage = await mahoContext.newPage();
  kelPage = await kelContext.newPage();
});

test.afterAll(async () => {
  await mahoContext.close();
  await kelContext.close();
});

test.describe('Evidence Flow', () => {
  test('Setup: Maho creates a question for evidence testing', async () => {
    // Navigate to questions page
    await mahoPage.goto('/questions');
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();

    // Click new question button
    await mahoPage.getByTestId('new-question-button').click();

    // Fill question form
    await expect(mahoPage.getByTestId('question-form')).toBeVisible();
    await mahoPage.getByTestId('question-title-input').fill(TEST_QUESTION_TITLE);
    await mahoPage.getByTestId('question-category-select').selectOption('market');

    // Submit form
    await mahoPage.getByTestId('question-submit').click();

    // Wait for detail page
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Capture question ID
    const url = mahoPage.url();
    const match = url.match(/\/questions\/([^/]+)/);
    createdQuestionId = match?.[1] ?? '';
    expect(createdQuestionId).toBeTruthy();

    // Verify evidence count badge shows 0 initially
    await expect(mahoPage.getByTestId('evidence-count-badge')).toContainText('0');
  });

  test('Maho adds evidence and count updates', async () => {
    // Click add evidence button
    await mahoPage.getByTestId('add-evidence-button').click();

    // Fill evidence form
    await expect(mahoPage.getByTestId('evidence-form')).toBeVisible();
    await mahoPage.getByTestId('evidence-title-input').fill(TEST_EVIDENCE.title);
    await mahoPage.getByTestId('evidence-url-input').fill(TEST_EVIDENCE.url);
    await mahoPage.getByTestId('evidence-anchor-input').fill(TEST_EVIDENCE.anchor);
    await mahoPage.getByTestId('evidence-excerpt-input').fill(TEST_EVIDENCE.excerpt);

    // Submit
    await mahoPage.getByTestId('evidence-submit').click();

    // Verify form closes and evidence appears in list
    await expect(mahoPage.getByTestId('evidence-form')).not.toBeVisible({
      timeout: 5000,
    });
    await expect(mahoPage.getByTestId('evidence-list')).toBeVisible();
    await expect(mahoPage.getByTestId('evidence-item')).toBeVisible();

    // Verify count updated to 1
    await expect(mahoPage.getByTestId('evidence-count-badge')).toContainText('1');

    // Verify evidence content
    await expect(mahoPage.getByTestId('evidence-title')).toHaveText(TEST_EVIDENCE.title);
  });

  test('Click evidence opens panel with correct content', async () => {
    // Click the evidence item
    await mahoPage.getByTestId('evidence-item').click();

    // Panel should open (allow more time on mobile)
    await expect(mahoPage.getByTestId('evidence-panel')).toBeVisible({
      timeout: 10000,
    });

    // Verify panel content
    await expect(mahoPage.getByTestId('evidence-panel-title')).toHaveText(
      TEST_EVIDENCE.title
    );
    await expect(mahoPage.getByTestId('evidence-panel-domain')).toContainText(
      'psa.gov.ph'
    );
    await expect(mahoPage.getByTestId('evidence-panel-url')).toContainText(
      TEST_EVIDENCE.url
    );
    await expect(mahoPage.getByTestId('evidence-panel-excerpt')).toContainText(
      TEST_EVIDENCE.excerpt
    );

    // Verify Open Source button exists
    await expect(mahoPage.getByTestId('evidence-panel-open-source')).toBeVisible();
  });

  test('Dismiss panel by pressing Escape', async () => {
    // Panel should currently be open
    await expect(mahoPage.getByTestId('evidence-panel')).toBeVisible();

    // Press Escape to close
    await mahoPage.keyboard.press('Escape');

    // Panel should close
    await expect(mahoPage.getByTestId('evidence-panel')).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('Maho edits evidence and changes are saved', async () => {
    // Click edit button (action button on item)
    await mahoPage.getByTestId('evidence-item').hover();
    await mahoPage.getByTestId('evidence-edit-button').click();

    // Edit form should appear with pre-filled values
    await expect(mahoPage.getByTestId('evidence-edit-form')).toBeVisible();
    await expect(mahoPage.getByTestId('evidence-edit-title-input')).toHaveValue(
      TEST_EVIDENCE.title
    );

    // Update title
    await mahoPage.getByTestId('evidence-edit-title-input').clear();
    await mahoPage.getByTestId('evidence-edit-title-input').fill(UPDATED_EVIDENCE.title);

    // Update excerpt
    await mahoPage.getByTestId('evidence-edit-excerpt-input').clear();
    await mahoPage.getByTestId('evidence-edit-excerpt-input').fill(UPDATED_EVIDENCE.excerpt);

    // Save changes
    await mahoPage.getByTestId('evidence-edit-submit').click();

    // Form should close
    await expect(mahoPage.getByTestId('evidence-edit-form')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify changes are reflected in list
    await expect(mahoPage.getByTestId('evidence-title')).toHaveText(
      UPDATED_EVIDENCE.title
    );
  });

  test('Verify edited content shows in panel', async () => {
    // Open panel again
    await mahoPage.getByTestId('evidence-item').click();
    await expect(mahoPage.getByTestId('evidence-panel')).toBeVisible();

    // Verify updated content
    await expect(mahoPage.getByTestId('evidence-panel-title')).toHaveText(
      UPDATED_EVIDENCE.title
    );
    await expect(mahoPage.getByTestId('evidence-panel-excerpt')).toContainText(
      UPDATED_EVIDENCE.excerpt
    );

    // Close panel
    await mahoPage.keyboard.press('Escape');
    await expect(mahoPage.getByTestId('evidence-panel')).not.toBeVisible();
  });

  test('Maho removes evidence with confirmation', async () => {
    // Click remove button
    await mahoPage.getByTestId('evidence-item').hover();
    await mahoPage.getByTestId('evidence-remove-button').click();

    // Confirmation dialog should appear
    await expect(mahoPage.getByTestId('evidence-remove-dialog')).toBeVisible();

    // Confirm removal
    await mahoPage.getByTestId('evidence-remove-confirm').click();

    // Dialog should close
    await expect(mahoPage.getByTestId('evidence-remove-dialog')).not.toBeVisible({
      timeout: 3000,
    });

    // Evidence should be removed
    await expect(mahoPage.getByTestId('evidence-item')).not.toBeVisible({
      timeout: 5000,
    });

    // Count should decrement to 0
    await expect(mahoPage.getByTestId('evidence-count-badge')).toContainText('0');

    // Empty state should show
    await expect(mahoPage.getByTestId('evidence-empty-state')).toBeVisible();
  });

  test('Kel cannot see edit/remove buttons on evidence', async () => {
    // First, Maho adds evidence again for Kel to view
    await mahoPage.getByTestId('add-evidence-button').click();
    await mahoPage.getByTestId('evidence-title-input').fill('Kel View Test Evidence');
    await mahoPage.getByTestId('evidence-url-input').fill('https://example.com/test');
    await mahoPage.getByTestId('evidence-submit').click();
    await expect(mahoPage.getByTestId('evidence-item')).toBeVisible();

    // Kel navigates to the question
    await kelPage.goto(`/questions/${createdQuestionId}`);
    await expect(kelPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Kel should see the evidence item
    await expect(kelPage.getByTestId('evidence-item')).toBeVisible();

    // Kel should NOT see edit/remove buttons (even on hover)
    await kelPage.getByTestId('evidence-item').hover();
    await expect(kelPage.getByTestId('evidence-edit-button')).not.toBeVisible();
    await expect(kelPage.getByTestId('evidence-remove-button')).not.toBeVisible();

    // But Kel CAN click to open the panel
    await kelPage.getByTestId('evidence-item').click();
    await expect(kelPage.getByTestId('evidence-panel')).toBeVisible();
    await kelPage.keyboard.press('Escape');
  });
});
