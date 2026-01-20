/**
 * Sync Indicator E2E Tests
 *
 * Tests for Story 10.4: Offline Detection & Sync Indicator.
 *
 * Verifies:
 * - Sync indicator displays in sidebar
 * - Indicator shows correct state colors (green/yellow/gray)
 * - Manual refresh button works
 * - Reconnection banner shows "Back online – syncing..."
 * - Feature flag controls visibility
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

/**
 * Simulate going offline by:
 * 1. Blocking network traffic (setOffline)
 * 2. Dispatching 'offline' event (triggers hooks)
 * 3. Setting navigator.onLine to false
 */
async function goOffline(page: Page) {
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
async function goOnline(page: Page) {
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

test.describe('Sync Indicator (Story 10.4)', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
  });

  test.describe('Sync Indicator Display', () => {
    test('displays sync indicator in sidebar', async ({ page, isMobile }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // On mobile, sync indicator is in mobile header; on desktop, in sidebar
      // Use last() for mobile (header), first() for desktop (sidebar)
      const syncIndicator = isMobile
        ? page.getByTestId('sync-indicator').last()
        : page.getByTestId('sync-indicator').first();
      await expect(syncIndicator).toBeVisible();
    });

    test('shows green or yellow status when online (AC#1, AC#2)', async ({ page, isMobile }) => {
      // Clear localStorage to ensure fresh state
      await page.goto('/questions');
      await page.evaluate(() => {
        localStorage.removeItem('kel_last_sync');
      });
      await page.reload();
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Wait for queries to complete (sync status should update)
      await page.waitForTimeout(1500);

      // Per AC#1/AC#2: Sync indicator should show state-specific test IDs
      // Accept either sync-indicator-online (green/fresh) or sync-indicator-stale (yellow/stale)
      const onlineDot = isMobile
        ? page.getByTestId('sync-indicator-online').last()
        : page.getByTestId('sync-indicator-online').first();
      const staleDot = isMobile
        ? page.getByTestId('sync-indicator-stale').last()
        : page.getByTestId('sync-indicator-stale').first();

      // Either online (fresh) or stale state is valid
      const onlineVisible = await onlineDot.isVisible().catch(() => false);
      const staleVisible = await staleDot.isVisible().catch(() => false);
      expect(onlineVisible || staleVisible).toBe(true);
    });

    test('shows gray status when offline (AC#3)', async ({ page, isMobile }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Go offline
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

      // Per AC#3: Sync indicator should show sync-indicator-offline with gray color
      const syncDot = isMobile
        ? page.getByTestId('sync-indicator-offline').last()
        : page.getByTestId('sync-indicator-offline').first();
      await expect(syncDot).toBeVisible();
      await expect(syncDot).toHaveClass(/bg-gray-400/);
    });
  });

  test.describe('Manual Refresh', () => {
    test('refresh button is visible and clickable', async ({ page, isMobile }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // On mobile, use last() to get header version; on desktop, use first() for sidebar
      const refreshButton = isMobile
        ? page.getByTestId('sync-refresh-button').last()
        : page.getByTestId('sync-refresh-button').first();
      await expect(refreshButton).toBeVisible();

      // Click should trigger refresh (button should show spinner briefly)
      await refreshButton.click();

      // Wait for refresh to complete
      await page.waitForTimeout(500);

      // Should still be functional after refresh
      await expect(page.getByTestId('questions-page')).toBeVisible();
    });

    test('refresh button is disabled when offline', async ({ page, isMobile }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Go offline
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

      // On mobile, use last() to get header version; on desktop, use first() for sidebar
      const refreshButton = isMobile
        ? page.getByTestId('sync-refresh-button').last()
        : page.getByTestId('sync-refresh-button').first();
      await expect(refreshButton).toBeDisabled();
    });

    test('refresh button re-enables when back online', async ({ page, isMobile }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Go offline
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

      const refreshButton = isMobile
        ? page.getByTestId('sync-refresh-button').last()
        : page.getByTestId('sync-refresh-button').first();
      await expect(refreshButton).toBeDisabled();

      // Go back online
      await goOnline(page);
      await expect(page.getByTestId('offline-banner')).not.toBeVisible({ timeout: 5000 });

      // Refresh button should be enabled again
      await expect(refreshButton).toBeEnabled();
    });
  });

  test.describe('Reconnection Banner (AC#4)', () => {
    test('shows "Back online – syncing..." when reconnecting', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Go offline first
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('offline-banner')).toContainText("You're offline");

      // Go back online
      await goOnline(page);

      // Should show reconnection message (uses offline-banner-reconnected test ID per AC#4)
      await expect(page.getByTestId('offline-banner-reconnected')).toContainText('Back online', { timeout: 5000 });
    });

    test('reconnection banner has green styling and reconnected test ID (AC#4)', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Go offline then online
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });
      await goOnline(page);

      // Per AC#4: Banner should use offline-banner-reconnected test ID with green styling
      const banner = page.getByTestId('offline-banner-reconnected');
      await expect(banner).toBeVisible({ timeout: 5000 });
      await expect(banner).toHaveClass(/bg-green-100/);
      await expect(banner).toHaveClass(/text-green-800/);
    });

    test('reconnection banner auto-dismisses after delay', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Go offline then online
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });
      await goOnline(page);

      // Per AC#4: Banner should show reconnection message with offline-banner-reconnected test ID
      const reconnectedBanner = page.getByTestId('offline-banner-reconnected');
      await expect(reconnectedBanner).toContainText('Back online', { timeout: 5000 });

      // Wait for auto-dismiss (2 seconds + buffer)
      await page.waitForTimeout(3000);

      // Both banner types should be hidden after dismissal
      await expect(page.getByTestId('offline-banner-reconnected')).not.toBeVisible();
      await expect(page.getByTestId('offline-banner')).not.toBeVisible();
    });
  });

  test.describe('Tooltip Information', () => {
    test('shows sync time in tooltip on hover', async ({ page, isMobile }) => {
      // Skip tooltip tests on mobile (no hover)
      test.skip(isMobile === true, 'Tooltips not applicable on mobile');

      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Hover over sync indicator (use first() for sidebar version)
      const syncIndicator = page.getByTestId('sync-indicator').first();
      await syncIndicator.hover();

      // Tooltip should show sync time
      await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 3000 });
      // Should contain some time info (e.g., "just now" or "X minutes ago")
      await expect(page.getByRole('tooltip')).toContainText(/sync|now|ago|offline|loading/i);
    });
  });

  test.describe('Sync State Persistence', () => {
    test('maintains sync state across page navigation', async ({ page, isMobile }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Wait for initial sync
      await page.waitForTimeout(500);

      // Navigate to visualization
      await page.goto('/visualization');
      await expect(page.getByTestId('visualization-page')).toBeVisible();

      // On mobile, use last() to get header version; on desktop, use first() for sidebar
      const syncIndicator = isMobile
        ? page.getByTestId('sync-indicator').last()
        : page.getByTestId('sync-indicator').first();
      await expect(syncIndicator).toBeVisible();

      // Per AC#1-3: Check for any state-specific test ID (online, stale, or offline)
      const onlineDot = isMobile
        ? page.getByTestId('sync-indicator-online').last()
        : page.getByTestId('sync-indicator-online').first();
      const staleDot = isMobile
        ? page.getByTestId('sync-indicator-stale').last()
        : page.getByTestId('sync-indicator-stale').first();
      const offlineDot = isMobile
        ? page.getByTestId('sync-indicator-offline').last()
        : page.getByTestId('sync-indicator-offline').first();

      // One of the state-specific indicators should be visible
      const onlineVisible = await onlineDot.isVisible().catch(() => false);
      const staleVisible = await staleDot.isVisible().catch(() => false);
      const offlineVisible = await offlineDot.isVisible().catch(() => false);
      expect(onlineVisible || staleVisible || offlineVisible).toBe(true);
    });
  });
});
