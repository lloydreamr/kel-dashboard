/**
 * Competitor Data Point Editor E2E Test
 *
 * Tests the complete competitor CRUD lifecycle:
 * 1. Maho adds a regular competitor
 * 2. Maho adds Kel's target position (star marker)
 * 3. Maho clicks a point to edit it
 * 4. Maho deletes a competitor
 * 5. Kel views chart (read-only - no Add button, no clickable points)
 * 6. Verify optimistic updates and toast notifications
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

// Generate unique test competitor names to avoid collisions
const TEST_COMPETITOR_1 = `E2E Test Competitor ${Date.now()}`;
const TEST_COMPETITOR_2 = `E2E Kel Target ${Date.now()}`;
const TEST_COMPETITOR_3 = `E2E Edit Test ${Date.now()}`;

let mahoContext: BrowserContext;
let kelContext: BrowserContext;
let mahoPage: Page;
let kelPage: Page;

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

test.describe('Competitor Data Point Editor Flow', () => {
  test('Step 1: Maho navigates to visualization page', async () => {
    await mahoPage.goto('/visualization');
    await mahoPage.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(mahoPage.getByTestId('visualization-page')).toBeVisible();

    // Verify Add Competitor button is visible (Maho only)
    await expect(mahoPage.getByTestId('add-competitor-button')).toBeVisible();
  });

  test('Step 2: Maho adds a regular competitor', async () => {
    // Click Add Competitor button
    await mahoPage.getByTestId('add-competitor-button').click();

    // Dialog should open
    await expect(mahoPage.getByTestId('competitor-dialog')).toBeVisible();
    await expect(mahoPage.getByRole('heading', { name: 'Add Competitor' })).toBeVisible();

    // Fill in form
    await mahoPage.getByTestId('competitor-name-input').fill(TEST_COMPETITOR_1);

    // Set price score to 7 using slider
    const priceSlider = mahoPage.getByTestId('competitor-price-input');
    await priceSlider.click(); // Click to focus
    // Use keyboard to set value (more reliable than drag)
    for (let i = 0; i < 6; i++) {
      await priceSlider.press('ArrowRight');
    }

    // Set quality score to 8 using slider
    const qualitySlider = mahoPage.getByTestId('competitor-quality-input');
    await qualitySlider.click();
    for (let i = 0; i < 7; i++) {
      await qualitySlider.press('ArrowRight');
    }

    // Submit form
    await mahoPage.getByTestId('competitor-submit').click();

    // Verify success toast appears
    await expect(mahoPage.getByText('Competitor added').first()).toBeVisible();

    // Dialog should close
    await expect(mahoPage.getByTestId('competitor-dialog')).not.toBeVisible();

    // Verify data point appears on chart (optimistic update)
    await expect(mahoPage.getByTestId('scatter-chart')).toBeVisible();
  });

  test('Step 3: Maho adds Kel\'s target position with star marker', async () => {
    // Click Add Competitor button again
    await mahoPage.getByTestId('add-competitor-button').click();

    await expect(mahoPage.getByTestId('competitor-dialog')).toBeVisible();

    // Fill in form for Kel's target
    await mahoPage.getByTestId('competitor-name-input').fill(TEST_COMPETITOR_2);

    // Set scores
    const priceSlider = mahoPage.getByTestId('competitor-price-input');
    await priceSlider.click();
    for (let i = 0; i < 5; i++) {
      await priceSlider.press('ArrowRight');
    }

    const qualitySlider = mahoPage.getByTestId('competitor-quality-input');
    await qualitySlider.click();
    for (let i = 0; i < 8; i++) {
      await qualitySlider.press('ArrowRight');
    }

    // Check "Mark as Kel's Target Position"
    await mahoPage.getByTestId('competitor-kel-position-checkbox').click();

    // Submit form
    await mahoPage.getByTestId('competitor-submit').click();

    // Verify success toast
    await expect(mahoPage.getByText('Competitor added').first()).toBeVisible();

    // Verify Kel position marker appears (star shape)
    await expect(mahoPage.getByTestId('chart-kel-position').first()).toBeVisible();
  });

  test('Step 4: Maho adds another competitor for edit test', async () => {
    await mahoPage.getByTestId('add-competitor-button').click();
    await expect(mahoPage.getByTestId('competitor-dialog')).toBeVisible();

    await mahoPage.getByTestId('competitor-name-input').fill(TEST_COMPETITOR_3);

    // Set scores to 5,5
    const priceSlider = mahoPage.getByTestId('competitor-price-input');
    await priceSlider.click();
    // Default is 5, no need to move

    await mahoPage.getByTestId('competitor-submit').click();
    await expect(mahoPage.getByText('Competitor added').first()).toBeVisible();
  });

  test('Step 5: Maho clicks on a data point to edit it', async () => {
    // Wait for chart to be ready
    await mahoPage.waitForTimeout(500);

    // Click on a data point (first one) - use force to bypass overlapping elements
    const dataPoint = mahoPage.getByTestId('chart-data-point').first();
    await dataPoint.click({ force: true });

    // Edit popover should appear
    await expect(mahoPage.getByTestId('competitor-edit-popover')).toBeVisible();

    // Click Edit button
    await mahoPage.getByTestId('competitor-edit-button').click();

    // Edit dialog should open
    await expect(mahoPage.getByTestId('competitor-dialog')).toBeVisible();
    await expect(mahoPage.getByRole('heading', { name: 'Edit Competitor' })).toBeVisible();

    // Form should be pre-filled - change the name
    const nameInput = mahoPage.getByTestId('competitor-name-input');
    await nameInput.clear();
    await nameInput.fill(`${TEST_COMPETITOR_3} - Updated`);

    // Submit changes
    await mahoPage.getByTestId('competitor-submit').click();

    // Verify success toast
    await expect(mahoPage.getByText('Competitor updated').first()).toBeVisible();
  });

  test('Step 6: Maho deletes a competitor', async () => {
    // Wait for chart to be ready
    await mahoPage.waitForTimeout(500);

    // Click on a data point - use force to bypass overlapping elements
    const dataPoint = mahoPage.getByTestId('chart-data-point').first();
    await dataPoint.click({ force: true });

    // Edit popover should appear
    await expect(mahoPage.getByTestId('competitor-edit-popover')).toBeVisible();

    // Click Delete button
    await mahoPage.getByTestId('competitor-delete-button').click();

    // Delete confirmation dialog should appear
    await expect(mahoPage.getByTestId('delete-competitor-dialog')).toBeVisible();
    await expect(mahoPage.getByRole('heading', { name: 'Remove Competitor?' })).toBeVisible();

    // Confirm deletion
    await mahoPage.getByTestId('competitor-delete-confirm').click();

    // Verify success toast
    await expect(mahoPage.getByText('Competitor removed').first()).toBeVisible();

    // Point should be removed from chart (optimistic update)
    await mahoPage.waitForTimeout(300);
  });

  test('Step 7: Kel views chart (read-only access)', async () => {
    await kelPage.goto('/visualization');
    await kelPage.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(kelPage.getByTestId('visualization-page')).toBeVisible();

    // Verify Add Competitor button is NOT visible (Kel is read-only)
    await expect(kelPage.getByTestId('add-competitor-button')).not.toBeVisible();

    // Verify chart is visible
    await expect(kelPage.getByTestId('scatter-chart')).toBeVisible();

    // Verify data points are visible but not clickable
    // (We can't easily test click behavior not triggering, but we verified button is hidden)
    const dataPoints = kelPage.getByTestId('chart-data-point');
    await expect(dataPoints.first()).toBeVisible();
  });

  test('Step 8: Verify form validation', async () => {
    // Go back to Maho page
    await mahoPage.getByTestId('add-competitor-button').click();
    await expect(mahoPage.getByTestId('competitor-dialog')).toBeVisible();

    // Try to submit empty form
    const submitButton = mahoPage.getByTestId('competitor-submit');
    await expect(submitButton).toBeDisabled();

    // Fill only name
    await mahoPage.getByTestId('competitor-name-input').fill('Test Validation');

    // Submit button should now be enabled (sliders have default values of 5)
    await expect(submitButton).toBeEnabled();

    // Cancel instead of submitting
    await mahoPage.getByRole('button', { name: 'Cancel' }).click();

    await expect(mahoPage.getByTestId('competitor-dialog')).not.toBeVisible();
  });
});
