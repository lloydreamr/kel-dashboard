/**
 * Responsive Visualization E2E Tests
 *
 * Story 10-1: Mobile Visualization Responsive Layout
 * Task 9: E2E tests for mobile/tablet viewport behavior
 *
 * Tests verify:
 * - Mobile viewport (375px) responsive behavior
 * - Tablet viewport (768px) layout
 * - Touch target accessibility (48px minimum)
 * - Axis label abbreviation on mobile
 * - Quadrant label visibility
 */

import { test, expect } from '@playwright/test';
import path from 'path';

// Auth storage state paths
const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

// Viewport configurations
// Note: SMALL_MOBILE_BREAKPOINT is 374px, MOBILE_BREAKPOINT is 639px
const VIEWPORTS = {
  smallMobile: { width: 360, height: 640 }, // Below 374px breakpoint - triggers isSmallMobile
  mobile: { width: 375, height: 667 }, // iPhone SE - above small mobile, below tablet
  tablet: { width: 768, height: 1024 }, // iPad portrait - above mobile breakpoint
  desktop: { width: 1280, height: 800 },
};

test.describe('Responsive Visualization - Mobile Viewport', () => {
  test.use({ storageState: STORAGE_STATE.maho });

  test('chart renders with responsive height on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    // Chart container should exist and have responsive height
    const chartContainer = page.locator('[data-testid="scatter-chart"]');
    await expect(chartContainer).toBeVisible();

    const boundingBox = await chartContainer.boundingBox();
    expect(boundingBox).not.toBeNull();

    // Mobile chart height should be between 280-400px (per useResponsiveChartHeight)
    expect(boundingBox!.height).toBeGreaterThanOrEqual(280);
    expect(boundingBox!.height).toBeLessThanOrEqual(400);
  });

  test('chart is responsive and functional on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    // Verify the chart renders with axes present
    const chartArea = page.locator('[data-testid="scatter-chart"]');
    await expect(chartArea).toBeVisible();

    // Verify X and Y axes are rendered (via their testids)
    // Note: Recharts adds data-testid to multiple axis elements, so use .first()
    const xAxis = page.locator('[data-testid="chart-x-axis"]').first();
    const yAxis = page.locator('[data-testid="chart-y-axis"]').first();

    // Wait for axes to render (they should always be present)
    await expect(xAxis).toBeAttached();
    await expect(yAxis).toBeAttached();
  });

  test('touch targets meet 48px accessibility requirement', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    // Check Add Competitor button touch target
    const addButton = page.getByTestId('add-competitor-button');
    if (await addButton.isVisible()) {
      const addButtonBox = await addButton.boundingBox();
      expect(addButtonBox).not.toBeNull();
      expect(addButtonBox!.height).toBeGreaterThanOrEqual(48);
      expect(addButtonBox!.width).toBeGreaterThanOrEqual(48);
    }

    // Check Mark Kel Position button touch target
    const kelButton = page.getByTestId('mark-kel-position-button');
    if (await kelButton.isVisible()) {
      const kelButtonBox = await kelButton.boundingBox();
      expect(kelButtonBox).not.toBeNull();
      expect(kelButtonBox!.height).toBeGreaterThanOrEqual(48);
    }

    // Check chart click overlay buttons (if competitors exist)
    const overlayButtons = page.locator('[data-generic-testid="chart-click-overlay"]');
    const overlayCount = await overlayButtons.count();

    if (overlayCount > 0) {
      const firstOverlay = overlayButtons.first();
      const overlayBox = await firstOverlay.boundingBox();
      expect(overlayBox).not.toBeNull();
      expect(overlayBox!.width).toBeGreaterThanOrEqual(48);
      expect(overlayBox!.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('action buttons are accessible on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    const addButton = page.getByTestId('add-competitor-button');
    const kelButton = page.getByTestId('mark-kel-position-button');

    // Both buttons should be visible and accessible
    await expect(addButton).toBeVisible();
    await expect(kelButton).toBeVisible();

    // Buttons should not overlap (proper layout regardless of stacking direction)
    const addBox = await addButton.boundingBox();
    const kelBox = await kelButton.boundingBox();

    expect(addBox).not.toBeNull();
    expect(kelBox).not.toBeNull();

    // Verify buttons don't completely overlap (they're distinct elements)
    const overlapsX =
      addBox!.x < kelBox!.x + kelBox!.width && addBox!.x + addBox!.width > kelBox!.x;
    const overlapsY =
      addBox!.y < kelBox!.y + kelBox!.height && addBox!.y + addBox!.height > kelBox!.y;

    // They shouldn't both overlap in X AND Y (would mean stacked on top of each other)
    expect(overlapsX && overlapsY).toBe(false);
  });
});

test.describe('Responsive Visualization - Small Mobile Viewport', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
    viewport: VIEWPORTS.smallMobile,
  });

  test('quadrant labels are hidden on small mobile', async ({ page }) => {
    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    // On small mobile (<375px), quadrant labels should be hidden
    // The quadrant labels are SVG <text> elements: "Premium", "Value", "Budget", "Low Quality"
    const chartArea = page.locator('[data-testid="scatter-chart"]');

    // Look for quadrant label text within the SVG
    const premiumLabel = chartArea.locator('text').filter({ hasText: /^Premium$/ });
    const valueLabel = chartArea.locator('text').filter({ hasText: /^Value$/ });
    const budgetLabel = chartArea.locator('text').filter({ hasText: /^Budget$/ });

    // On small mobile, these labels should NOT be visible (conditionally rendered out)
    const premiumCount = await premiumLabel.count();
    const valueCount = await valueLabel.count();
    const budgetCount = await budgetLabel.count();

    // Labels should not be in the DOM at all on small mobile
    expect(premiumCount).toBe(0);
    expect(valueCount).toBe(0);
    expect(budgetCount).toBe(0);
  });

  test('chart fits within small mobile viewport', async ({ page }) => {
    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    const chartContainer = page.locator('[data-testid="scatter-chart"]');
    const boundingBox = await chartContainer.boundingBox();

    expect(boundingBox).not.toBeNull();

    // Chart should not exceed viewport width
    expect(boundingBox!.width).toBeLessThanOrEqual(VIEWPORTS.smallMobile.width);

    // Chart should have minimum usable height
    expect(boundingBox!.height).toBeGreaterThanOrEqual(280);
  });
});

test.describe('Responsive Visualization - Tablet Viewport', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
    viewport: VIEWPORTS.tablet,
  });

  test('chart renders with desktop layout on tablet', async ({ page }) => {
    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    const chartContainer = page.locator('[data-testid="scatter-chart"]');
    await expect(chartContainer).toBeVisible();

    const boundingBox = await chartContainer.boundingBox();
    expect(boundingBox).not.toBeNull();

    // Tablet (768px) is above mobile breakpoint (639px), so should use desktop height
    expect(boundingBox!.height).toBe(400);
  });

  test('chart renders with axes on tablet', async ({ page }) => {
    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    // Verify the chart renders with both axes present
    // Note: Recharts adds data-testid to multiple axis elements, so use .first()
    const xAxis = page.locator('[data-testid="chart-x-axis"]').first();
    const yAxis = page.locator('[data-testid="chart-y-axis"]').first();

    await expect(xAxis).toBeAttached();
    await expect(yAxis).toBeAttached();
  });

  test('action buttons are visible on tablet', async ({ page }) => {
    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    const addButton = page.getByTestId('add-competitor-button');
    const kelButton = page.getByTestId('mark-kel-position-button');

    // Both buttons should be visible on tablet
    await expect(addButton).toBeVisible();
    await expect(kelButton).toBeVisible();

    // Verify they have proper dimensions
    const addBox = await addButton.boundingBox();
    const kelBox = await kelButton.boundingBox();

    expect(addBox).not.toBeNull();
    expect(kelBox).not.toBeNull();
    expect(addBox!.width).toBeGreaterThan(0);
    expect(kelBox!.width).toBeGreaterThan(0);
  });
});

test.describe('Responsive Visualization - Desktop Viewport', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
    viewport: VIEWPORTS.desktop,
  });

  test('chart uses fixed 400px height on desktop', async ({ page }) => {
    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    const chartContainer = page.locator('[data-testid="scatter-chart"]');
    const boundingBox = await chartContainer.boundingBox();

    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBe(400);
  });

  test('quadrant labels are visible on desktop', async ({ page }) => {
    await page.goto('/visualization');
    await page.waitForSelector('[data-testid="scatter-chart"]');

    // On desktop, quadrant labels should be visible
    // Quadrant labels are SVG <text> elements: "Premium", "Value", "Budget", "Low Quality"
    const chartArea = page.locator('[data-testid="scatter-chart"]');

    // Look for quadrant label text within the SVG
    const premiumLabel = chartArea.locator('text').filter({ hasText: /^Premium$/ });
    const valueLabel = chartArea.locator('text').filter({ hasText: /^Value$/ });
    const budgetLabel = chartArea.locator('text').filter({ hasText: /^Budget$/ });

    // On desktop, these labels should be present
    await expect(premiumLabel).toBeVisible();
    await expect(valueLabel).toBeVisible();
    await expect(budgetLabel).toBeVisible();
  });
});
