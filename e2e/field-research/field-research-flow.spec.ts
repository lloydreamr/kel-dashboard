/**
 * Field Research Flow E2E Tests
 *
 * Story 10-6: E2E Field Research Flow Test
 *
 * Comprehensive tests covering:
 * - Mobile visualization (AC #1)
 * - Offline mode with banner and read-only (AC #2)
 * - Quick capture mode (AC #3)
 * - Service worker integration via offline simulation (AC #4)
 * - Cross-feature integration (mobile + offline + capture)
 *
 * Uses Playwright's context.setOffline() combined with manual event dispatch
 * to properly simulate offline state (Playwright's setOffline only blocks network,
 * doesn't fire browser online/offline events).
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import * as fs from 'fs';

// Auth storage state paths
const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
};

// Viewport configurations for responsive testing
const VIEWPORTS = {
  smallMobile: { width: 360, height: 640 }, // Small Android
  mobile: { width: 375, height: 667 }, // iPhone SE (default for mobile tests)
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 800 }, // Desktop
};

// Test image for quick capture
const TEST_IMAGE_PATH = path.join(__dirname, 'test-photo.jpg');

// Minimal valid JPEG (1x1 red pixel)
const JPEG_DATA = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
  0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
  0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
  0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
  0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
  0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94,
  0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2,
  0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
  0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6,
  0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda,
  0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf3, 0xff, 0xd9,
]);

/**
 * Ensure test image exists - called before tests that need it.
 * Creates idempotently so multiple workers don't conflict.
 *
 * Note: Test image is NOT cleaned up after tests because:
 * 1. Multiple parallel workers may share the file
 * 2. The file is gitignored and small (~220 bytes)
 * 3. Cleaning up between runs risks race conditions
 */
function ensureTestImage(): void {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    fs.writeFileSync(TEST_IMAGE_PATH, JPEG_DATA);
  }
}

/**
 * Simulate going offline by:
 * 1. Blocking network traffic (setOffline)
 * 2. Dispatching 'offline' event (triggers React hooks)
 * 3. Setting navigator.onLine to false
 */
async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('offline'));
  });
}

/**
 * Simulate going back online by:
 * 1. Unblocking network traffic
 * 2. Dispatching 'online' event
 * 3. Setting navigator.onLine to true
 */
async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('online'));
  });
}

/**
 * Helper: Wait for visualization page to load
 * Returns true if chart has data, false if empty state is shown
 */
async function waitForVisualizationPage(page: Page): Promise<boolean> {
  await page.goto('/visualization');
  await Promise.race([
    page.waitForSelector('[data-testid="scatter-chart"]', { timeout: 10000 }).catch(() => null),
    page
      .waitForSelector('[data-testid="visualization-empty-state"]', { timeout: 10000 })
      .catch(() => null),
  ]);
  await page.waitForLoadState('networkidle');
  const chartExists = (await page.locator('[data-testid="scatter-chart"]').count()) > 0;
  return chartExists;
}

// ============================================================================
// TASK 2: Mobile Visualization Tests (AC #1)
// ============================================================================

test.describe('Mobile Visualization Flow (AC #1)', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
    viewport: VIEWPORTS.mobile,
  });

  test('chart container visible on mobile viewport', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment - chart not rendered');

    const chartContainer = page.locator('[data-testid="scatter-chart"]');
    await expect(chartContainer).toBeVisible();
  });

  test('responsive height adjusts on mobile', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment - chart not rendered');

    const chartContainer = page.locator('[data-testid="scatter-chart"]');
    const boundingBox = await chartContainer.boundingBox();

    expect(boundingBox).not.toBeNull();
    // Mobile chart height should be between 280-400px (per useResponsiveChartHeight)
    expect(boundingBox!.height).toBeGreaterThanOrEqual(280);
    expect(boundingBox!.height).toBeLessThanOrEqual(400);
  });

  test('click on chart overlay triggers competitor selection', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    // Find the click overlay (chart doesn't expose individual data points)
    const clickOverlay = page.locator('[data-generic-testid="chart-click-overlay"]');
    const overlayCount = await clickOverlay.count();

    if (overlayCount === 0) {
      test.skip(true, 'No competitors to click');
      return;
    }

    // Click on first overlay button
    const firstOverlay = clickOverlay.first();
    await firstOverlay.click({ force: true });

    // On mobile, bottom sheet should open (not dialog)
    const bottomSheet = page.getByTestId('viz-competitor-modal-mobile');
    await expect(bottomSheet).toBeVisible({ timeout: 5000 });
  });

  test('bottom sheet opens on mobile (not dialog)', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    const overlayButtons = page.locator('[data-generic-testid="chart-click-overlay"]');
    const overlayCount = await overlayButtons.count();

    if (overlayCount === 0) {
      test.skip(true, 'No competitors to tap');
      return;
    }

    await overlayButtons.first().click({ force: true });

    // Mobile should show bottom sheet, NOT the popover
    const bottomSheet = page.getByTestId('viz-competitor-modal-mobile');
    const popover = page.getByTestId('competitor-edit-popover');

    await expect(bottomSheet).toBeVisible();
    await expect(popover).not.toBeVisible();
  });

  test('sheet can be dismissed (swipe or overlay tap)', async ({ page }) => {
    // Note: This test verifies sheet dismissal works, not specifically swipe gesture.
    // Playwright's mouse events don't reliably trigger touch swipe handlers.
    // Real swipe behavior is validated via manual testing on device.
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    const overlayButtons = page.locator('[data-generic-testid="chart-click-overlay"]');
    const overlayCount = await overlayButtons.count();

    if (overlayCount === 0) {
      test.skip(true, 'No competitors to tap');
      return;
    }

    // Open the sheet
    await overlayButtons.first().click({ force: true });
    const sheet = page.getByTestId('viz-competitor-modal-mobile');
    await expect(sheet).toBeVisible();

    // Attempt swipe down gesture (may not work in Playwright)
    const sheetBox = await sheet.boundingBox();
    if (sheetBox) {
      await page.mouse.move(sheetBox.x + sheetBox.width / 2, sheetBox.y + 20);
      await page.mouse.down();
      await page.mouse.move(sheetBox.x + sheetBox.width / 2, sheetBox.y + 200, { steps: 10 });
      await page.mouse.up();
    }

    // Fallback: Use overlay tap if swipe didn't close sheet
    const overlay = page.getByTestId('viz-modal-overlay');
    if (await sheet.isVisible()) {
      await overlay.click({ force: true, position: { x: 10, y: 10 } });
    }

    await expect(sheet).not.toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// TASK 3: Offline Banner & Read-Only Tests (AC #2)
// ============================================================================

test.describe('Offline Banner & Read-Only Mode (AC #2)', () => {
  test.use({ storageState: STORAGE_STATE.maho });

  test('offline banner appears when going offline', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Verify banner is not visible when online
    await expect(page.getByTestId('offline-banner')).not.toBeVisible();

    // Go offline
    await goOffline(page);

    // Banner should appear
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('offline-banner')).toContainText("You're offline");
  });

  test('banner has correct yellow warning styling', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

    // Check banner has yellow background class
    const banner = page.getByTestId('offline-banner');
    await expect(banner).toHaveClass(/bg-yellow-100/);
  });

  test('banner disappears when back online', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Go offline
    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

    // Go back online
    await goOnline(page);

    // Banner should disappear
    await expect(page.getByTestId('offline-banner')).not.toBeVisible({ timeout: 5000 });
  });

  test('data already loaded remains visible while offline', async ({ page }) => {
    // Load the questions page while online
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-card"], [data-testid="questions-empty-state"]', {
      timeout: 5000,
    });

    // Go offline
    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

    // Page should still be visible (no crash, data preserved in memory)
    await expect(page.getByTestId('questions-page')).toBeVisible();
  });
});

// ============================================================================
// TASK 4: Write Protection Tests (AC #2)
// ============================================================================

test.describe('Write Protection When Offline (AC #2)', () => {
  test.use({ storageState: STORAGE_STATE.maho });

  test('create question blocked when offline (toast shows offline message)', async ({
    page,
    isMobile,
  }) => {
    // Skip on mobile due to form submission timing differences
    test.skip(isMobile === true, 'Form submission timing differs on mobile');

    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Go offline
    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

    // Try to create a question
    await page.getByTestId('new-question-button').click();
    await expect(page.getByTestId('question-form')).toBeVisible();

    // Fill form
    await page.getByTestId('question-title-input').fill('Offline Test Question');
    await page.getByTestId('question-category-select').selectOption('market');
    await page.getByTestId('question-submit').click();

    // guardOffline() runs at start of onMutate - should error immediately
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-sonner-toast]')).toContainText('offline', { ignoreCase: true });
  });

  test('form returns visible (not stuck in loading state)', async ({ page, isMobile }) => {
    test.skip(isMobile === true, 'Form submission timing differs on mobile');

    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

    // Try to create a question
    await page.getByTestId('new-question-button').click();
    await page.getByTestId('question-title-input').fill('Offline Test Question 2');
    await page.getByTestId('question-category-select').selectOption('market');
    await page.getByTestId('question-submit').click();

    // Form should return (mutation errored, isPending = false)
    await expect(page.getByTestId('question-form')).toBeVisible({ timeout: 5000 });
  });

  test('operations succeed after going back online', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Go offline then back online
    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });
    await goOnline(page);
    await expect(page.getByTestId('offline-banner')).not.toBeVisible({ timeout: 5000 });

    // Now create a question - should succeed
    const uniqueTitle = `Online Recovery Test ${Date.now()}`;
    await page.getByTestId('new-question-button').click();
    await expect(page.getByTestId('question-form')).toBeVisible();
    await page.getByTestId('question-title-input').fill(uniqueTitle);
    await page.getByTestId('question-category-select').selectOption('market');
    await page.getByTestId('question-submit').click();

    // Should navigate to question detail (success)
    await expect(page.getByTestId('question-detail-page')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// TASK 5: Quick Capture Tests (AC #3)
// ============================================================================

test.describe('Quick Capture Flow (AC #3)', () => {
  test.use({ storageState: STORAGE_STATE.maho });

  test.beforeAll(() => {
    ensureTestImage();
  });

  test('quick capture FAB visible on dashboard pages', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // FAB should be visible
    await expect(page.getByTestId('quick-capture-fab')).toBeVisible();
  });

  test('clicking FAB opens quick capture sheet', async ({ page }) => {
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Click FAB
    await page.getByTestId('quick-capture-fab').click();

    // Sheet should open
    await expect(page.getByTestId('quick-capture-sheet')).toBeVisible({ timeout: 3000 });
  });

  test('file upload via setInputFiles shows preview', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'iphone',
      'FileReader limitation in Playwright mobile Safari'
    );

    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Open sheet
    await page.getByTestId('quick-capture-fab').click();
    await expect(page.getByTestId('quick-capture-sheet')).toBeVisible();

    // Set file
    const cameraInput = page.getByTestId('camera-input');
    await cameraInput.setInputFiles(TEST_IMAGE_PATH);

    // Preview should be visible
    await expect(page.getByTestId('photo-preview')).toBeVisible({ timeout: 3000 });
  });

  test('category selection and note entry work', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'iphone',
      'FileReader limitation in Playwright mobile Safari'
    );

    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Open sheet and add photo
    await page.getByTestId('quick-capture-fab').click();
    await expect(page.getByTestId('quick-capture-sheet')).toBeVisible();

    const cameraInput = page.getByTestId('camera-input');
    await cameraInput.setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByTestId('photo-preview')).toBeVisible();

    // Select category
    const categorySelect = page.getByTestId('quick-capture-category-select');
    await categorySelect.click();
    await page.getByRole('option', { name: 'Market' }).click();

    // Add note
    const noteInput = page.getByTestId('quick-capture-note-input');
    await noteInput.fill('Field research note from E2E test');
    await expect(noteInput).toHaveValue('Field research note from E2E test');
  });

  test('save queues capture when offline (toast shows queued)', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'iphone',
      'FileReader limitation in Playwright mobile Safari'
    );

    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Open sheet and add photo WHILE ONLINE (file loaded into memory)
    await page.getByTestId('quick-capture-fab').click();
    await expect(page.getByTestId('quick-capture-sheet')).toBeVisible();

    const cameraInput = page.getByTestId('camera-input');
    await cameraInput.setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByTestId('photo-preview')).toBeVisible();

    // Select category and add note
    const categorySelect = page.getByTestId('quick-capture-category-select');
    await categorySelect.click();
    await page.getByRole('option', { name: 'Market' }).click();
    await page.getByTestId('quick-capture-note-input').fill('Offline queue test');

    // NOW go offline
    await goOffline(page);

    // Submit
    await page.getByTestId('quick-capture-save').click();

    // Toast should show queued success
    await expect(page.locator('[data-sonner-toast]')).toContainText('queued', { timeout: 3000 });

    // Clean up
    await goOnline(page);
  });

  test('pending badge visible after offline queue', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'iphone',
      'FileReader limitation in Playwright mobile Safari'
    );

    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Open sheet and add photo while online
    await page.getByTestId('quick-capture-fab').click();
    await expect(page.getByTestId('quick-capture-sheet')).toBeVisible();

    const cameraInput = page.getByTestId('camera-input');
    await cameraInput.setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByTestId('photo-preview')).toBeVisible();

    // Category and note
    const categorySelect = page.getByTestId('quick-capture-category-select');
    await categorySelect.click();
    await page.getByRole('option', { name: 'Product' }).click();
    await page.getByTestId('quick-capture-note-input').fill('Pending badge test');

    // Go offline and submit
    await goOffline(page);
    await page.getByTestId('quick-capture-save').click();

    // Sheet should close
    await expect(page.getByTestId('quick-capture-sheet')).not.toBeVisible({ timeout: 3000 });

    // Pending badge should appear
    await expect(page.getByTestId('quick-capture-pending')).toBeVisible({ timeout: 3000 });

    // Clean up
    await goOnline(page);
  });
});

// ============================================================================
// TASK 6: Cross-Feature Integration Test (AC #1-3)
// ============================================================================

test.describe('Cross-Feature Integration Test (AC #1-3)', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
    viewport: VIEWPORTS.mobile,
  });

  test.beforeAll(() => {
    ensureTestImage();
  });

  test('mobile viewport + offline + quick capture combined flow', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'iphone',
      'FileReader limitation in Playwright mobile Safari'
    );

    // Step 1: Navigate to visualization on mobile
    const hasData = await waitForVisualizationPage(page);

    // Even without data, we can test the combined flow
    await expect(
      page.locator('[data-testid="scatter-chart"], [data-testid="visualization-empty-state"]').first()
    ).toBeVisible();

    // Step 2: Go offline
    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

    // Step 3: Open quick capture
    await page.getByTestId('quick-capture-fab').click();
    await expect(page.getByTestId('quick-capture-sheet')).toBeVisible();

    // Step 4: Take photo (via setInputFiles)
    const cameraInput = page.getByTestId('camera-input');
    await cameraInput.setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByTestId('photo-preview')).toBeVisible();

    // Step 5: Add note
    await page.getByTestId('quick-capture-note-input').fill('Field research capture - integrated test');

    // Step 6: Select category
    const categorySelect = page.getByTestId('quick-capture-category-select');
    await categorySelect.click();
    await page.getByRole('option', { name: 'Market' }).click();

    // Step 7: Save (should queue since offline)
    await page.getByTestId('quick-capture-save').click();

    // Step 8: Verify queued
    await expect(page.locator('[data-sonner-toast]')).toContainText('queued', { timeout: 3000 });
    await expect(page.getByTestId('quick-capture-sheet')).not.toBeVisible();

    // Step 9: Go online
    await goOnline(page);

    // Step 10: Verify offline banner disappears (sync may happen)
    await expect(page.getByTestId('offline-banner')).not.toBeVisible({ timeout: 5000 });
  });

  test('complete field research workflow: offline → capture → save → online → verify', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'iphone',
      'FileReader limitation in Playwright mobile Safari'
    );

    // Start on questions page (mobile viewport from test.use)
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Verify mobile viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(VIEWPORTS.mobile.width);

    // Go offline
    await goOffline(page);
    await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

    // Open quick capture
    await page.getByTestId('quick-capture-fab').click();
    await expect(page.getByTestId('quick-capture-sheet')).toBeVisible();

    // Capture photo
    await page.getByTestId('camera-input').setInputFiles(TEST_IMAGE_PATH);
    await expect(page.getByTestId('photo-preview')).toBeVisible();

    // Add metadata
    const categorySelect = page.getByTestId('quick-capture-category-select');
    await categorySelect.click();
    await page.getByRole('option', { name: 'Market' }).click();
    await page.getByTestId('quick-capture-note-input').fill('Complete workflow test');

    // Save (queues offline)
    await page.getByTestId('quick-capture-save').click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('queued', { timeout: 3000 });

    // Pending badge should appear
    await expect(page.getByTestId('quick-capture-pending')).toBeVisible({ timeout: 3000 });

    // Go online
    await goOnline(page);
    await expect(page.getByTestId('offline-banner')).not.toBeVisible({ timeout: 5000 });

    // Pending badge may clear after sync (or stay until next sync cycle)
    // We verify the workflow completed without errors
    await expect(page.getByTestId('questions-page')).toBeVisible();
  });
});
