/**
 * Market Intelligence Auth E2E Tests
 *
 * Tests authentication protection for the Market Intelligence route.
 * Story 14.1: Market Intelligence Route with Auth Protection
 *
 * - AC1: Unauthenticated Access Redirect
 * - AC2: Authenticated Access
 * - AC3: Route Protection
 *
 * Uses storage state authentication pattern for authenticated tests.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';

// Storage state file (created by auth setup)
const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

// =============================================================================
// AC1 & AC3: Unauthenticated Access Tests (no storage state)
// =============================================================================
test.describe('Market Intelligence Route - Unauthenticated', () => {
  // Use default browser context (no auth)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects unauthenticated users to login (AC1, AC3)', async ({
    page,
  }) => {
    // Attempt to access market intelligence without auth
    await page.goto('/market-intelligence');

    // Should redirect to login with next param
    await expect(page).toHaveURL(/\/login\?next=%2Fmarket-intelligence/);
  });

  test('login page is shown after redirect (AC1)', async ({ page }) => {
    await page.goto('/market-intelligence');

    // Should see login form after redirect
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});

// =============================================================================
// AC2: Authenticated Access Tests
// =============================================================================
test.describe('Market Intelligence Route - Authenticated', () => {
  test.describe.configure({ mode: 'serial' });

  let mahoContext: BrowserContext;
  let mahoPage: Page;

  test.beforeAll(async ({ browser }) => {
    mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    mahoPage = await mahoContext.newPage();
  });

  test.afterAll(async () => {
    await mahoContext?.close();
  });

  test('authenticated users can access MI dashboard (AC2)', async () => {
    await mahoPage.goto('/market-intelligence');

    // Should see the Market Intelligence page, not login
    await expect(mahoPage.getByTestId('market-intelligence-page')).toBeVisible();
    await expect(
      mahoPage.getByText('Market Intelligence Dashboard')
    ).toBeVisible();
  });

  test('page header is visible (AC2)', async () => {
    await mahoPage.goto('/market-intelligence');

    const header = mahoPage.getByTestId('mi-page-header');
    await expect(header).toBeVisible();
    await expect(header.getByRole('heading', { level: 1 })).toHaveText(
      'Market Intelligence Dashboard'
    );
  });

  test('content area is visible (AC2)', async () => {
    await mahoPage.goto('/market-intelligence');

    const contentArea = mahoPage.getByTestId('mi-content-area');
    await expect(contentArea).toBeVisible();
    await expect(contentArea).toContainText('Dashboard content coming');
  });

  test('user remains on MI route (no unexpected redirects) (AC2)', async () => {
    await mahoPage.goto('/market-intelligence');

    // Verify URL is exactly /market-intelligence (no redirects)
    await expect(mahoPage).toHaveURL(/\/market-intelligence$/);
  });
});

// =============================================================================
// Post-Login Redirect Test (AC1)
// Tests the redirect flow: unauthenticated → login → back to MI
// =============================================================================
test.describe('Post-Login Redirect Flow', () => {
  test('post-login redirect preserves destination (AC1)', async ({
    browser,
  }) => {
    // Start with unauthenticated context
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    // Try to access MI - should redirect to login with next param
    await page.goto('/market-intelligence');
    await expect(page).toHaveURL(/\/login\?next=%2Fmarket-intelligence/);

    // Extract the next param from the current URL
    const currentUrl = new URL(page.url());
    const nextParam = currentUrl.searchParams.get('next');
    expect(nextParam).toBe('/market-intelligence');

    // Simulate login with redirectTo param (mimics what login form would do)
    // The mock-login API now supports redirectTo to verify the full flow
    await page.goto(`/api/test/mock-login?redirectTo=${nextParam}`);

    // Should be automatically redirected to /market-intelligence after login
    await expect(page).toHaveURL(/\/market-intelligence$/);

    // Should see the MI page content
    await expect(page.getByTestId('market-intelligence-page')).toBeVisible();

    await context.close();
  });
});
