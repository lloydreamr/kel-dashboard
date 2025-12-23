/**
 * Authenticated Session E2E Tests
 *
 * Tests session persistence and authenticated user behavior.
 * Uses explicit storageState to ensure each test starts authenticated.
 */
import { test, expect } from '@playwright/test';

test.describe('Authenticated Session', () => {
  // Ensure fresh auth state for each test
  test.use({ storageState: 'e2e/.auth/user.json' });
  test('shows dashboard when authenticated', async ({ page }) => {
    await page.goto('/');

    // Should see dashboard, not login
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('displays user email on dashboard', async ({ page }) => {
    await page.goto('/');

    // Should show logged in as message with email
    await expect(page.getByText(/logged in as/i)).toBeVisible();
  });

  test('session persists across navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Navigate to login (should redirect back since already authenticated)
    await page.goto('/login');

    // Should redirect to dashboard since already authenticated
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('session persists across page reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Reload the page
    await page.reload();

    // Should still be on dashboard
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('authenticated user redirected from login to dashboard', async ({
    page,
  }) => {
    // Try to access login while authenticated
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});
