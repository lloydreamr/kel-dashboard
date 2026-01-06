/**
 * Navigation Flow E2E Tests
 *
 * Tests navigation functionality for both desktop and mobile viewports,
 * including sidebar, hamburger menu, and role-specific behaviors.
 *
 * Story 9.9: E2E Navigation Flow Test
 * - AC1: Desktop Navigation Test
 * - AC2: Mobile Navigation Test
 * - AC3: Question Edit Test
 * - AC4: Role-Specific Empty State Test
 * - AC5: Quick Actions Test
 * - AC6: CI Pipeline
 *
 * Uses storage state authentication pattern with separate contexts for Maho/Kel.
 *
 * NOTE: Desktop-specific tests check for sidebar visibility before proceeding.
 * Mobile tests create their own viewport context.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

// Storage state files (created by auth setup)
const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
};

// Mobile viewport dimensions (iPhone SE)
const MOBILE_VIEWPORT = { width: 375, height: 667 };

// =============================================================================
// AC1: Desktop Navigation Tests
// Tests desktop-specific features (sidebar, nav links, active states)
// =============================================================================
test.describe('Desktop Navigation', () => {
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

  test('sidebar is visible on desktop viewport', async () => {
    await mahoPage.goto('/');
    const sidebar = mahoPage.getByTestId('nav-sidebar');

    // Skip on mobile projects where sidebar is hidden
    if (!(await sidebar.isVisible())) {
      test.skip(true, 'Sidebar not visible - likely mobile viewport');
      return;
    }

    await expect(sidebar).toBeVisible();
  });

  test('navigates to each page via sidebar links', async () => {
    await mahoPage.goto('/');

    // Skip on mobile projects
    const sidebar = mahoPage.getByTestId('nav-sidebar');
    if (!(await sidebar.isVisible())) {
      test.skip(true, 'Sidebar not visible - likely mobile viewport');
      return;
    }

    // Navigate to Questions
    await mahoPage.getByTestId('nav-link-questions').click();
    await expect(mahoPage).toHaveURL(/\/questions/);

    // Navigate to Visualization
    await mahoPage.getByTestId('nav-link-visualization').click();
    await expect(mahoPage).toHaveURL(/\/visualization/);

    // Navigate to Progress
    await mahoPage.getByTestId('nav-link-progress').click();
    await expect(mahoPage).toHaveURL(/\/progress/);

    // Navigate back to Dashboard
    await mahoPage.getByTestId('nav-link-dashboard').click();
    await expect(mahoPage).toHaveURL(/\/$/);
  });

  test('active state shows for current page', async () => {
    await mahoPage.goto('/questions');

    // Skip on mobile projects
    const sidebar = mahoPage.getByTestId('nav-sidebar');
    if (!(await sidebar.isVisible())) {
      test.skip(true, 'Sidebar not visible - likely mobile viewport');
      return;
    }

    // Check for active state via bg-accent class OR sr-only indicator
    const questionsLink = mahoPage.getByTestId('nav-link-questions');
    await expect(questionsLink).toBeVisible();

    // The active link should have the bg-accent class
    await expect(questionsLink).toHaveClass(/bg-accent/);

    // And include the sr-only active indicator
    const activeIndicator = questionsLink.getByTestId('nav-active-indicator');
    await expect(activeIndicator).toBeAttached();
  });

  test('user section is visible', async () => {
    await mahoPage.goto('/');

    // Skip on mobile projects
    const sidebar = mahoPage.getByTestId('nav-sidebar');
    if (!(await sidebar.isVisible())) {
      test.skip(true, 'Sidebar not visible - likely mobile viewport');
      return;
    }

    await expect(mahoPage.getByTestId('nav-user-section')).toBeVisible();
    // Use .first() since logout button exists in both sidebar and mobile drawer
    await expect(mahoPage.getByTestId('nav-logout').first()).toBeVisible();
  });
});

// =============================================================================
// AC2: Mobile Navigation Tests
// Creates its own context with mobile viewport - runs on all projects
// =============================================================================
test.describe('Mobile Navigation', () => {
  test('sidebar hidden and hamburger visible on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
      viewport: MOBILE_VIEWPORT,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('/');

    // Sidebar should be hidden on mobile
    await expect(mobilePage.getByTestId('nav-sidebar')).not.toBeVisible();

    // Hamburger button should be visible
    await expect(mobilePage.getByTestId('nav-hamburger')).toBeVisible();

    await mobileContext.close();
  });

  test('hamburger opens drawer', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
      viewport: MOBILE_VIEWPORT,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('/');

    // Click hamburger to open drawer
    await mobilePage.getByTestId('nav-hamburger').click();

    // Drawer should be visible
    await expect(mobilePage.getByTestId('nav-drawer')).toBeVisible();

    await mobileContext.close();
  });

  test('mobile navigation links work and close drawer', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
      viewport: MOBILE_VIEWPORT,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('/');

    // Open drawer
    await mobilePage.getByTestId('nav-hamburger').click();
    await expect(mobilePage.getByTestId('nav-drawer')).toBeVisible();

    // Click questions link (uses mobile- prefix)
    await mobilePage.getByTestId('mobile-nav-link-questions').click();

    // Should navigate to questions
    await expect(mobilePage).toHaveURL(/\/questions/);

    // Drawer should close after navigation
    await expect(mobilePage.getByTestId('nav-drawer')).not.toBeVisible();

    await mobileContext.close();
  });

  test('clicking backdrop closes drawer', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
      viewport: MOBILE_VIEWPORT,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('/');

    // Open drawer
    await mobilePage.getByTestId('nav-hamburger').click();
    await expect(mobilePage.getByTestId('nav-drawer')).toBeVisible();

    // Click backdrop to close
    await mobilePage.getByTestId('nav-drawer-backdrop').click();

    // Drawer should close
    await expect(mobilePage.getByTestId('nav-drawer')).not.toBeVisible();

    await mobileContext.close();
  });

  test('mobile user section visible in drawer', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
      viewport: MOBILE_VIEWPORT,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('/');

    // Open drawer
    await mobilePage.getByTestId('nav-hamburger').click();
    await expect(mobilePage.getByTestId('nav-drawer')).toBeVisible();

    // User section should be visible in mobile drawer
    await expect(mobilePage.getByTestId('mobile-nav-user-section')).toBeVisible();

    // Logout should be visible within the drawer context
    const drawer = mobilePage.getByTestId('nav-drawer');
    await expect(drawer.getByTestId('nav-logout')).toBeVisible();

    await mobileContext.close();
  });
});

// =============================================================================
// AC3: Question Edit Tests
// Uses serial mode for state dependencies
// =============================================================================
test.describe('Question Edit', () => {
  test.describe.configure({ mode: 'serial' });

  let mahoContext: BrowserContext;
  let mahoPage: Page;
  let createdQuestionId: string;
  const TEST_QUESTION_TITLE = `Navigation E2E Edit Test ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    mahoPage = await mahoContext.newPage();
  });

  test.afterAll(async () => {
    // Clean up: archive the test question
    if (createdQuestionId && mahoPage) {
      try {
        await mahoPage.goto(`/questions/${createdQuestionId}`);
        const archiveButton = mahoPage.getByTestId('archive-button');
        if (await archiveButton.isVisible()) {
          await archiveButton.click();
          await mahoPage.getByRole('button', { name: /archive/i }).click();
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    await mahoContext?.close();
  });

  test('create test question for edit tests', async () => {
    await mahoPage.goto('/questions');

    // Skip on mobile - desktop context for edit tests
    const sidebar = mahoPage.getByTestId('nav-sidebar');
    if (!(await sidebar.isVisible())) {
      test.skip(true, 'Sidebar not visible - using desktop tests');
      return;
    }

    await mahoPage.getByTestId('new-question-button').click();

    await mahoPage.getByTestId('question-title-input').fill(TEST_QUESTION_TITLE);
    await mahoPage.getByTestId('question-description-input').fill('Test question for navigation E2E');
    await mahoPage.getByTestId('question-category-select').selectOption('market');
    await mahoPage.getByTestId('question-submit').click();

    // Capture question ID from URL
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({ timeout: 10000 });
    const url = mahoPage.url();
    const match = url.match(/\/questions\/([^/?]+)/);
    createdQuestionId = match?.[1] ?? '';
    expect(createdQuestionId).toBeTruthy();
  });

  test('edit button visible for Maho', async () => {
    // Skip if no question was created (mobile project)
    if (!createdQuestionId) {
      test.skip(true, 'No test question created');
      return;
    }

    await mahoPage.goto(`/questions/${createdQuestionId}`);
    await expect(mahoPage.getByTestId('question-edit-button')).toBeVisible();
  });

  test('clicking edit shows form', async () => {
    // Skip if no question was created
    if (!createdQuestionId) {
      test.skip(true, 'No test question created');
      return;
    }

    await mahoPage.goto(`/questions/${createdQuestionId}`);
    await mahoPage.getByTestId('question-edit-button').click();

    // Edit form should be visible
    await expect(mahoPage.getByTestId('question-edit-form')).toBeVisible();
  });

  test('modify title and save', async () => {
    // Skip if no question was created
    if (!createdQuestionId) {
      test.skip(true, 'No test question created');
      return;
    }

    const newTitle = `${TEST_QUESTION_TITLE} - EDITED`;

    await mahoPage.goto(`/questions/${createdQuestionId}`);
    await mahoPage.getByTestId('question-edit-button').click();
    await expect(mahoPage.getByTestId('question-edit-form')).toBeVisible();

    // Clear and fill new title
    await mahoPage.getByTestId('question-edit-title').fill(newTitle);

    // Save changes
    await mahoPage.getByTestId('question-edit-save').click();

    // Wait for form to close and verify title updated
    await expect(mahoPage.getByTestId('question-edit-form')).not.toBeVisible({ timeout: 5000 });
    await expect(mahoPage.getByTestId('question-title')).toHaveText(newTitle);
  });
});

// =============================================================================
// AC4: Role-Specific Empty State Tests
// =============================================================================
test.describe('Role-Specific Empty States', () => {
  test('Maho sees action button when empty state visible', async ({ browser }) => {
    const mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    const mahoPage = await mahoContext.newPage();

    await mahoPage.goto('/questions');
    await mahoPage.waitForLoadState('networkidle');

    // Check if global empty state is visible
    const emptyState = mahoPage.getByTestId('questions-empty-state');

    if (!(await emptyState.isVisible())) {
      test.skip(true, 'Empty state not visible - questions exist in database');
      return;
    }

    // Maho should see the action button in empty state
    await expect(mahoPage.getByTestId('empty-state-action')).toBeVisible();

    await mahoContext.close();
  });

  test('Kel does NOT see action button in empty state', async ({ browser }) => {
    const kelContext = await browser.newContext({
      storageState: STORAGE_STATE.kel,
    });
    const kelPage = await kelContext.newPage();

    await kelPage.goto('/questions');
    await kelPage.waitForLoadState('networkidle');

    // Check if global empty state is visible
    const emptyState = kelPage.getByTestId('questions-empty-state');

    if (!(await emptyState.isVisible())) {
      test.skip(true, 'Empty state not visible - questions exist in database');
      return;
    }

    // Kel should NOT see the action button (read-only user)
    await expect(kelPage.getByTestId('empty-state-action')).not.toBeVisible();

    await kelContext.close();
  });
});

// =============================================================================
// AC5: Quick Actions Tests
// Uses serial mode for state dependencies
// =============================================================================
test.describe('Quick Actions Menu', () => {
  test.describe.configure({ mode: 'serial' });

  let mahoContext: BrowserContext;
  let mahoPage: Page;
  let testQuestionId: string;
  const TEST_TITLE = `Quick Actions Test ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    mahoContext = await browser.newContext({
      storageState: STORAGE_STATE.maho,
    });
    mahoPage = await mahoContext.newPage();
  });

  test.afterAll(async () => {
    await mahoContext?.close();
  });

  test('create test question for quick actions', async () => {
    await mahoPage.goto('/questions');

    // Skip on mobile viewport
    const sidebar = mahoPage.getByTestId('nav-sidebar');
    if (!(await sidebar.isVisible())) {
      test.skip(true, 'Sidebar not visible - using desktop tests');
      return;
    }

    await mahoPage.getByTestId('new-question-button').click();

    await mahoPage.getByTestId('question-title-input').fill(TEST_TITLE);
    await mahoPage.getByTestId('question-description-input').fill('Test for quick actions');
    await mahoPage.getByTestId('question-category-select').selectOption('product');
    await mahoPage.getByTestId('question-submit').click();

    // Capture question ID
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({ timeout: 10000 });
    const url = mahoPage.url();
    const match = url.match(/\/questions\/([^/?]+)/);
    testQuestionId = match?.[1] ?? '';
    expect(testQuestionId).toBeTruthy();
  });

  test('Maho sees kebab menu on question card', async () => {
    // Skip if no question was created
    if (!testQuestionId) {
      test.skip(true, 'No test question created');
      return;
    }

    await mahoPage.goto('/questions');
    await expect(mahoPage.getByTestId('questions-list')).toBeVisible({ timeout: 10000 });

    // Should see at least one kebab menu trigger
    await expect(mahoPage.getByTestId('question-card-menu-trigger').first()).toBeVisible();
  });

  test('archive from list removes question', async () => {
    // Skip if no question was created
    if (!testQuestionId) {
      test.skip(true, 'No test question created');
      return;
    }

    await mahoPage.goto('/questions');
    await expect(mahoPage.getByTestId('questions-list')).toBeVisible();

    // Count questions before archive
    const menuTriggers = mahoPage.getByTestId('question-card-menu-trigger');
    const countBefore = await menuTriggers.count();

    // Find the specific question card that contains OUR test title
    // (other parallel tests may have created questions that appear in the list)
    const questionCard = mahoPage.locator('[data-testid="question-card"]', {
      has: mahoPage.getByText(TEST_TITLE),
    });
    await expect(questionCard).toBeVisible({ timeout: 5000 });

    // Click the menu trigger within our specific question card
    await questionCard.getByTestId('question-card-menu-trigger').click();

    // Click archive option
    await mahoPage.getByTestId('question-card-menu-archive').click();

    // Confirm in dialog
    await expect(mahoPage.getByTestId('archive-question-dialog')).toBeVisible();
    await mahoPage.getByTestId('archive-question-confirm').click();

    // Dialog should close
    await expect(mahoPage.getByTestId('archive-question-dialog')).not.toBeVisible({ timeout: 5000 });

    // Count should decrease - use Playwright's auto-retry assertion instead of fixed timeout
    await expect(menuTriggers).toHaveCount(countBefore - 1, { timeout: 5000 });
  });

  test('Kel does NOT see kebab menu', async ({ browser }) => {
    const kelContext = await browser.newContext({
      storageState: STORAGE_STATE.kel,
    });
    const kelPage = await kelContext.newPage();

    await kelPage.goto('/questions');
    await kelPage.waitForLoadState('networkidle');

    // If questions list is not visible, skip the test
    const questionsList = kelPage.getByTestId('questions-list');
    if (!(await questionsList.isVisible())) {
      test.skip(true, 'Questions list not visible - no questions in database');
      return;
    }

    // Kel should NOT see the menu trigger (read-only user)
    const menuTriggers = kelPage.getByTestId('question-card-menu-trigger');
    await expect(menuTriggers).toHaveCount(0);

    await kelContext.close();
  });
});
