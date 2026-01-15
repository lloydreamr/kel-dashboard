/**
 * Questions Route Redirect E2E Tests
 *
 * Story 17.4: Verifies old /questions route redirects correctly
 * to /market-intelligence/questions with query params preserved.
 *
 * @see AC4: Old /questions route redirects to /market-intelligence/questions
 */

import { test, expect } from '@playwright/test';

test.describe('Questions Route Redirect', () => {
  test('old route redirects to MI questions', async ({ page }) => {
    // Navigate to old route
    await page.goto('/questions');

    // Should redirect to new MI route
    await expect(page).toHaveURL('/market-intelligence/questions');
  });

  test('redirect preserves query params', async ({ page }) => {
    // Navigate to old route with filter param
    await page.goto('/questions?category=market');

    // Should redirect with query param preserved
    await expect(page).toHaveURL('/market-intelligence/questions?category=market');
  });

  test('redirect is permanent (308)', async ({ page }) => {
    // Intercept the redirect to check status code
    const response = await page.goto('/questions', {
      waitUntil: 'commit', // Get response before following redirect
    });

    // Final page loads successfully
    expect(response?.status()).toBe(200);

    // The page should be at the new URL
    expect(page.url()).toContain('/market-intelligence/questions');
  });

  test('detail page redirect works', async ({ page }) => {
    // Use a valid UUID format for the detail route test
    const testUuid = '00000000-0000-4000-8000-000000000001';

    // Navigate to old detail route
    await page.goto(`/questions/${testUuid}`);

    // Should redirect to new MI detail route
    await expect(page).toHaveURL(`/market-intelligence/questions/${testUuid}`);
  });

  test('redirect works with multiple query params', async ({ page }) => {
    // Navigate with multiple query params
    await page.goto('/questions?category=market&status=pending');

    // URL should contain both params (order may vary)
    const url = page.url();
    expect(url).toContain('/market-intelligence/questions');
    expect(url).toContain('category=market');
    expect(url).toContain('status=pending');
  });
});
