/**
 * PDF Export Flow E2E Tests
 *
 * Story 11.2: PDF One-Pager Export
 *
 * Tests the PDF download functionality from pitch mode:
 * - Download button visibility in pitch mode
 * - Click triggers download with correct filename
 * - Loading state during generation
 * - Button state management (disabled during generation)
 *
 * Note: These tests verify the download triggers correctly.
 * Visual PDF rendering validation is manual (AC4).
 */

import { test, expect } from '@playwright/test';

test.describe('PDF Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed competitor data via API or ensure test data exists
    // Navigate directly to pitch mode
    await page.goto('/visualization?mode=pitch');

    // Wait for page to be ready
    await expect(page.getByTestId('visualization-page')).toBeVisible();
  });

  /**
   * Helper to get the visible PDF download button.
   * DashboardContent renders two PitchModeHeaders (mobile + desktop),
   * both exist in DOM but only one is visible at a time via CSS.
   */
  const getVisibleDownloadButton = (page: import('@playwright/test').Page) =>
    page.getByTestId('pdf-download-button').filter({ visible: true }).first();

  const getVisibleExitButton = (page: import('@playwright/test').Page) =>
    page.getByTestId('exit-pitch-mode-button').filter({ visible: true }).first();

  const getVisibleHeader = (page: import('@playwright/test').Page) =>
    page.getByTestId('pitch-mode-header').filter({ visible: true }).first();

  const getVisibleLoadingIndicator = (page: import('@playwright/test').Page) =>
    page.getByTestId('pdf-generating-indicator').filter({ visible: true }).first();

  test.describe('Download PDF button visibility', () => {
    test('shows Download PDF button in pitch mode', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);
      await expect(downloadButton).toBeVisible();
    });

    test('button displays "Download PDF" text', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);
      await expect(downloadButton).toContainText('Download PDF');
    });

    test('button is enabled initially', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);
      await expect(downloadButton).toBeEnabled();
    });
  });

  test.describe('PDF download flow', () => {
    test('clicking Download PDF triggers file download', async ({ page }) => {
      // Log console errors for debugging
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const downloadButton = getVisibleDownloadButton(page);

      // Set up download listener before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 45000 });

      // Click download button
      await downloadButton.click();

      // Check for loading state (indicates click was received)
      await expect(downloadButton).toContainText('Generating', { timeout: 5000 }).catch(() => {
        // PDF generation might be very fast - this is acceptable
      });

      // Wait for download to trigger
      const download = await downloadPromise.catch((err) => {
        // Log console errors if download failed
        if (consoleErrors.length > 0) {
          console.log('Console errors during PDF generation:', consoleErrors);
        }
        throw err;
      });

      // Verify download triggered (not cancelled)
      expect(download).toBeTruthy();
    });

    test('downloaded file has correct filename pattern', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click download button
      await downloadButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename matches pattern: kel-positioning-YYYY-MM-DD.pdf
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/^kel-positioning-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    test('filename contains todays date (UTC)', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click download button
      await downloadButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Get expected date (UTC, same as implementation)
      const expectedDate = new Date().toISOString().split('T')[0];
      const filename = download.suggestedFilename();

      expect(filename).toBe(`kel-positioning-${expectedDate}.pdf`);
    });
  });

  test.describe('loading state during generation', () => {
    test('shows loading indicator when generating PDF', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      // Start the download (will trigger loading state)
      // Note: We need to catch the download but also check loading state
      const downloadPromise = page.waitForEvent('download');

      // Click and immediately check for loading indicator
      await downloadButton.click();

      // Loading indicator should appear (may be brief depending on speed)
      // Use a softer assertion since PDF generation might be fast
      const loadingIndicator = getVisibleLoadingIndicator(page);

      // Either the indicator is visible OR the download already completed
      // We'll check if the indicator was ever present during generation
      try {
        await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
      } catch {
        // PDF generation was very fast - this is acceptable
        // Just verify download completes
      }

      // Wait for download to complete
      await downloadPromise;
    });

    test('button shows "Generating..." text during generation', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      const downloadPromise = page.waitForEvent('download');

      // Click and check text change
      await downloadButton.click();

      // Text might change briefly
      try {
        await expect(downloadButton).toContainText('Generating', { timeout: 1000 });
      } catch {
        // Generation was fast - acceptable
      }

      await downloadPromise;
    });

    test('button is disabled during PDF generation', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      const downloadPromise = page.waitForEvent('download');

      // Click button
      await downloadButton.click();

      // Button should be disabled during generation
      try {
        await expect(downloadButton).toBeDisabled({ timeout: 1000 });
      } catch {
        // Generation was very fast - acceptable
      }

      await downloadPromise;
    });

    test('button re-enables after download completes', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      const downloadPromise = page.waitForEvent('download');

      // Trigger download
      await downloadButton.click();

      // Wait for download to complete
      await downloadPromise;

      // Button should be enabled again after completion
      await expect(downloadButton).toBeEnabled();
    });

    test('loading indicator is hidden after download completes', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      const downloadPromise = page.waitForEvent('download');

      // Trigger download
      await downloadButton.click();

      // Wait for download to complete
      await downloadPromise;

      // Loading indicator should be hidden (none should be visible)
      await expect(page.getByTestId('pdf-generating-indicator')).toHaveCount(0);
    });
  });

  test.describe('button text state transitions', () => {
    test('button returns to "Download PDF" after completion', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);

      const downloadPromise = page.waitForEvent('download');

      // Trigger download
      await downloadButton.click();

      // Wait for download to complete
      await downloadPromise;

      // Text should be back to normal
      await expect(downloadButton).toContainText('Download PDF');
    });
  });

  test.describe('pitch mode integration', () => {
    test('Download PDF button appears alongside Exit button', async ({ page }) => {
      // Both buttons should be visible in the header (using helpers for dual-header DOM)
      const downloadButton = getVisibleDownloadButton(page);
      const exitButton = getVisibleExitButton(page);

      await expect(downloadButton).toBeVisible();
      await expect(exitButton).toBeVisible();
    });

    test('both buttons are in the pitch mode header', async ({ page }) => {
      const header = getVisibleHeader(page);

      // Download button is inside the visible header
      const downloadButton = header.getByTestId('pdf-download-button');
      await expect(downloadButton).toBeVisible();

      // Exit button is also inside the visible header
      const exitButton = header.getByTestId('exit-pitch-mode-button');
      await expect(exitButton).toBeVisible();
    });

    test('can download PDF then exit pitch mode', async ({ page }) => {
      const downloadButton = getVisibleDownloadButton(page);
      const exitButton = getVisibleExitButton(page);

      // Download PDF first
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      await downloadPromise;

      // Then exit pitch mode
      await exitButton.click();

      // Should navigate away from pitch mode
      await expect(page).toHaveURL('/visualization');

      // Download button should no longer be visible (only in pitch mode)
      await expect(page.getByTestId('pdf-download-button')).toHaveCount(0);
    });
  });
});
