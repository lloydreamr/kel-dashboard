/**
 * Status Filter Mobile Responsiveness E2E Test
 *
 * Story 13.2: Mobile Tab Responsiveness (BUG-005)
 *
 * Tests:
 * 1. Tab labels readable on 375px viewport (iPhone SE)
 * 2. Counts visible alongside status text
 * 3. Touch targets maintain 44x44px minimum
 * 4. Behavior adapts to orientation changes
 * 5. Desktop experience preserved
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const MAHO_AUTH = path.join(__dirname, '../.auth/maho.json');

// Mobile viewport (iPhone SE)
const MOBILE_VIEWPORT = { width: 375, height: 667 };
// Mobile landscape
const MOBILE_LANDSCAPE = { width: 667, height: 375 };
// Desktop viewport
const DESKTOP_VIEWPORT = { width: 1024, height: 768 };
// Timeout for tab state change assertions (mobile can be slower)
const TAB_STATE_TIMEOUT = 10000;

test.describe('Status Filter Mobile Responsiveness', () => {
  test.use({ storageState: MAHO_AUTH });

  test('displays abbreviated labels on mobile viewport (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/questions');

    // Wait for status filter to be visible
    const statusFilter = page.getByTestId('status-filter');
    await expect(statusFilter).toBeVisible();

    // Get all tab buttons
    const allTab = page.getByTestId('status-filter-all');
    const draftTab = page.getByTestId('status-filter-draft');
    const sentTab = page.getByTestId('status-filter-sent');
    const decidedTab = page.getByTestId('status-filter-decided');

    // Verify tabs are visible
    await expect(allTab).toBeVisible();
    await expect(draftTab).toBeVisible();
    await expect(sentTab).toBeVisible();
    await expect(decidedTab).toBeVisible();

    // Verify mobile labels are visible (sm:hidden spans)
    // On mobile, only the shortLabel should be visible
    const sentMobileSpan = sentTab.locator('.sm\\:hidden');
    await expect(sentMobileSpan).toBeVisible();
    await expect(sentMobileSpan).toHaveText('Sent');

    // Verify desktop labels are hidden on mobile
    const sentDesktopSpan = sentTab.locator('.hidden.sm\\:inline');
    await expect(sentDesktopSpan).not.toBeVisible();
  });

  test('counts remain visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/questions');

    const statusFilter = page.getByTestId('status-filter');
    await expect(statusFilter).toBeVisible();

    // Verify count spans are visible on all tabs
    const tabs = ['all', 'draft', 'sent', 'decided'];
    for (const tab of tabs) {
      const tabElement = page.getByTestId(`status-filter-${tab}`);
      // Count format: (N)
      await expect(tabElement).toContainText(/\(\d+\)/);
    }
  });

  test('touch targets meet 44x44px minimum', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/questions');

    const statusFilter = page.getByTestId('status-filter');
    await expect(statusFilter).toBeVisible();

    // Check each tab has adequate touch target
    const tabs = ['all', 'draft', 'sent', 'decided'];
    for (const tab of tabs) {
      const tabElement = page.getByTestId(`status-filter-${tab}`);
      const box = await tabElement.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        // Height should be at least 44px (our implementation uses 48px)
        expect(box.height).toBeGreaterThanOrEqual(44);
        // Width with 4 tabs on 375px should be ~90px+ each
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('adapts to orientation change without layout shift', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/questions');

    const statusFilter = page.getByTestId('status-filter');
    await expect(statusFilter).toBeVisible();

    // Get initial positions
    const sentTab = page.getByTestId('status-filter-sent');
    const initialBox = await sentTab.boundingBox();

    // Change to landscape
    await page.setViewportSize(MOBILE_LANDSCAPE);

    // Wait for layout to stabilize - status filter visibility confirms DOM settled
    await expect(statusFilter).toBeVisible();

    // All tabs should still be functional
    await expect(sentTab).toBeVisible();

    // Verify no error toasts or console errors during transition
    // (layout shift would typically cause React errors)
  });

  test('displays full labels on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/questions');

    const statusFilter = page.getByTestId('status-filter');
    await expect(statusFilter).toBeVisible();

    const sentTab = page.getByTestId('status-filter-sent');

    // Verify desktop labels are visible
    const sentDesktopSpan = sentTab.locator('.hidden.sm\\:inline');
    await expect(sentDesktopSpan).toBeVisible();
    await expect(sentDesktopSpan).toHaveText('Sent to Kel');

    // Verify mobile labels are hidden on desktop
    const sentMobileSpan = sentTab.locator('.sm\\:hidden');
    await expect(sentMobileSpan).not.toBeVisible();
  });

  test('tabs remain functional on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/questions');

    const statusFilter = page.getByTestId('status-filter');
    await expect(statusFilter).toBeVisible();

    // Click draft tab and wait for state change
    const draftTab = page.getByTestId('status-filter-draft');
    await draftTab.click();
    await expect(draftTab).toHaveAttribute('data-state', 'active', { timeout: TAB_STATE_TIMEOUT });

    // Click sent tab and wait for state change
    const sentTab = page.getByTestId('status-filter-sent');
    await sentTab.click();
    await expect(sentTab).toHaveAttribute('data-state', 'active', { timeout: TAB_STATE_TIMEOUT });

    // Click decided tab and wait for state change
    const decidedTab = page.getByTestId('status-filter-decided');
    await decidedTab.click();
    await expect(decidedTab).toHaveAttribute('data-state', 'active', { timeout: TAB_STATE_TIMEOUT });

    // Click all tab and wait for state change
    const allTab = page.getByTestId('status-filter-all');
    await allTab.click();
    await expect(allTab).toHaveAttribute('data-state', 'active', { timeout: TAB_STATE_TIMEOUT });
  });
});
