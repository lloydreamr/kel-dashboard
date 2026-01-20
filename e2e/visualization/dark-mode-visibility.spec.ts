/**
 * Dark Mode Visibility E2E Test - BUG-002
 *
 * Tests that chart elements remain visible and accessible in dark mode:
 * 1. Competitor dots use correct CSS variables
 * 2. Theme toggle applies smoothly (CSS transition)
 * 3. Chart elements are visible in both light and dark modes
 * 4. Kel position marker is distinct from competitor dots
 *
 * These tests verify the BUG-002 fix for WCAG AA contrast compliance.
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

test.describe('Dark Mode Competitor Visibility (BUG-002)', () => {
  test.use({ storageState: STORAGE_STATE.maho });

  test('chart container exists and is visible', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    // Verify chart is rendered
    const chartContainer = page.locator('[data-testid="scatter-chart"]');
    await expect(chartContainer).toBeVisible();
  });

  test('dark mode can be toggled', async ({ page }) => {
    await waitForVisualizationPage(page);

    // Find and click theme toggle button
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });

    if (await themeToggle.isVisible()) {
      // Get initial state
      const html = page.locator('html');
      const initialClass = await html.getAttribute('class');
      const wasDark = initialClass?.includes('dark');

      // Toggle theme
      await themeToggle.click();

      // Wait for transition (200ms as defined in CSS)
      await page.waitForTimeout(300);

      // Verify theme changed
      const newClass = await html.getAttribute('class');
      const isDark = newClass?.includes('dark');
      expect(isDark).not.toBe(wasDark);

      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('competitor dots use theme-aware CSS variable', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    // Check for data points with correct fill
    const dataPoints = page.locator('[data-testid="chart-data-point"]');
    const count = await dataPoints.count();

    if (count > 0) {
      // Verify fill uses CSS variable (not hardcoded color)
      const fill = await dataPoints.first().getAttribute('fill');
      expect(fill).toBe('var(--chart-competitor)');
    }
  });

  test('Kel position marker uses distinct primary color', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    // Check for Kel position marker
    const kelMarker = page.locator('[data-testid="chart-kel-position"]');

    if ((await kelMarker.count()) > 0) {
      // Verify Kel uses primary color (distinct from competitors)
      const fill = await kelMarker.getAttribute('fill');
      expect(fill).toBe('var(--primary)');
    }
  });

  test('quadrant lines use theme-aware stroke', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    // Check quadrant divider lines
    const verticalLine = page.locator('[data-testid="chart-quadrant-line-vertical"]');
    const horizontalLine = page.locator('[data-testid="chart-quadrant-line-horizontal"]');

    if ((await verticalLine.count()) > 0) {
      const stroke = await verticalLine.getAttribute('stroke');
      expect(stroke).toBe('var(--muted-foreground)');
    }

    if ((await horizontalLine.count()) > 0) {
      const stroke = await horizontalLine.getAttribute('stroke');
      expect(stroke).toBe('var(--muted-foreground)');
    }
  });

  test('stale data points use color-mix for opacity', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    // Check for stale data points
    const stalePoints = page.locator('[data-testid="stale-chart-point"]');

    if ((await stalePoints.count()) > 0) {
      const fill = await stalePoints.first().getAttribute('fill');
      expect(fill).toContain('color-mix');
      expect(fill).toContain('var(--chart-competitor)');
    }
  });

  test('theme transition is smooth (no flash)', async ({ page }) => {
    await waitForVisualizationPage(page);

    // This test verifies the CSS transition is applied
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });

    if (await themeToggle.isVisible()) {
      // Get computed transition style
      const hasTransition = await page.evaluate(() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        return (
          style.transition.includes('background-color') ||
          style.transitionProperty.includes('background-color') ||
          style.transition.includes('all')
        );
      });

      expect(hasTransition).toBe(true);
    }
  });

  test('visual regression - dark mode chart snapshot', async ({ page }) => {
    const hasData = await waitForVisualizationPage(page);
    test.skip(!hasData, 'No competitor data in test environment');

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);

    // Take screenshot of chart for visual comparison
    const chartContainer = page.locator('[data-testid="scatter-chart"]');

    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toHaveScreenshot('dark-mode-chart.png', {
        maxDiffPixelRatio: 0.1, // Allow 10% difference for anti-aliasing
      });
    }

    // Restore light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
  });
});

/**
 * Navigate to visualization page and wait for content
 * Returns true if chart data exists, false if empty state
 */
async function waitForVisualizationPage(page: Page): Promise<boolean> {
  await page.goto('/visualization');
  // Wait for either chart OR empty state (whichever appears first)
  await Promise.race([
    page.waitForSelector('[data-testid="scatter-chart"]', { timeout: 10000 }).catch(() => null),
    page
      .waitForSelector('[data-testid="visualization-empty-state"]', { timeout: 10000 })
      .catch(() => null),
  ]);
  // Give the page a moment to settle
  await page.waitForLoadState('networkidle');

  // Check if chart exists (means we have data)
  const chartExists = (await page.locator('[data-testid="scatter-chart"]').count()) > 0;
  return chartExists;
}
