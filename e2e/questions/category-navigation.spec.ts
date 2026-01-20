/**
 * Category Navigation E2E Tests
 *
 * Story 13.3: Category Navigation for Questions
 * Tests category tabs functionality including:
 * - Tab display and interaction
 * - URL state management
 * - Filter combinations (category + status)
 * - Layout switching (grouped vs flat)
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

let mahoContext: BrowserContext;
let mahoPage: Page;

test.beforeAll(async ({ browser }) => {
  mahoContext = await browser.newContext({
    storageState: STORAGE_STATE.maho,
  });
  mahoPage = await mahoContext.newPage();
});

test.afterAll(async () => {
  await mahoContext.close();
});

test.describe('Category Navigation', () => {
  test.beforeEach(async () => {
    // Start fresh on questions page
    await mahoPage.goto('/questions');
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();
  });

  test('displays category tabs above status filter (AC #1)', async () => {
    // Category tabs should be visible
    await expect(mahoPage.getByTestId('category-tabs')).toBeVisible();

    // All four tabs should be present
    await expect(mahoPage.getByTestId('category-tab-all')).toBeVisible();
    await expect(mahoPage.getByTestId('category-tab-market')).toBeVisible();
    await expect(mahoPage.getByTestId('category-tab-product')).toBeVisible();
    await expect(mahoPage.getByTestId('category-tab-distribution')).toBeVisible();

    // Status filter should also be visible (below category tabs)
    await expect(mahoPage.getByTestId('status-filter')).toBeVisible();
  });

  test('clicking category tab updates URL (AC #2)', async () => {
    // Click market tab
    await mahoPage.getByTestId('category-tab-market').click();

    // URL should include category parameter
    await expect(mahoPage).toHaveURL(/\?category=market/);

    // Tab should be active
    await expect(mahoPage.getByTestId('category-tab-market')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('category and status filters combine (AC #3)', async () => {
    // Select market category
    await mahoPage.getByTestId('category-tab-market').click();
    await expect(mahoPage).toHaveURL(/category=market/);

    // Select draft status
    await mahoPage.getByTestId('status-filter-draft').click();
    await expect(mahoPage).toHaveURL(/status=draft/);

    // Both should be in URL
    const url = mahoPage.url();
    expect(url).toContain('category=market');
    expect(url).toContain('status=draft');
  });

  test('"All Categories" clears category from URL', async () => {
    // First set a category
    await mahoPage.getByTestId('category-tab-distribution').click();
    await expect(mahoPage).toHaveURL(/category=distribution/);

    // Click "All Categories"
    await mahoPage.getByTestId('category-tab-all').click();

    // Category should be removed from URL (clean URL)
    await expect(mahoPage).not.toHaveURL(/category=/);
  });

  test('URL state persists on refresh (AC #6)', async () => {
    // Set category and status
    await mahoPage.getByTestId('category-tab-product').click();
    await expect(mahoPage).toHaveURL(/category=product/);

    await mahoPage.getByTestId('status-filter-sent').click();
    await expect(mahoPage).toHaveURL(/status=sent/);

    // Verify both params are in URL
    const urlBefore = mahoPage.url();
    expect(urlBefore).toContain('category=product');
    expect(urlBefore).toContain('status=sent');

    // Refresh page
    await mahoPage.reload();
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();

    // Tabs should still have correct active state
    await expect(mahoPage.getByTestId('category-tab-product')).toHaveAttribute(
      'data-state',
      'active'
    );
    await expect(mahoPage.getByTestId('status-filter-sent')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('direct URL navigation works', async () => {
    // Navigate directly with query params
    await mahoPage.goto('/questions?category=distribution&status=draft');
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();

    // Correct tabs should be active
    await expect(mahoPage.getByTestId('category-tab-distribution')).toHaveAttribute(
      'data-state',
      'active'
    );
    await expect(mahoPage.getByTestId('status-filter-draft')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('tabs display counts for each category', async () => {
    // Each tab should display a count in parentheses
    const allTab = mahoPage.getByTestId('category-tab-all');
    const marketTab = mahoPage.getByTestId('category-tab-market');
    const productTab = mahoPage.getByTestId('category-tab-product');
    const distributionTab = mahoPage.getByTestId('category-tab-distribution');

    // All tabs should have counts (format: "(N)")
    await expect(allTab).toContainText(/\(\d+\)/);
    await expect(marketTab).toContainText(/\(\d+\)/);
    await expect(productTab).toContainText(/\(\d+\)/);
    await expect(distributionTab).toContainText(/\(\d+\)/);
  });

  test('tabs are keyboard accessible', async () => {
    // Focus on category tabs
    await mahoPage.getByTestId('category-tab-all').focus();

    // Should be able to navigate with arrow keys
    await mahoPage.keyboard.press('ArrowRight');
    await expect(mahoPage.getByTestId('category-tab-market')).toBeFocused();

    // Press Enter to select
    await mahoPage.keyboard.press('Enter');
    await expect(mahoPage).toHaveURL(/category=market/);
  });

  test('invalid category in URL defaults to all', async () => {
    // Navigate with invalid category
    await mahoPage.goto('/questions?category=invalid');
    await expect(mahoPage.getByTestId('questions-page')).toBeVisible();

    // "All Categories" tab should be active
    await expect(mahoPage.getByTestId('category-tab-all')).toHaveAttribute(
      'data-state',
      'active'
    );

    // URL should be cleaned up (invalid param ignored)
    // Note: The validation happens in the component, so the URL might still show the invalid param
    // but the UI should default to 'all'
  });
});
