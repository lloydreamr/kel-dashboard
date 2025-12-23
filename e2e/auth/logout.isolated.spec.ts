/**
 * Logout Flow E2E Tests
 *
 * Tests logout functionality and post-logout behavior.
 *
 * IMPORTANT: These tests use fresh mock-login authentication for each test.
 * This prevents logout from invalidating the shared session used by other tests.
 * Each test creates its own isolated session via mock-login, logs out from that
 * specific session, then closes the context.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';

// Don't use stored auth - we'll authenticate fresh each test
test.describe('Logout Flow', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // Create a fresh context without stored auth
    context = await browser.newContext();
    page = await context.newPage();

    // Authenticate via mock-login API (creates a fresh session)
    // Using maho role - the fresh session won't affect stored user.json
    if (process.env.PLAYWRIGHT_TEST_MODE === 'true') {
      await page.goto('/api/test/mock-login?role=maho');
      await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
    }
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('logout button is visible on dashboard', async () => {
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('clicking logout redirects to login', async () => {
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Click the logout button
    await page.getByTestId('logout-button').click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('cannot access dashboard after logout', async () => {
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // Logout
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login/);

    // Try to access dashboard again
    await page.goto('/');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('logout button has proper accessibility', async () => {
    const logoutButton = page.getByTestId('logout-button');

    // Should be focusable
    await logoutButton.focus();
    await expect(logoutButton).toBeFocused();

    // Should have proper text
    await expect(logoutButton).toHaveText(/sign out/i);
  });
});
