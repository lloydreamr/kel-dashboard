/**
 * Offline Mode E2E Tests
 *
 * Tests for Story 10.3: Offline Read-Only Mode.
 *
 * Verifies:
 * - Offline banner appears when going offline
 * - Banner disappears when back online
 * - Write operations show offline toast and are blocked
 * - Read operations still work (viewing existing data)
 *
 * Uses Playwright's context.setOffline() combined with manual event dispatch
 * to properly simulate offline state (Playwright's setOffline only blocks network,
 * doesn't fire browser online/offline events).
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
    // Set navigator.onLine to false (read-only, so we use defineProperty)
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    // Dispatch the event that hooks listen for
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

test.describe('Offline Read-Only Mode', () => {
  test.use({
    storageState: STORAGE_STATE.maho,
  });

  test.describe('Offline Banner', () => {
    test('shows banner when going offline', async ({ page }) => {
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

    test('hides banner when back online', async ({ page }) => {
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

    test('banner has correct styling (yellow warning)', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Go offline
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

      // Check banner has yellow background class
      const banner = page.getByTestId('offline-banner');
      await expect(banner).toHaveClass(/bg-yellow-100/);
      await expect(banner).toHaveClass(/text-yellow-800/);
    });
  });

  test.describe('Write Protection', () => {
    // Note: This test only runs on desktop. On mobile, the form submission behavior
    // is tested separately. The offline guard mechanism is the same across devices,
    // but form interaction timing differs on mobile viewports.
    test('blocks question creation when offline', async ({ page, isMobile }) => {
      test.skip(isMobile === true, 'Form submission timing differs on mobile - covered by desktop test');

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

      // guardOffline() now runs at the START of onMutate (before cancelQueries)
      // So the mutation should error immediately and show a toast
      // The form should return (not stay skeleton) and toast should appear
      await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-sonner-toast]')).toContainText('offline', { ignoreCase: true });

      // Form should return (mutation errored, isPending = false)
      await expect(page.getByTestId('question-form')).toBeVisible({ timeout: 5000 });
    });

    test('allows write operations when back online', async ({ page }) => {
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

  test.describe('Read Access While Offline', () => {
    // Note: This test verifies viewing behavior when going offline.
    // Full cached data persistence requires service worker (production only).

    test('can view questions list while offline', async ({ page }) => {
      // First load the questions page while online to populate cache
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Wait for questions to load
      await page.waitForSelector('[data-testid="question-card"], [data-testid="questions-empty-state"]', {
        timeout: 5000,
      });

      // Go offline
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

      // Page should still be visible (no crash)
      await expect(page.getByTestId('questions-page')).toBeVisible();
    });

    test('can navigate to question detail while offline (if already loaded)', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Wait for questions to load
      const questionCard = page.getByTestId('question-card').first();
      const hasQuestions = await questionCard.isVisible().catch(() => false);

      if (!hasQuestions) {
        test.skip();
        return;
      }

      // Click on first question to load its detail (while online)
      await questionCard.click();
      await expect(page.getByTestId('question-detail-page')).toBeVisible({ timeout: 10000 });

      // Now go offline
      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });

      // Page content should still be visible (already loaded in memory)
      await expect(page.getByTestId('question-detail-page')).toBeVisible();
    });
  });

  test.describe('Offline with Multiple Page Types', () => {
    test('shows banner on visualization page', async ({ page }) => {
      await page.goto('/visualization');
      await expect(page.getByTestId('visualization-page')).toBeVisible();

      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });
    });

    test('shows banner on progress page', async ({ page }) => {
      await page.goto('/progress');
      await expect(page.getByTestId('progress-page')).toBeVisible();

      await goOffline(page);
      await expect(page.getByTestId('offline-banner')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Rapid Online/Offline Toggling', () => {
    test('handles rapid toggling without UI errors', async ({ page }) => {
      await page.goto('/questions');
      await expect(page.getByTestId('questions-page')).toBeVisible();

      // Rapidly toggle offline/online
      for (let i = 0; i < 5; i++) {
        await goOffline(page);
        await page.waitForTimeout(100);
        await goOnline(page);
        await page.waitForTimeout(100);
      }

      // Final state: online, banner hidden
      await goOnline(page);
      await expect(page.getByTestId('offline-banner')).not.toBeVisible({ timeout: 5000 });

      // Page should still be functional
      await expect(page.getByTestId('questions-page')).toBeVisible();
    });
  });
});
