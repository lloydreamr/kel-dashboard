/**
 * Smoke Tests - Basic application health checks
 *
 * These tests verify the app loads without errors.
 * Uses unauthenticated state by default.
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('login page loads successfully', async ({ page }) => {
    await page.goto('/login');

    // Verify login page loaded
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('page has correct title', async ({ page }) => {
    await page.goto('/login');

    // Check for app title
    await expect(page).toHaveTitle(/Kel|Next/);
  });

  test('page renders without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors (favicon only - hydration errors should fail)
    const criticalErrors = errors.filter((e) => !e.includes('favicon'));

    expect(criticalErrors).toHaveLength(0);
  });

  test('unauthenticated access to home redirects to login', async ({
    page,
  }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
