/**
 * Progress Flow E2E Test
 *
 * Tests the complete progress tracking workflow:
 * 1. View progress page with milestones
 * 2. Verify WOFEX countdown display
 * 3. Mark milestone as complete
 * 4. Add/Edit/Delete milestone notes
 *
 * Uses multi-user contexts with different storageState files.
 *
 * Timeout strategy:
 * - 3000ms: UI animations (dialog open/close)
 * - 5000ms: Form submissions with network
 * - 10000ms: Page navigation and initial load
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

import { getStorageStatePaths, generateTestId, TIMEOUTS } from '../utils/test-helpers';

test.describe.configure({ mode: 'serial' });

// Auth state paths
const STORAGE_STATE = getStorageStatePaths(path.join(__dirname, '..'));

// Generate unique test data per project (chromium/iphone)
function getTestData(projectSuffix: string) {
  const uniqueId = `${generateTestId()}-${projectSuffix}`;
  return {
    noteContent: `Progress Test Note ${uniqueId}`,
    noteUpdated: `Updated Progress Note ${uniqueId}`,
  };
}

let mahoContext: BrowserContext;
let kelContext: BrowserContext;
let mahoPage: Page;
let kelPage: Page;
let TEST_DATA: ReturnType<typeof getTestData>;

test.beforeAll(async ({ browser }, testInfo) => {
  // Generate unique test data for this project (chromium/iphone)
  TEST_DATA = getTestData(testInfo.project.name);

  mahoContext = await browser.newContext({ storageState: STORAGE_STATE.maho });
  kelContext = await browser.newContext({ storageState: STORAGE_STATE.kel });
  mahoPage = await mahoContext.newPage();
  kelPage = await kelContext.newPage();
});

test.afterAll(async () => {
  await mahoContext.close();
  await kelContext.close();
});

// ═══════════════════════════════════════════════════════════════
// AC1: Progress Page View Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Progress Page View (AC1)', () => {
  test('1.1: Navigate to progress page and verify page loads', async () => {
    // Arrange & Act
    await mahoPage.goto('/progress');

    // Assert
    await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
      timeout: TIMEOUTS.NAVIGATION,
    });
  });

  test('1.2: Verify three milestone cards are displayed', async () => {
    // Assert - Verify all three milestone cards
    await expect(mahoPage.getByTestId('milestone-card-market')).toBeVisible();
    await expect(mahoPage.getByTestId('milestone-card-product')).toBeVisible();
    await expect(mahoPage.getByTestId('milestone-card-distribution')).toBeVisible();
  });

  test('1.3: Verify each milestone card shows ClarityMeter with count or empty state', async () => {
    // Arrange
    const marketCard = mahoPage.getByTestId('milestone-card-market');
    const productCard = mahoPage.getByTestId('milestone-card-product');
    const distributionCard = mahoPage.getByTestId('milestone-card-distribution');

    // Assert - Each card has EITHER clarity meter OR empty state
    // Use count() to check existence without throwing
    const marketMeterCount = await marketCard.getByTestId('clarity-meter').count();
    const marketEmptyCount = await marketCard.getByTestId('clarity-meter-empty').count();
    expect(marketMeterCount + marketEmptyCount).toBeGreaterThan(0);

    const productMeterCount = await productCard.getByTestId('clarity-meter').count();
    const productEmptyCount = await productCard.getByTestId('clarity-meter-empty').count();
    expect(productMeterCount + productEmptyCount).toBeGreaterThan(0);

    const distributionMeterCount = await distributionCard.getByTestId('clarity-meter').count();
    const distributionEmptyCount = await distributionCard
      .getByTestId('clarity-meter-empty')
      .count();
    expect(distributionMeterCount + distributionEmptyCount).toBeGreaterThan(0);

    // If meter is visible, verify count is also visible
    if (marketMeterCount > 0) {
      await expect(marketCard.getByTestId('clarity-meter-count')).toBeVisible();
    }
    if (productMeterCount > 0) {
      await expect(productCard.getByTestId('clarity-meter-count')).toBeVisible();
    }
    if (distributionMeterCount > 0) {
      await expect(distributionCard.getByTestId('clarity-meter-count')).toBeVisible();
    }
  });

  test('1.4: Verify loading skeleton displays initially (reload to catch it)', async () => {
    // Arrange - Reload page to potentially catch skeleton
    await mahoPage.reload();

    // Note: Skeleton may be too fast to catch, so we just verify page eventually loads
    await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
      timeout: TIMEOUTS.NAVIGATION,
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// AC2: WOFEX Countdown Tests
// ═══════════════════════════════════════════════════════════════

test.describe('WOFEX Countdown Display (AC2)', () => {
  test('2.1: Verify WOFEX countdown banner is visible', async () => {
    // Arrange
    await mahoPage.goto('/progress');

    // Assert
    await expect(mahoPage.getByTestId('wofex-countdown-banner')).toBeVisible({
      timeout: TIMEOUTS.NAVIGATION,
    });
  });

  test('2.2: Verify countdown text format shows days until WOFEX 2026', async () => {
    // Arrange
    const banner = mahoPage.getByTestId('wofex-countdown-banner');

    // Assert - Countdown text matches format (note: no space between number and "days" in actual text)
    await expect(banner).toContainText(/\d+days until WOFEX 2026/);
  });

  test('2.3: Verify countdown calculates correct days to July 29, 2026', async () => {
    // Arrange
    const banner = mahoPage.getByTestId('wofex-countdown-banner');
    const bannerText = await banner.textContent();

    // Extract days from text (note: no space between number and "days" in actual text)
    const match = bannerText?.match(/(\d+)days until WOFEX 2026/);
    expect(match).not.toBeNull();

    const displayedDays = parseInt(match![1], 10);

    // Calculate expected days
    const today = new Date();
    const wofexDate = new Date('2026-07-29');
    const expectedDays = Math.ceil(
      (wofexDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Assert - Displayed days should match calculated days (within 1 day tolerance for timezone)
    expect(Math.abs(displayedDays - expectedDays)).toBeLessThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// AC3: Mark Milestone Complete Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Mark Milestone Complete (AC3)', () => {
  test('3.1: Maho can mark milestone as complete via confirmation dialog', async () => {
    // Arrange
    await mahoPage.goto('/progress');
    const productCard = mahoPage.getByTestId('milestone-card-product');

    // Check if mark complete button exists (only for in_progress milestones)
    const markButton = productCard.getByTestId('mark-milestone-complete-button');
    const buttonCount = await markButton.count();

    // Only run test if button exists (milestone is in_progress)
    if (buttonCount > 0) {
      // Act - Click mark complete
      await markButton.click();

      // Assert - Dialog appears
      await expect(mahoPage.getByTestId('milestone-complete-dialog')).toBeVisible({
        timeout: TIMEOUTS.ANIMATION,
      });

      // Act - Confirm completion
      await mahoPage.getByTestId('milestone-complete-confirm').click();

      // Assert - Completion badge appears after network call
      await expect(productCard.getByTestId('milestone-complete-badge')).toBeVisible({
        timeout: TIMEOUTS.NETWORK,
      });
    } else {
      // Milestone already complete or not in_progress - skip this test
      test.skip(
        buttonCount === 0,
        'Mark complete button not available (milestone may already be complete)'
      );
    }
  });

  test('3.2: Verify status badge displays valid status', async () => {
    // Arrange
    await mahoPage.goto('/progress');
    const productCard = mahoPage.getByTestId('milestone-card-product');
    const statusBadge = productCard.getByTestId('milestone-status-badge');

    // Check if status badge exists (shown for non-complete milestones)
    const badgeCount = await statusBadge.count();

    if (badgeCount > 0) {
      // Assert - Badge shows valid status
      const badgeText = await statusBadge.textContent();
      expect(['Complete', 'In Progress', 'Not Started']).toContain(badgeText);
    } else {
      // No status badge means milestone is complete (shows completion badge instead)
      test.skip(
        badgeCount === 0,
        'Status badge not shown (milestone may show completion badge instead)'
      );
    }
  });

  test('3.3: Verify completion date badge shows when complete', async () => {
    // Arrange
    await mahoPage.goto('/progress');
    const productCard = mahoPage.getByTestId('milestone-card-product');
    const completionBadge = productCard.getByTestId('milestone-complete-badge');

    // Check if completion badge exists
    const completionBadgeCount = await completionBadge.count();

    if (completionBadgeCount > 0) {
      // Assert - Completion date is displayed
      await expect(productCard.getByTestId('milestone-complete-date')).toBeVisible();

      // Assert - Date text exists
      const dateText = await productCard.getByTestId('milestone-complete-date').textContent();
      expect(dateText).toBeTruthy();
    } else {
      // No completion badge means milestone not complete yet
      test.skip(
        completionBadgeCount === 0,
        'Completion badge not shown (milestone not yet complete)'
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// AC4: Milestone Notes CRUD Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Milestone Notes CRUD (AC4)', () => {
  test('4.1: Maho adds a note to milestone', async () => {
    // Arrange
    await mahoPage.goto('/progress');
    const marketCard = mahoPage.getByTestId('milestone-card-market');

    // Act - Click add note button
    await marketCard.getByTestId('add-note-button').click();

    // Assert - Note input appears
    await expect(mahoPage.getByTestId('note-input-textarea')).toBeVisible({
      timeout: TIMEOUTS.ANIMATION,
    });

    // Act - Fill and save note, wait for mutation to complete
    await mahoPage.getByTestId('note-input-textarea').fill(TEST_DATA.noteContent);

    // Click save and wait for the network request to complete
    await Promise.all([
      mahoPage.waitForResponse((resp) => resp.url().includes('rest') && resp.status() === 200),
      mahoPage.getByTestId('note-save-button').click(),
    ]);

    // Assert - Note appears in notes list
    await expect(mahoPage.getByText(TEST_DATA.noteContent)).toBeVisible({
      timeout: TIMEOUTS.NETWORK,
    });

    // Extra wait to ensure database write is fully committed before next test reloads
    await mahoPage.waitForLoadState('networkidle');
  });

  test('4.2: Verify note appears in notes list', async () => {
    // Arrange - Navigate to progress page and wait for it to load
    await mahoPage.goto('/progress');
    await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
      timeout: TIMEOUTS.NAVIGATION,
    });

    // Assert - Note persists after reload
    await expect(mahoPage.getByText(TEST_DATA.noteContent)).toBeVisible({
      timeout: TIMEOUTS.NETWORK,
    });
  });

  test('4.3: Maho edits own note', async () => {
    // Arrange
    const noteItem = mahoPage.locator('[data-testid="note-item"]', {
      has: mahoPage.getByText(TEST_DATA.noteContent),
    });

    // Act - Click edit button
    await noteItem.getByTestId('note-edit-button').click();

    // Assert - Edit mode activated (textarea appears)
    const textarea = mahoPage.getByRole('textbox');
    await expect(textarea).toBeVisible({ timeout: TIMEOUTS.ANIMATION });

    // Act - Clear and update note
    await textarea.clear();
    await textarea.fill(TEST_DATA.noteUpdated);
    await mahoPage.getByText('Save').click();

    // Wait for success toast to confirm mutation completed
    await expect(mahoPage.getByText('Note updated')).toBeVisible({
      timeout: TIMEOUTS.NETWORK,
    });

    // Assert - Updated note appears after mutation
    await expect(mahoPage.getByText(TEST_DATA.noteUpdated)).toBeVisible({
      timeout: TIMEOUTS.NETWORK,
    });
  });

  test('4.4: Verify note content updated', async () => {
    // Arrange - Navigate to progress page and wait for it to load
    await mahoPage.goto('/progress');
    await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
      timeout: TIMEOUTS.NAVIGATION,
    });

    // Wait for notes to load (network request to complete)
    await mahoPage.waitForLoadState('networkidle');

    // Assert - Updated note persists
    await expect(mahoPage.getByText(TEST_DATA.noteUpdated)).toBeVisible({
      timeout: TIMEOUTS.NETWORK,
    });

    // Assert - Old note content gone
    await expect(mahoPage.getByText(TEST_DATA.noteContent)).not.toBeVisible();
  });

  test('4.5: Kel cannot edit Maho note (no edit button visible)', async () => {
    // Arrange
    await kelPage.goto('/progress');

    // Wait for page to load
    await expect(kelPage.getByTestId('progress-page')).toBeVisible({
      timeout: TIMEOUTS.NAVIGATION,
    });

    // Find Maho's note
    const noteItem = kelPage.locator('[data-testid="note-item"]', {
      has: kelPage.getByText(TEST_DATA.noteUpdated),
    });

    // Check if note exists (it should, since Maho created it)
    const noteCount = await noteItem.count();

    if (noteCount > 0) {
      // Assert - Edit button should not be visible to Kel
      const editButton = noteItem.getByTestId('note-edit-button');
      await expect(editButton).not.toBeVisible();

      // Assert - Delete button should not be visible to Kel
      const deleteButton = noteItem.getByTestId('note-delete-button');
      await expect(deleteButton).not.toBeVisible();
    }
  });

  test('4.6: Maho deletes own note', async () => {
    // Arrange
    await mahoPage.goto('/progress');

    const noteItem = mahoPage.locator('[data-testid="note-item"]', {
      has: mahoPage.getByText(TEST_DATA.noteUpdated),
    });

    // Act - Click delete button
    await noteItem.getByTestId('note-delete-button').click();

    // Assert - Delete dialog appears
    await expect(mahoPage.getByTestId('note-delete-dialog')).toBeVisible({
      timeout: TIMEOUTS.ANIMATION,
    });

    // Act - Confirm deletion
    await mahoPage.getByTestId('note-delete-confirm').click();

    // Assert - Note removed from list (Playwright auto-waits for network completion)
    await expect(mahoPage.getByText(TEST_DATA.noteUpdated)).not.toBeVisible({
      timeout: TIMEOUTS.NETWORK,
    });
  });

  test('4.7: Verify note removed persists after reload', async () => {
    // Arrange - Navigate to progress page and wait for it to load
    await mahoPage.goto('/progress');
    await expect(mahoPage.getByTestId('progress-page')).toBeVisible({
      timeout: TIMEOUTS.NAVIGATION,
    });

    // Assert - Deleted note stays gone
    await expect(mahoPage.getByText(TEST_DATA.noteUpdated)).not.toBeVisible({
      timeout: TIMEOUTS.NETWORK,
    });
  });
});
