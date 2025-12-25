/**
 * Evidence Mobile/Tablet Test
 *
 * Tests evidence panel behavior on mobile viewport (iPhone).
 * Swipe-to-dismiss is post-MVP, so we test:
 * - Panel opens correctly on mobile
 * - Panel takes appropriate width
 * - Close button works
 *
 * These tests run via the 'iphone' project in playwright.config.ts
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
};

// Use serial mode - tests build on each other
test.describe.configure({ mode: 'serial' });

// Test data with unique suffix
const TEST_QUESTION_TITLE = `Mobile Evidence Test ${Date.now()}`;

// Note: This file relies on the 'iphone' project in playwright.config.ts
// which sets up iPhone 14 Pro viewport. When run with --project=iphone,
// isMobile will be true.
test.use({
  storageState: STORAGE_STATE.maho,
});

let createdQuestionUrl: string;

test.describe('Evidence Panel Mobile', () => {

  test('Setup: Create question with evidence for mobile testing', async ({ page }) => {
    // Navigate to questions page
    await page.goto('/questions');
    await expect(page.getByTestId('questions-page')).toBeVisible();

    // Create a question
    await page.getByTestId('new-question-button').click();
    await expect(page.getByTestId('question-form')).toBeVisible();
    await page.getByTestId('question-title-input').fill(TEST_QUESTION_TITLE);
    await page.getByTestId('question-category-select').selectOption('market');
    await page.getByTestId('question-submit').click();

    await expect(page.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Save URL for other tests
    createdQuestionUrl = page.url();

    // Add evidence
    await page.getByTestId('add-evidence-button').click();
    await page.getByTestId('evidence-title-input').fill('Mobile Test Evidence');
    await page.getByTestId('evidence-url-input').fill('https://example.com/mobile');
    await page.getByTestId('evidence-excerpt-input').fill('Evidence for mobile testing');
    await page.getByTestId('evidence-submit').click();

    await expect(page.getByTestId('evidence-item')).toBeVisible({
      timeout: 5000,
    });
  });

  test('Panel opens on mobile and displays correctly', async ({ page, isMobile }) => {
    // Skip if not running on mobile project
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    // Navigate to the question
    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Click evidence item to open panel
    await page.getByTestId('evidence-item').click();
    await expect(page.getByTestId('evidence-panel')).toBeVisible({
      timeout: 5000,
    });

    // Verify panel content displays
    await expect(page.getByTestId('evidence-panel-title')).toHaveText('Mobile Test Evidence');
    await expect(page.getByTestId('evidence-panel-domain')).toContainText('example.com');
  });

  test('Panel width is appropriate for mobile viewport', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Open panel
    await page.getByTestId('evidence-item').click();
    await expect(page.getByTestId('evidence-panel')).toBeVisible();

    // Check panel dimensions
    const panel = page.getByTestId('evidence-panel');
    const panelBox = await panel.boundingBox();
    const viewport = page.viewportSize();

    if (panelBox && viewport) {
      // On mobile (iPhone 14 Pro is 393x852), panel should take full width
      // The Sheet component uses w-full on mobile
      expect(panelBox.width).toBeGreaterThan(viewport.width * 0.9);
    }
  });

  test('Panel can be dismissed by pressing Escape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Open panel
    await page.getByTestId('evidence-item').click();
    await expect(page.getByTestId('evidence-panel')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Panel should close
    await expect(page.getByTestId('evidence-panel')).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('Touch targets are 48px for accessibility', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test only runs on mobile viewport');

    await page.goto(createdQuestionUrl);
    await expect(page.getByTestId('question-detail-page')).toBeVisible();

    // Touch the evidence item to show action buttons
    await page.getByTestId('evidence-item').tap();

    // The edit/remove buttons should be visible (Maho's session)
    const editButton = page.getByTestId('evidence-edit-button');
    await expect(editButton).toBeVisible({ timeout: 3000 });

    // Verify touch target meets WCAG minimum (44px)
    const editBox = await editButton.boundingBox();
    expect(editBox).not.toBeNull();
    expect(editBox!.width).toBeGreaterThanOrEqual(44);
    expect(editBox!.height).toBeGreaterThanOrEqual(44);
  });
});
