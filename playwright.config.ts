import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Projects:
 * - setup: Authenticates and saves session state (runs first)
 * - chromium: Desktop Chrome with auth
 * - ipad: iPad Pro with auth
 * - chromium-no-auth: Desktop Chrome without auth (for redirect tests)
 * - isolated: Tests that must run last (logout tests that affect auth state)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export const playwrightConfig = defineConfig({
  testDir: './e2e',
  // Disable full parallelism to prevent test interference
  // Tests modifying auth state (logout) can affect other tests in parallel
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // ─────────────────────────────────────────────────────────────────
    // Setup project - runs first to authenticate
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // ─────────────────────────────────────────────────────────────────
    // Authenticated projects (depend on setup)
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.unauth\.spec\.ts/, /.*\.isolated\.spec\.ts/],
    },
    // iPad target for Kel's primary device
    {
      name: 'ipad',
      use: {
        ...devices['iPad Pro 11'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.unauth\.spec\.ts/, /.*\.isolated\.spec\.ts/],
    },

    // ─────────────────────────────────────────────────────────────────
    // Unauthenticated project (for testing redirects, login flow)
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'chromium-no-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.unauth\.spec\.ts/,
    },

    // ─────────────────────────────────────────────────────────────────
    // Isolated project - runs LAST after all other tests
    // Used for tests that affect auth state (logout tests)
    // Note: Only depends on 'chromium' to avoid requiring WebKit in CI
    // ─────────────────────────────────────────────────────────────────
    {
      name: 'isolated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.isolated\.spec\.ts/,
      dependencies: ['chromium'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

// Note: Playwright config requires export default
export default playwrightConfig;
