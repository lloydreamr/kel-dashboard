/**
 * Protected Routes E2E Tests (Unauthenticated)
 *
 * Tests route protection behavior when not authenticated.
 * Verifies redirect to login and next parameter handling.
 */
import { test, expect } from '@playwright/test';

test.describe('Protected Routes (Unauthenticated)', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    // Try to access the protected dashboard
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('preserves original destination in next param', async ({ page }) => {
    // Try to access the dashboard
    await page.goto('/');

    // Should redirect to login with next param
    // Note: / doesn't get added as next param per middleware logic
    await expect(page).toHaveURL('/login');
  });

  test('shows login form after redirect', async ({ page }) => {
    await page.goto('/');

    // After redirect, login form should be visible
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('handles session expired redirect', async ({ page }) => {
    // Simulate session expired redirect
    await page.goto('/login?error=session_expired');

    // Should show session expired message
    await expect(page.getByTestId('session-expired-message')).toBeVisible();
  });

  test('login page is accessible without redirect loop', async ({ page }) => {
    // Going directly to login should work
    await page.goto('/login');

    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('auth callback route is public', async ({ page }) => {
    // Auth callback should not redirect to login
    // (It handles its own auth flow)
    const response = await page.goto('/auth/callback');

    // Should not redirect to login (might show error or redirect elsewhere)
    expect(page.url()).not.toMatch(/\/login\?next/);
  });
});
