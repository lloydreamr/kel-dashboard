/**
 * Print Preview E2E Test - Story 11.3
 *
 * Tests print-optimized CSS behavior using Playwright's media emulation.
 * Verifies that @media print rules correctly:
 * 1. Hide navigation and UI chrome
 * 2. Show chart content appropriately
 * 3. Apply print-friendly styling
 *
 * Uses page.emulateMedia({ media: 'print' }) to test CSS media queries.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

test.describe('Print Preview Styles (Story 11.3)', () => {
  let mahoContext: BrowserContext;
  let mahoPage: Page;

  test.beforeAll(async ({ browser }) => {
    mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    mahoPage = await mahoContext.newPage();
  });

  test.afterAll(async () => {
    await mahoContext.close();
  });

  test.describe('Print Media Hides Navigation (AC #2)', () => {
    test('sidebar is hidden in print media', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - sidebar should be hidden via @media print rules
      const sidebar = mahoPage.getByTestId('nav-sidebar');
      await expect(sidebar).toBeHidden();
    });

    test('pitch mode header is hidden in print media', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - pitch mode header should be hidden
      // Note: There may be multiple headers (responsive), all should be hidden
      const headers = mahoPage.getByTestId('pitch-mode-header');
      const count = await headers.count();

      for (let i = 0; i < count; i++) {
        await expect(headers.nth(i)).toBeHidden();
      }
    });

    test('offline banner is hidden in print media', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - offline banner should be hidden (if it exists)
      const banner = mahoPage.getByTestId('offline-banner');
      const count = await banner.count();

      // Only check if element exists
      if (count > 0) {
        await expect(banner).toBeHidden();
      }
    });

    test('quick capture widget is hidden in print media', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - quick capture widget should be hidden (if it exists)
      const widget = mahoPage.getByTestId('quick-capture-widget');
      const count = await widget.count();

      // Only check if element exists
      if (count > 0) {
        await expect(widget).toBeHidden();
      }
    });
  });

  test.describe('Print Media Shows Chart Content (AC #1, #3)', () => {
    test('print preview content container is visible in print media', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - print preview content should remain visible
      const printContent = mahoPage.getByTestId('print-preview-content');
      await expect(printContent).toBeVisible();
    });

    test('visualization page container is visible in print media', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - visualization page should remain visible
      const vizPage = mahoPage.getByTestId('visualization-page');
      await expect(vizPage).toBeVisible();
    });

    test('chart legend stays visible in print media', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - chart legend should remain visible
      const legend = mahoPage.getByTestId('chart-legend');
      const count = await legend.count();

      // Only check if element exists (depends on whether chart has data)
      if (count > 0) {
        await expect(legend).toBeVisible();
      }
    });
  });

  test.describe('Print vs Screen Media Toggle', () => {
    test('elements correctly toggle between screen and print media', async () => {
      // Arrange - reset to screen media first (previous tests may have left print mode)
      await mahoPage.emulateMedia({ media: 'screen' });

      // Navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Verify initial screen state - at least one pitch header visible
      const headers = mahoPage.getByTestId('pitch-mode-header');
      const count = await headers.count();
      let foundVisibleHeader = false;
      for (let i = 0; i < count; i++) {
        if (await headers.nth(i).isVisible()) {
          foundVisibleHeader = true;
          break;
        }
      }
      expect(foundVisibleHeader).toBe(true);

      // Act - switch to print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - all pitch headers should be hidden
      for (let i = 0; i < count; i++) {
        await expect(headers.nth(i)).toBeHidden();
      }

      // Act - switch back to screen media
      await mahoPage.emulateMedia({ media: 'screen' });

      // Assert - at least one pitch header visible again
      foundVisibleHeader = false;
      for (let i = 0; i < count; i++) {
        if (await headers.nth(i).isVisible()) {
          foundVisibleHeader = true;
          break;
        }
      }
      expect(foundVisibleHeader).toBe(true);
    });
  });

  test.describe('Normal View Print Behavior', () => {
    test('sidebar is hidden in print media on normal view', async () => {
      // Arrange - navigate to normal visualization (not pitch mode)
      await mahoPage.goto('/visualization');
      await mahoPage.waitForLoadState('networkidle');

      // First verify sidebar is visible on screen (desktop only)
      await mahoPage.emulateMedia({ media: 'screen' });
      const sidebar = mahoPage.getByTestId('nav-sidebar');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - sidebar should be hidden in print
      await expect(sidebar).toBeHidden();
    });

    test('buttons are hidden in print media on normal view', async () => {
      // Arrange - navigate to normal visualization
      await mahoPage.goto('/visualization');
      await mahoPage.waitForLoadState('networkidle');

      // Act - emulate print media
      await mahoPage.emulateMedia({ media: 'print' });

      // Assert - buttons should be hidden
      // Check Add Competitor button (Maho-only control)
      const addButton = mahoPage.getByTestId('add-competitor-button');
      await expect(addButton).toBeHidden();

      // Check Enter Pitch Mode button
      const pitchButton = mahoPage.getByTestId('enter-pitch-mode-button');
      await expect(pitchButton).toBeHidden();
    });
  });
});
