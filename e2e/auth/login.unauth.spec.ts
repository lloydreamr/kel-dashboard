/**
 * Login Flow E2E Tests (Unauthenticated)
 *
 * Tests the login page and form behavior without authenticated session.
 * Uses ".unauth.spec.ts" naming to run in chromium-no-auth project.
 */
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows login form with email input', async ({ page }) => {
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('email input is focused on page load', async ({ page }) => {
    const emailInput = page.getByTestId('login-email-input');
    await expect(emailInput).toBeFocused();
  });

  test('submit button is disabled with empty email', async ({ page }) => {
    const submitButton = page.getByTestId('login-submit');
    await expect(submitButton).toBeDisabled();
  });

  test('submit button is disabled with invalid email', async ({ page }) => {
    const emailInput = page.getByTestId('login-email-input');
    const submitButton = page.getByTestId('login-submit');

    await emailInput.fill('invalid-email');

    // Button should still be disabled with invalid email
    await expect(submitButton).toBeDisabled();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    const emailInput = page.getByTestId('login-email-input');

    // Type invalid email then blur to trigger validation
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Should show validation message
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('submit button is enabled with valid email', async ({ page }) => {
    const emailInput = page.getByTestId('login-email-input');
    const submitButton = page.getByTestId('login-submit');

    await emailInput.fill('test@example.com');

    await expect(submitButton).toBeEnabled();
  });

  test('shows error for unauthorized email', async ({ page }) => {
    const emailInput = page.getByTestId('login-email-input');
    const submitButton = page.getByTestId('login-submit');

    // Use an unauthorized email - should show error
    await emailInput.fill('test@example.com');
    await submitButton.click();

    // Should show error message for unauthorized email
    await expect(page.getByText(/not authorized/i)).toBeVisible();
  });

  test('shows session expired message when redirected', async ({ page }) => {
    await page.goto('/login?error=session_expired');

    await expect(page.getByTestId('session-expired-message')).toBeVisible();
    await expect(page.getByText(/session expired/i)).toBeVisible();
  });

  test('shows link expired error message', async ({ page }) => {
    await page.goto('/login?error=expired');

    await expect(page.getByText(/link expired/i)).toBeVisible();
  });
});
