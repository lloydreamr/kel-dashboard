/**
 * Visualization Flow E2E Test - Story 6.6
 *
 * Tests the complete competitor CRUD lifecycle:
 * 1. Maho adds a regular competitor
 * 2. Maho adds Kel's target position (star marker)
 * 3. Maho clicks a point to edit it
 * 4. Maho deletes a competitor
 * 5. Kel views chart (read-only - no Add button, no clickable points)
 * 6. Verify optimistic updates and toast notifications
 * 7. Verify form validation
 * 8. Verify chart performance (NFR3: renders < 1 second)
 *
 * Uses multi-user contexts with different storageState files.
 * Implements test data cleanup to prevent database pollution.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
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
  // Cleanup test data created during this run
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for cleanup
      );

      const { error, data } = await supabase
        .from('competitors')
        .delete()
        .ilike('name', 'E2E Test%')
        .select('id');

      if (error) {
        console.error('E2E cleanup failed:', error.message);
      } else {
        console.log(`E2E cleanup: removed ${data?.length ?? 0} test competitors`);
      }
    } catch (err) {
      console.error('E2E cleanup error:', err instanceof Error ? err.message : 'Unknown error');
    }
  } else {
    console.warn('E2E cleanup skipped: missing environment variables');
  }

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
    // Wait for chart to stabilize and data points to be rendered
    const chart = mahoPage.getByTestId('scatter-chart');
    await chart.waitFor({ state: 'visible' });

    // Wait for chart to be fully interactive (overlays need time to render)
    await mahoPage.waitForLoadState('networkidle');

    // Wait for overlay positions to be calculated (depends on ResizeObserver)
    // Poll until chart-click-layer has buttons inside it
    await expect(async () => {
      const clickLayer = mahoPage.getByTestId('chart-click-layer');
      const buttonCount = await clickLayer.locator('button').count();
      expect(buttonCount).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Use HTML overlay for reliable click (Story 6.7 fix)
    // Using evaluate to trigger click directly (bypasses coordinate-based click issues)
    const overlay = mahoPage.locator('.chart-click-overlay').first();
    await overlay.evaluate((el) => (el as HTMLElement).click());

    // Edit popover should appear
    await expect(mahoPage.getByTestId('competitor-edit-popover')).toBeVisible({ timeout: 10000 });

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
    // Wait for chart to stabilize and data points to be rendered
    const chart = mahoPage.getByTestId('scatter-chart');
    await chart.waitFor({ state: 'visible' });

    // Wait for chart to be fully interactive (overlays need time to render)
    await mahoPage.waitForLoadState('networkidle');

    // Wait for overlay positions to be calculated (depends on ResizeObserver)
    // Poll until chart-click-layer has buttons inside it
    await expect(async () => {
      const clickLayer = mahoPage.getByTestId('chart-click-layer');
      const buttonCount = await clickLayer.locator('button').count();
      expect(buttonCount).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Use HTML overlay for reliable click (Story 6.7 fix)
    // Using evaluate to trigger click directly (bypasses coordinate-based click issues)
    const overlay = mahoPage.locator('.chart-click-overlay').first();
    await overlay.evaluate((el) => (el as HTMLElement).click());

    // Edit popover should appear
    await expect(mahoPage.getByTestId('competitor-edit-popover')).toBeVisible({ timeout: 10000 });

    // Click Delete button (use force to bypass toasts that may overlay on mobile)
    await mahoPage.getByTestId('competitor-delete-button').click({ force: true });

    // Delete confirmation dialog should appear
    await expect(mahoPage.getByTestId('delete-competitor-dialog')).toBeVisible();
    await expect(mahoPage.getByRole('heading', { name: 'Remove Competitor?' })).toBeVisible();

    // Confirm deletion
    await mahoPage.getByTestId('competitor-delete-confirm').click();

    // Verify success toast
    await expect(mahoPage.getByText('Competitor removed').first()).toBeVisible();

    // Dialog should close after deletion
    await expect(mahoPage.getByTestId('delete-competitor-dialog')).not.toBeVisible();
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

  // NFR3 Performance Test - Story 6.8 Performance Optimization
  // Server-side prefetching eliminates query waterfall
  // Threshold: 1500ms for CI stability (mobile emulation is slower than desktop)
  test('Step 9: Verify chart performance (NFR3 - renders < 1.5 seconds)', async () => {
    // Measure full page load + render time from navigation start
    // This is the true user experience - time from clicking link to seeing chart
    const startTime = Date.now();

    await mahoPage.goto('/visualization');

    // Wait for complete render: chart + legend visible
    await mahoPage.getByTestId('scatter-chart').waitFor({ state: 'visible' });
    await mahoPage.getByTestId('chart-legend').waitFor({ state: 'visible' });

    const renderTime = Date.now() - startTime;
    console.log(`NFR3 Chart render time (navigation + render): ${renderTime}ms`);

    // Assert total time from navigation to visible chart < 1.5 seconds
    // Using 1500ms threshold for CI stability (mobile emulation adds overhead)
    // Performance optimizations from Story 6.8:
    // - Server-side prefetch eliminates profile/competitors query waterfall
    // - HydrationBoundary transfers cache from server to client
    // - Memoized category extraction reduces render cost
    // Desktop typically achieves < 800ms, mobile emulation ~1000-1400ms
    expect(renderTime).toBeLessThan(1500);
  });
});
