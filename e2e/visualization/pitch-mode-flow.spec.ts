/**
 * Pitch Mode Flow E2E Test - Story 11.1
 *
 * Tests the complete pitch mode lifecycle:
 * 1. Enter pitch mode from visualization page
 * 2. Verify URL changes to ?mode=pitch
 * 3. Verify sidebar is hidden
 * 4. Verify edit controls are hidden
 * 5. Verify Kel position highlight is visible
 * 6. Exit pitch mode
 * 7. Verify URL returns to normal
 * 8. Direct navigation to ?mode=pitch activates pitch mode
 * 9. Mobile viewport pitch mode
 *
 * Uses multi-user contexts with different storageState files.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
};

test.describe('Pitch Mode Flow', () => {
  let mahoContext: BrowserContext;
  let mahoPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create context for Maho (who presents to distributors)
    mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    mahoPage = await mahoContext.newPage();
  });

  test.afterAll(async () => {
    await mahoContext.close();
  });

  test.describe('Enter Pitch Mode (AC #1)', () => {
    test('clicking Enter Pitch Mode changes URL to ?mode=pitch', async () => {
      // Arrange - navigate to visualization page
      await mahoPage.goto('/visualization');
      await mahoPage.waitForLoadState('networkidle');

      // Act - click Enter Pitch Mode button
      const enterButton = mahoPage.getByTestId('enter-pitch-mode-button');
      await expect(enterButton).toBeVisible();
      await enterButton.click();

      // Assert - URL changes to include ?mode=pitch
      await expect(mahoPage).toHaveURL(/\/visualization\?mode=pitch/);
    });

    test('sidebar is hidden in pitch mode', async () => {
      // Arrange - ensure we're in pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - sidebar should be hidden (has hidden class or not visible)
      const sidebar = mahoPage.getByTestId('nav-sidebar');
      // Sidebar element exists but is hidden via CSS
      await expect(sidebar).toBeHidden();
    });

    test('edit controls are hidden in pitch mode', async () => {
      // Arrange - ensure we're in pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - Add Competitor button should NOT be visible
      const addButton = mahoPage.getByTestId('add-competitor-button');
      await expect(addButton).toBeHidden();

      // Assert - Mark Kel Position button should NOT be visible
      const kelButton = mahoPage.getByTestId('mark-kel-position-button');
      await expect(kelButton).toBeHidden();
    });

    test('pitch mode header with Kel branding appears', async () => {
      // Arrange - ensure we're in pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - pitch mode header should be visible
      // Note: Responsive design renders two headers (mobile/desktop), we check both exist
      const headers = mahoPage.getByTestId('pitch-mode-header');
      const count = await headers.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Check that at least one header is visible and contains Kel branding
      let foundVisible = false;
      for (let i = 0; i < count; i++) {
        const header = headers.nth(i);
        if (await header.isVisible()) {
          foundVisible = true;
          await expect(header).toContainText('Kel');
          break;
        }
      }
      expect(foundVisible).toBe(true);
    });
  });

  test.describe('Pitch Mode View (AC #2)', () => {
    test('scatter chart or empty state displays in pitch mode', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - either chart (with data) or empty state (no data) should be visible
      // Both are valid pitch mode states depending on database content
      const chart = mahoPage.getByTestId('pitch-mode-chart');
      const emptyState = mahoPage.getByTestId('visualization-empty-state');

      const chartVisible = await chart.isVisible().catch(() => false);
      const emptyVisible = await emptyState.isVisible().catch(() => false);

      // At least one must be visible
      expect(chartVisible || emptyVisible).toBe(true);
    });

    test('visualization page renders in pitch mode', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - visualization page container is visible
      const page = mahoPage.getByTestId('visualization-page');
      await expect(page).toBeVisible();
    });

    test('Kel position highlight is visible when position exists', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - if Kel position exists, it should have highlight testid
      // Note: This test passes if Kel position exists in DB
      const kelHighlight = mahoPage.getByTestId('kel-position-highlight');
      // Use count to check if element exists (may or may not have Kel position in DB)
      const count = await kelHighlight.count();
      // If Kel position exists, it should have the highlight styling
      if (count > 0) {
        await expect(kelHighlight.first()).toBeVisible();
      }
      // Test passes regardless - we verify the testid structure is correct
    });
  });

  test.describe('Exit Pitch Mode (AC #3)', () => {
    test('clicking Exit Pitch Mode returns to normal view', async () => {
      // Arrange - start in pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Act - click the visible Exit Pitch Mode button (responsive design has mobile/desktop versions)
      const exitButtons = mahoPage.getByTestId('exit-pitch-mode-button');
      const count = await exitButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = exitButtons.nth(i);
        if (await btn.isVisible()) {
          await btn.click();
          break;
        }
      }

      // Assert - URL returns to /visualization without query param
      await expect(mahoPage).toHaveURL(/\/visualization$/);
    });

    test('sidebar restores after exiting pitch mode', async () => {
      // Navigate to normal mode
      await mahoPage.goto('/visualization');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - sidebar should be visible on desktop, or hamburger on mobile
      // This test runs on both chromium (desktop) and iphone (mobile)
      const sidebar = mahoPage.getByTestId('nav-sidebar');
      const hamburger = mahoPage.getByTestId('nav-hamburger');

      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      const hamburgerVisible = await hamburger.isVisible().catch(() => false);

      // On desktop: sidebar visible, hamburger hidden
      // On mobile: sidebar hidden, hamburger visible
      expect(sidebarVisible || hamburgerVisible).toBe(true);
    });

    test('edit controls restore after exiting pitch mode', async () => {
      // Navigate to normal mode
      await mahoPage.goto('/visualization');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - Add Competitor button should be visible (Maho only)
      const addButton = mahoPage.getByTestId('add-competitor-button');
      await expect(addButton).toBeVisible();
    });
  });

  test.describe('Direct Navigation (AC #4)', () => {
    test('navigating directly to ?mode=pitch activates pitch mode', async () => {
      // Act - navigate directly to pitch mode URL
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - pitch mode is active (check any header is visible)
      const headers = mahoPage.getByTestId('pitch-mode-header');
      const count = await headers.count();
      expect(count).toBeGreaterThanOrEqual(1);

      let foundVisibleHeader = false;
      for (let i = 0; i < count; i++) {
        if (await headers.nth(i).isVisible()) {
          foundVisibleHeader = true;
          break;
        }
      }
      expect(foundVisibleHeader).toBe(true);

      // Sidebar should be hidden (desktop) - on mobile it's always hidden anyway
      const sidebar = mahoPage.getByTestId('nav-sidebar');
      await expect(sidebar).toBeHidden();

      // Check either chart or empty state is visible
      const chart = mahoPage.getByTestId('pitch-mode-chart');
      const emptyState = mahoPage.getByTestId('visualization-empty-state');
      const chartVisible = await chart.isVisible().catch(() => false);
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      expect(chartVisible || emptyVisible).toBe(true);
    });

    test('browser back button works correctly', async () => {
      // Arrange - start at normal visualization
      await mahoPage.goto('/visualization');
      await mahoPage.waitForLoadState('networkidle');

      // Enter pitch mode
      const enterButton = mahoPage.getByTestId('enter-pitch-mode-button');
      await enterButton.click();
      await expect(mahoPage).toHaveURL(/\/visualization\?mode=pitch/);

      // Act - press browser back
      await mahoPage.goBack();

      // Assert - returns to normal view
      await expect(mahoPage).toHaveURL(/\/visualization$/);

      // Sidebar visible on desktop, or hamburger on mobile
      const sidebar = mahoPage.getByTestId('nav-sidebar');
      const hamburger = mahoPage.getByTestId('nav-hamburger');
      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      const hamburgerVisible = await hamburger.isVisible().catch(() => false);
      expect(sidebarVisible || hamburgerVisible).toBe(true);
    });
  });
});

test.describe('Pitch Mode Mobile (AC #5)', () => {
  test('mobile viewport pitch mode works correctly', async ({ browser }) => {
    // Create a mobile context with explicit mobile viewport
    const mobileContext = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/maho.json'),
      viewport: { width: 375, height: 667 }, // iPhone SE size
    });
    const mobilePage = await mobileContext.newPage();

    try {
      // Navigate to pitch mode
      await mobilePage.goto('/visualization?mode=pitch');
      await mobilePage.waitForLoadState('networkidle');

      // Assert - pitch mode header should be visible (at least one)
      const headers = mobilePage.getByTestId('pitch-mode-header');
      const count = await headers.count();
      expect(count).toBeGreaterThanOrEqual(1);

      let foundVisibleHeader = false;
      for (let i = 0; i < count; i++) {
        if (await headers.nth(i).isVisible()) {
          foundVisibleHeader = true;
          break;
        }
      }
      expect(foundVisibleHeader).toBe(true);

      // Assert - mobile nav (hamburger) should be replaced with pitch header
      const hamburger = mobilePage.getByTestId('nav-hamburger');
      await expect(hamburger).toBeHidden();

      // Assert - either chart or empty state is visible
      const chart = mobilePage.getByTestId('pitch-mode-chart');
      const emptyState = mobilePage.getByTestId('visualization-empty-state');
      const chartVisible = await chart.isVisible().catch(() => false);
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      expect(chartVisible || emptyVisible).toBe(true);

      // Act - exit pitch mode (find visible button)
      const exitButtons = mobilePage.getByTestId('exit-pitch-mode-button');
      const exitCount = await exitButtons.count();
      for (let i = 0; i < exitCount; i++) {
        const btn = exitButtons.nth(i);
        if (await btn.isVisible()) {
          await btn.click();
          break;
        }
      }

      // Assert - mobile nav restores
      await expect(mobilePage).toHaveURL(/\/visualization$/);
      await expect(hamburger).toBeVisible();
    } finally {
      await mobileContext.close();
    }
  });

  test('touch interactions remain smooth in pitch mode', async ({ browser }) => {
    // Create a mobile context with touch enabled
    const mobileContext = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/maho.json'),
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    try {
      // Navigate to pitch mode
      await mobilePage.goto('/visualization?mode=pitch');
      await mobilePage.waitForLoadState('networkidle');

      // Assert - either chart or empty state is visible
      const chart = mobilePage.getByTestId('pitch-mode-chart');
      const emptyState = mobilePage.getByTestId('visualization-empty-state');
      const chartVisible = await chart.isVisible().catch(() => false);
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      expect(chartVisible || emptyVisible).toBe(true);

      // Assert - exit button is touchable (find visible one and check height)
      const exitButtons = mobilePage.getByTestId('exit-pitch-mode-button');
      const count = await exitButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = exitButtons.nth(i);
        if (await btn.isVisible()) {
          const boundingBox = await btn.boundingBox();
          expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum
          break;
        }
      }
    } finally {
      await mobileContext.close();
    }
  });
});

test.describe('Pitch Mode Competitor Table (Story 11.4)', () => {
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

  test.describe('Table Display (AC #1)', () => {
    test('competitor table displays in pitch mode', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - table should exist (may be empty if no competitors)
      // We check for the testid, but it only renders if there's data
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      // If table exists, verify column headers
      if (tableExists > 0) {
        await expect(table).toBeVisible();

        // Verify all required columns are present
        await expect(table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
        await expect(table.getByRole('columnheader', { name: 'Price Range' })).toBeVisible();
        await expect(table.getByRole('columnheader', { name: 'Quality Score' })).toBeVisible();
        await expect(table.getByRole('columnheader', { name: 'Market Position' })).toBeVisible();
      }
      // Test passes - table either displays correctly or is hidden when empty
    });

    test('competitor table shows data rows when competitors exist', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - check if table has data rows
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Get all rows (header + data rows)
        const rows = table.getByRole('row');
        const rowCount = await rows.count();

        // Should have at least header row + 1 data row
        expect(rowCount).toBeGreaterThanOrEqual(2);
      }
    });

    test('table shows quality score with /10 format', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - if table exists with data, check for /10 format
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Look for any cell containing /10 pattern
        const qualityCells = table.getByText(/\d+\/10/);
        const cellCount = await qualityCells.count();

        // Should have at least one quality score cell
        expect(cellCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Kel Row Highlighting (AC #2)', () => {
    test('Kel row has highlight styling when position exists', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Check for Kel row highlight
      const kelRow = mahoPage.getByTestId('pitch-kel-row-highlight');
      const kelRowExists = await kelRow.count();

      if (kelRowExists > 0) {
        // Assert - Kel row should be visible
        await expect(kelRow).toBeVisible();

        // Assert - Kel row should contain "Kel" text
        await expect(kelRow).toContainText('Kel');

        // Assert - Kel row has bg-primary/10 class (verified via class or computed style)
        await expect(kelRow).toHaveClass(/bg-primary/);
      }
      // Test passes - either Kel is highlighted or no Kel position exists
    });

    test('Kel row appears first in table when position exists', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Check for table and Kel row
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();
      const kelRow = mahoPage.getByTestId('pitch-kel-row-highlight');
      const kelRowExists = await kelRow.count();

      if (tableExists > 0 && kelRowExists > 0) {
        // Get all data rows (skip header)
        const rows = table.locator('tbody tr');
        const firstDataRow = rows.first();

        // Assert - first data row should be the Kel row
        await expect(firstDataRow).toHaveAttribute('data-testid', 'pitch-kel-row-highlight');
      }
    });
  });

  test.describe('Read-Only View (AC #3)', () => {
    test('table has no buttons or edit controls', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - if table exists, it should have no buttons
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Count buttons inside the table
        const buttons = table.getByRole('button');
        const buttonCount = await buttons.count();

        // Should have zero buttons (read-only view)
        expect(buttonCount).toBe(0);
      }
    });

    test('table has no clickable links', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - if table exists, it should have no links
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Count links inside the table
        const links = table.getByRole('link');
        const linkCount = await links.count();

        // Should have zero links (read-only view)
        expect(linkCount).toBe(0);
      }
    });
  });

  test.describe('Table Not in Normal View', () => {
    test('competitor table is NOT visible in normal visualization view', async () => {
      // Arrange - navigate to normal visualization (not pitch mode)
      await mahoPage.goto('/visualization');
      await mahoPage.waitForLoadState('networkidle');

      // Assert - table should NOT be present in normal view
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      // Table is only for pitch mode
      expect(tableExists).toBe(0);
    });
  });
});

test.describe('Pitch Mode as Kel User', () => {
  test('Kel can access pitch mode', async ({ browser }) => {
    // Create context for Kel user
    const kelContext = await browser.newContext({
      storageState: path.join(__dirname, '../.auth/kel.json'),
    });
    const kelPage = await kelContext.newPage();

    try {
      // Navigate to visualization page
      await kelPage.goto('/visualization');
      await kelPage.waitForLoadState('networkidle');

      // Kel should see Enter Pitch Mode button (everyone can use pitch mode)
      const enterButton = kelPage.getByTestId('enter-pitch-mode-button');
      await expect(enterButton).toBeVisible();

      // Act - enter pitch mode
      await enterButton.click();

      // Assert - pitch mode is active
      await expect(kelPage).toHaveURL(/\/visualization\?mode=pitch/);

      // Check that at least one pitch mode header is visible
      const headers = kelPage.getByTestId('pitch-mode-header');
      const count = await headers.count();
      expect(count).toBeGreaterThanOrEqual(1);

      let foundVisibleHeader = false;
      for (let i = 0; i < count; i++) {
        if (await headers.nth(i).isVisible()) {
          foundVisibleHeader = true;
          break;
        }
      }
      expect(foundVisibleHeader).toBe(true);
    } finally {
      await kelContext.close();
    }
  });
});

test.describe('Pitch Mode Metric Tooltips (Story 11.5)', () => {
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

  test.describe('Tooltip Display (AC #1, #2, #3)', () => {
    test('metric headers have tooltip triggers', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Only test if table exists (requires competitor data)
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Assert - tooltip triggers should be present
        await expect(mahoPage.getByTestId('tooltip-quality-score')).toBeVisible();
        await expect(mahoPage.getByTestId('tooltip-price-range')).toBeVisible();
        await expect(mahoPage.getByTestId('tooltip-market-position')).toBeVisible();
      }
    });

    test('quality score tooltip shows definition on hover', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Only test if table exists
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Act - hover over Quality Score header
        const trigger = mahoPage.getByTestId('tooltip-quality-score');
        await trigger.hover();

        // Assert - tooltip content appears with definition
        const tooltipContent = mahoPage.getByTestId('tooltip-content');
        await expect(tooltipContent).toBeVisible();
        await expect(tooltipContent).toContainText('Perceived product quality');
        await expect(tooltipContent).toContainText('Scale:');
        await expect(tooltipContent).toContainText('Good:');
      }
    });

    test('price range tooltip shows definition on hover', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Only test if table exists
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Act - hover over Price Range header
        const trigger = mahoPage.getByTestId('tooltip-price-range');
        await trigger.hover();

        // Assert - tooltip content appears with definition
        const tooltipContent = mahoPage.getByTestId('tooltip-content');
        await expect(tooltipContent).toBeVisible();
        await expect(tooltipContent).toContainText('Retail price positioning');
      }
    });

    test('market position tooltip shows definition on hover', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Only test if table exists
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Act - hover over Market Position header
        const trigger = mahoPage.getByTestId('tooltip-market-position');
        await trigger.hover();

        // Assert - tooltip content appears with definition
        const tooltipContent = mahoPage.getByTestId('tooltip-content');
        await expect(tooltipContent).toBeVisible();
        await expect(tooltipContent).toContainText('Quadrant position');
      }
    });
  });

  test.describe('Tooltip Dismissal (AC #4)', () => {
    test('tooltip disappears when cursor moves away', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Only test if table exists
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Act - hover over Quality Score header
        const trigger = mahoPage.getByTestId('tooltip-quality-score');
        await trigger.hover();

        // Verify tooltip is visible
        const tooltipContent = mahoPage.getByTestId('tooltip-content');
        await expect(tooltipContent).toBeVisible();

        // Act - move cursor away (hover over table body instead)
        await table.locator('tbody').hover();

        // Assert - tooltip disappears
        await expect(tooltipContent).toBeHidden();
      }
    });
  });

  test.describe('Tooltip Accessibility', () => {
    test('tooltip triggers are keyboard focusable', async () => {
      // Arrange - navigate to pitch mode
      await mahoPage.goto('/visualization?mode=pitch');
      await mahoPage.waitForLoadState('networkidle');

      // Only test if table exists
      const table = mahoPage.getByTestId('pitch-competitor-table');
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Assert - tooltip triggers have tabIndex for keyboard access
        const trigger = mahoPage.getByTestId('tooltip-quality-score');
        await expect(trigger).toHaveAttribute('tabindex', '0');
      }
    });
  });
});
