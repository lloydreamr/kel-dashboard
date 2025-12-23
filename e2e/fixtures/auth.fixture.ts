/**
 * Authentication fixture for Playwright E2E tests.
 *
 * Provides an `authenticatedTest` that uses stored session state.
 * This avoids logging in for every test, improving speed and reliability.
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures/auth.fixture';
 *
 * test('authenticated user sees dashboard', async ({ page }) => {
 *   await page.goto('/');
 *   await expect(page.getByTestId('dashboard-page')).toBeVisible();
 * });
 * ```
 */
import { test as base, expect } from '@playwright/test';
import path from 'path';

/**
 * Path to stored auth state file.
 * Created by auth.setup.ts before tests run.
 */
export const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

/**
 * Extended test fixture that uses authenticated session state.
 * Tests using this fixture will have access to protected routes.
 */
export const test = base.extend<object, { workerStorageState: string }>({
  // Use the worker-scoped storage state for all tests
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Storage state is shared across all tests in a worker
  workerStorageState: [
    async ({}, use) => {
      // Simply use the auth file created by setup
      await use(AUTH_FILE);
    },
    { scope: 'worker' },
  ],
});

export { expect };
