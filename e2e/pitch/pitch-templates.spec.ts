/**
 * Pitch Template Library E2E Tests
 *
 * Tests for Story 18-4: Pitch Template Library
 *
 * - AC1: Template selection in CreatePitchDialog
 * - AC2: Template filtering in pitch list
 * - AC3: Template badge display on pitch cards
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
// AC1: Template Selection in CreatePitchDialog
// =============================================================================
test.describe('Pitch Templates - Template Selection (AC1)', () => {
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

  test('create dialog shows template selection options', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Open create dialog
    await mahoPage.getByTestId('create-pitch-button').click();

    // Verify dialog is visible
    const titleInput = mahoPage.getByTestId('pitch-title-input');
    await expect(titleInput).toBeVisible({ timeout: 5000 });

    // Verify template selection is visible
    const templateSelect = mahoPage.getByTestId('pitch-template-select');
    await expect(templateSelect).toBeVisible();

    // Verify all template options are present
    await expect(mahoPage.getByTestId('template-option-none')).toBeVisible();
    await expect(mahoPage.getByTestId('template-option-mid_size')).toBeVisible();
    await expect(mahoPage.getByTestId('template-option-regional')).toBeVisible();
    await expect(mahoPage.getByTestId('template-option-wofex_booth')).toBeVisible();

    // Close dialog
    await mahoPage.keyboard.press('Escape');
  });

  test('can create pitch with custom (no template) selection', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Open create dialog
    await mahoPage.getByTestId('create-pitch-button').click();

    // Fill in title
    const titleInput = mahoPage.getByTestId('pitch-title-input');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test - Custom Pitch');

    // Custom (none) should be selected by default
    const customOption = mahoPage.getByTestId('template-option-none');
    await expect(customOption).toHaveAttribute('data-state', 'checked');

    // Submit
    await mahoPage.getByTestId('create-pitch-submit').click();

    // Wait for dialog to close
    await expect(titleInput).not.toBeVisible({ timeout: 5000 });

    // Verify pitch was created (should appear in list)
    const newPitch = mahoPage.getByTestId('pitch-draft-card').filter({ hasText: 'E2E Test - Custom Pitch' });
    await expect(newPitch).toBeVisible({ timeout: 5000 });
  });

  test('can create pitch with mid-size distributor template', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Open create dialog
    await mahoPage.getByTestId('create-pitch-button').click();

    // Fill in title
    const titleInput = mahoPage.getByTestId('pitch-title-input');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test - Mid-Size Pitch');

    // Select mid-size template
    await mahoPage.getByTestId('template-option-mid_size').click();

    // Verify selection
    const midSizeOption = mahoPage.getByTestId('template-option-mid_size');
    await expect(midSizeOption).toHaveAttribute('data-state', 'checked');

    // Submit
    await mahoPage.getByTestId('create-pitch-submit').click();

    // Wait for dialog to close
    await expect(titleInput).not.toBeVisible({ timeout: 5000 });

    // Verify pitch was created with correct template label
    const newPitch = mahoPage.getByTestId('pitch-draft-card').filter({ hasText: 'E2E Test - Mid-Size Pitch' });
    await expect(newPitch).toBeVisible({ timeout: 5000 });

    // Should show template type
    await expect(newPitch.getByText('Mid-Size Distributor')).toBeVisible();
  });

  test('can create pitch with regional distributor template', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Open create dialog
    await mahoPage.getByTestId('create-pitch-button').click();

    // Fill in title
    const titleInput = mahoPage.getByTestId('pitch-title-input');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test - Regional Pitch');

    // Select regional template
    await mahoPage.getByTestId('template-option-regional').click();

    // Submit
    await mahoPage.getByTestId('create-pitch-submit').click();

    // Wait for dialog to close
    await expect(titleInput).not.toBeVisible({ timeout: 5000 });

    // Verify pitch was created with correct template label
    const newPitch = mahoPage.getByTestId('pitch-draft-card').filter({ hasText: 'E2E Test - Regional Pitch' });
    await expect(newPitch).toBeVisible({ timeout: 5000 });

    // Should show template type
    await expect(newPitch.getByText('Regional Distributor')).toBeVisible();
  });

  test('can create pitch with WOFEX booth template', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Open create dialog
    await mahoPage.getByTestId('create-pitch-button').click();

    // Fill in title
    const titleInput = mahoPage.getByTestId('pitch-title-input');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('E2E Test - WOFEX Pitch');

    // Select WOFEX template
    await mahoPage.getByTestId('template-option-wofex_booth').click();

    // Submit
    await mahoPage.getByTestId('create-pitch-submit').click();

    // Wait for dialog to close
    await expect(titleInput).not.toBeVisible({ timeout: 5000 });

    // Verify pitch was created with correct template label
    const newPitch = mahoPage.getByTestId('pitch-draft-card').filter({ hasText: 'E2E Test - WOFEX Pitch' });
    await expect(newPitch).toBeVisible({ timeout: 5000 });

    // Should show template type
    await expect(newPitch.getByText('WOFEX Booth Pitch')).toBeVisible();
  });
});

// =============================================================================
// AC2: Template Filtering in Pitch List
// =============================================================================
test.describe('Pitch Templates - Template Filtering (AC2)', () => {
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

  test('template filter is visible when drafts exist', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Check if drafts exist
    const draftCard = mahoPage.getByTestId('pitch-draft-card').first();
    const draftsExist = await draftCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (draftsExist) {
      // Filter should be visible
      const templateFilter = mahoPage.getByTestId('template-filter');
      await expect(templateFilter).toBeVisible();

      // All filter buttons should be present
      await expect(mahoPage.getByTestId('filter-all')).toBeVisible();
      await expect(mahoPage.getByTestId('filter-custom')).toBeVisible();
      await expect(mahoPage.getByTestId('filter-mid_size')).toBeVisible();
      await expect(mahoPage.getByTestId('filter-regional')).toBeVisible();
      await expect(mahoPage.getByTestId('filter-wofex_booth')).toBeVisible();
    }
    // If no drafts, filter won't show - that's expected
  });

  test('clicking filter buttons filters the pitch list', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Check if drafts exist
    const draftCards = mahoPage.getByTestId('pitch-draft-card');
    const draftsExist = await draftCards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!draftsExist) {
      test.skip();
      return;
    }

    // Count initial drafts
    const initialCount = await draftCards.count();

    // Click custom filter and wait for active state
    const customButton = mahoPage.getByTestId('filter-custom');
    await customButton.click();
    await expect(customButton).toHaveClass(/bg-secondary/);

    // Count should be <= initial (filtering applied)
    const customCount = await draftCards.count();
    expect(customCount).toBeLessThanOrEqual(initialCount);

    // Click "All" to reset and wait for active state
    const allButton = mahoPage.getByTestId('filter-all');
    await allButton.click();
    await expect(allButton).toHaveClass(/bg-secondary/);

    // Count should be back to initial
    const allCount = await draftCards.count();
    expect(allCount).toBe(initialCount);
  });

  test('filtering persists visual active state', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Check if drafts exist
    const draftCard = mahoPage.getByTestId('pitch-draft-card').first();
    const draftsExist = await draftCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!draftsExist) {
      test.skip();
      return;
    }

    // Click mid_size filter
    const midSizeButton = mahoPage.getByTestId('filter-mid_size');
    await midSizeButton.click();

    // Button should have active styling (secondary variant)
    await expect(midSizeButton).toHaveClass(/bg-secondary/);

    // All button should not have active styling
    const allButton = mahoPage.getByTestId('filter-all');
    await expect(allButton).not.toHaveClass(/bg-secondary/);

    // Click All to reset
    await allButton.click();
    await expect(allButton).toHaveClass(/bg-secondary/);
    await expect(midSizeButton).not.toHaveClass(/bg-secondary/);
  });

  test('empty filter state shows clear filter option', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Check if drafts exist
    const draftCards = mahoPage.getByTestId('pitch-draft-card');
    const draftsExist = await draftCards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!draftsExist) {
      test.skip();
      return;
    }

    // Try each filter until we find one with no results
    const filters = ['filter-mid_size', 'filter-regional', 'filter-wofex_booth', 'filter-custom'];

    for (const filter of filters) {
      const filterButton = mahoPage.getByTestId(filter);
      await filterButton.click();
      await expect(filterButton).toHaveClass(/bg-secondary/);

      const filteredCount = await draftCards.count();

      if (filteredCount === 0) {
        // Should show "No drafts match" message with clear filter option
        const emptyMessage = mahoPage.getByText('No drafts match the selected filter');
        const clearButton = mahoPage.getByRole('button', { name: 'Clear filter' });

        await expect(emptyMessage).toBeVisible();
        await expect(clearButton).toBeVisible();

        // Click clear filter and wait for All to be active
        await clearButton.click();
        await expect(mahoPage.getByTestId('filter-all')).toHaveClass(/bg-secondary/);
        break;
      }
    }

    // Reset filter state
    await mahoPage.getByTestId('filter-all').click();
  });
});

// =============================================================================
// AC3: Template Badge Display on Pitch Cards
// =============================================================================
test.describe('Pitch Templates - Template Badge Display (AC3)', () => {
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

  test('pitch cards show template type in description', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Check if drafts exist
    const draftCards = mahoPage.getByTestId('pitch-draft-card');
    const draftsExist = await draftCards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!draftsExist) {
      test.skip();
      return;
    }

    // Filter to mid-size to find a template pitch
    const midSizeButton = mahoPage.getByTestId('filter-mid_size');
    await midSizeButton.click();
    await expect(midSizeButton).toHaveClass(/bg-secondary/);

    const midSizeCards = await draftCards.count();
    if (midSizeCards > 0) {
      // First card should show "Mid-Size Distributor" template label
      const firstCard = draftCards.first();
      await expect(firstCard.getByText('Mid-Size Distributor')).toBeVisible();
    }

    // Check regional
    const regionalButton = mahoPage.getByTestId('filter-regional');
    await regionalButton.click();
    await expect(regionalButton).toHaveClass(/bg-secondary/);

    const regionalCards = await draftCards.count();
    if (regionalCards > 0) {
      const firstCard = draftCards.first();
      await expect(firstCard.getByText('Regional Distributor')).toBeVisible();
    }

    // Check WOFEX
    const wofexButton = mahoPage.getByTestId('filter-wofex_booth');
    await wofexButton.click();
    await expect(wofexButton).toHaveClass(/bg-secondary/);

    const wofexCards = await draftCards.count();
    if (wofexCards > 0) {
      const firstCard = draftCards.first();
      await expect(firstCard.getByText('WOFEX Booth Pitch')).toBeVisible();
    }

    // Reset
    await mahoPage.getByTestId('filter-all').click();
  });

  test('custom pitches do not show template description', async () => {
    await mahoPage.goto('/market-intelligence/pitch');
    await mahoPage.waitForLoadState('networkidle');

    // Check if drafts exist
    const draftCards = mahoPage.getByTestId('pitch-draft-card');
    const draftsExist = await draftCards.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!draftsExist) {
      test.skip();
      return;
    }

    // Filter to custom
    const customButton = mahoPage.getByTestId('filter-custom');
    await customButton.click();
    await expect(customButton).toHaveClass(/bg-secondary/);

    const customCards = await draftCards.count();
    if (customCards > 0) {
      const firstCard = draftCards.first();

      // Should NOT show any template type label
      await expect(firstCard.getByText('Mid-Size Distributor')).not.toBeVisible();
      await expect(firstCard.getByText('Regional Distributor')).not.toBeVisible();
      await expect(firstCard.getByText('WOFEX Booth Pitch')).not.toBeVisible();
    }

    // Reset
    await mahoPage.getByTestId('filter-all').click();
  });
});
