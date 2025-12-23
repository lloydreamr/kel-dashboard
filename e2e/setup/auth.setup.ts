/**
 * Authentication setup for Playwright E2E tests.
 *
 * This runs BEFORE all other tests to:
 * 1. Authenticate test users (Maho and Kel)
 * 2. Save session states to e2e/.auth/maho.json and e2e/.auth/kel.json
 *
 * Supports two modes:
 * - PLAYWRIGHT_TEST_MODE=true: Uses mock auth API (for CI)
 * - Default: Uses real magic link flow (for local dev)
 *
 * Multi-user testing:
 * - Tests can use different auth states via test.use({ storageState })
 * - Maho role: Full access (create, edit, manage questions)
 * - Kel role: Limited access (view, decide on questions)
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
  // Legacy path for backwards compatibility
  user: path.join(__dirname, '../.auth/user.json'),
};

/**
 * Setup authentication for a specific role
 */
async function authenticateAs(
  page: import('@playwright/test').Page,
  role: 'maho' | 'kel',
  authFile: string
) {
  const isTestMode = process.env.PLAYWRIGHT_TEST_MODE === 'true';

  if (isTestMode) {
    // Mock auth: Use test API with role parameter
    await page.goto(`/api/test/mock-login?role=${role}`);

    // Verify we're authenticated by checking redirect to dashboard
    await expect(page.getByTestId('dashboard-page')).toBeVisible({
      timeout: 10000,
    });
  } else {
    // Real auth flow - uses actual test accounts
    // Note: These emails must match TEST_USERS in mock-login/route.ts
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill(`${role}@test.kel-dashboard.local`);
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-success')).toBeVisible({
      timeout: 10000,
    });

    console.log(
      `\n⚠️  Real auth mode for ${role}: Click the magic link in your email\n`
    );

    await expect(page.getByTestId('dashboard-page')).toBeVisible({
      timeout: 60000,
    });
  }

  // Save signed-in state to file
  await page.context().storageState({ path: authFile });
}

/**
 * Setup Maho authentication
 * Maho is the primary user who creates and manages questions
 */
setup('authenticate as maho', async ({ page }) => {
  await authenticateAs(page, 'maho', STORAGE_STATE.maho);
});

/**
 * Setup Kel authentication
 * Kel reviews questions and makes decisions
 */
setup('authenticate as kel', async ({ page }) => {
  await authenticateAs(page, 'kel', STORAGE_STATE.kel);
});

/**
 * Legacy setup for backwards compatibility
 * Uses Maho by default (matches original single-user behavior)
 *
 * IMPORTANT: We copy maho.json to user.json instead of logging in again.
 * Multiple logins for the same user can cause session conflicts with Supabase.
 */
setup('authenticate', async ({}) => {
  // Copy maho's auth state to the legacy user.json path
  // This avoids creating a duplicate session
  const fs = await import('fs/promises');
  await fs.copyFile(STORAGE_STATE.maho, STORAGE_STATE.user);
});

// Configure dependencies: role-specific auth first, then legacy copy
setup.describe.configure({ mode: 'serial' });
