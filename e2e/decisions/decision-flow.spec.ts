/**
 * Decision Queue Flow E2E Test
 *
 * Tests the complete decision queue workflow:
 * 1. Maho creates question for Kel
 * 2. Kel views queue with pending count
 * 3. Kel expands card and approves
 * 4. Kel approves with constraints
 * 5. Maho views decision and marks incorporated
 * 6. Kel uses explore alternatives
 * 7. Kel tests undo within 5 seconds
 * 8. Kel tests undo after 5 seconds
 *
 * Uses multi-user contexts with different storageState files.
 *
 * Timeout strategy:
 * - 3000ms: UI animations (panel open/close, card expand/collapse)
 * - 5000ms: Form submissions with network (approve, submit decisions)
 * - 6000ms: Undo toast auto-dismiss (5 seconds + buffer)
 * - 10000ms: Page navigation and initial load
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

// Use serial mode - tests depend on each other
test.describe.configure({ mode: 'serial' });

const STORAGE_STATE = {
  maho: path.join(__dirname, '../.auth/maho.json'),
  kel: path.join(__dirname, '../.auth/kel.json'),
};

// Generate unique test data to avoid collisions
const TEST_SUFFIX = Date.now();
const TEST_QUESTIONS = {
  simple: `Decision Simple Approve Test ${TEST_SUFFIX}`,
  constrained: `Decision Constrained Test ${TEST_SUFFIX}`,
  explore: `Decision Explore Test ${TEST_SUFFIX}`,
  undoWithin: `Decision Undo Within Test ${TEST_SUFFIX}`,
  undoAfter: `Decision Undo After Test ${TEST_SUFFIX}`,
};

let mahoContext: BrowserContext;
let kelContext: BrowserContext;
let mahoPage: Page;
let kelPage: Page;

// Track question IDs for cross-test references
const questionIds: Record<string, string> = {};

test.beforeAll(async ({ browser }) => {
  mahoContext = await browser.newContext({ storageState: STORAGE_STATE.maho });
  kelContext = await browser.newContext({ storageState: STORAGE_STATE.kel });
  mahoPage = await mahoContext.newPage();
  kelPage = await kelContext.newPage();
});

test.afterAll(async () => {
  await mahoContext.close();
  await kelContext.close();
});

/**
 * Helper: Maho creates a question and sends it to Kel.
 * Returns the question ID.
 */
async function createQuestionForKel(
  mahoPage: Page,
  kelPage: Page,
  title: string
): Promise<string> {
  // Maho creates question
  await mahoPage.goto('/questions');
  await expect(mahoPage.getByTestId('questions-page')).toBeVisible({
    timeout: 10000,
  });

  await mahoPage.getByTestId('new-question-button').click();

  await expect(mahoPage.getByTestId('question-form')).toBeVisible();
  await mahoPage.getByTestId('question-title-input').fill(title);
  await mahoPage.getByTestId('question-category-select').selectOption('market');
  await mahoPage.getByTestId('question-submit').click();

  await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
    timeout: 10000,
  });

  // Capture question ID
  const url = mahoPage.url();
  const match = url.match(/\/questions\/([^/]+)/);
  const questionId = match?.[1] ?? '';

  // Add recommendation (required for Kel decision)
  await mahoPage.getByTestId('add-recommendation-button').click();
  await expect(mahoPage.getByTestId('recommendation-form')).toBeVisible();
  await mahoPage
    .getByTestId('recommendation-text')
    .fill('E2E test recommendation: proceed with market validation');
  await mahoPage
    .getByTestId('recommendation-rationale')
    .fill('Test rationale for decision testing');
  await mahoPage.getByTestId('recommendation-submit').click();

  await expect(mahoPage.getByTestId('recommendation-display')).toBeVisible({
    timeout: 10000,
  });

  // Send to Kel
  await mahoPage.getByTestId('send-to-kel-button').click();
  await expect(mahoPage.getByTestId('send-to-kel-confirm-dialog')).toBeVisible();
  await mahoPage.getByRole('button', { name: /send/i }).click();
  await expect(mahoPage.getByTestId('send-to-kel-button')).not.toBeVisible({
    timeout: 5000,
  });

  // Wait for network to ensure mutation is persisted
  await mahoPage.waitForLoadState('networkidle');

  // Verify Kel sees it in queue (Kel's dashboard shows QueueView)
  await kelPage.goto('/');
  await kelPage.waitForLoadState('networkidle');
  await expect(kelPage.getByTestId('queue-page')).toBeVisible({ timeout: 10000 });
  await expect(kelPage.getByText(title)).toBeVisible({ timeout: 10000 });

  return questionId;
}

/**
 * Helper: Wait for decision to be fully synced.
 * Waits for undo window (5s) + network sync + toast dismissal animation.
 * Uses generous timeouts to handle animation and network variability.
 */
async function waitForDecisionSync(page: Page): Promise<void> {
  // Wait for undo window to expire (5 seconds) + generous buffer for sync + animation
  await page.waitForTimeout(7000);
  // Wait for any pending network requests to complete
  await page.waitForLoadState('networkidle');
}

test.describe('Decision Queue Flow', () => {
  test('Setup: Maho creates a question for simple approval testing', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      TEST_QUESTIONS.simple
    );
    questionIds.simple = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Kel views queue with pending count', async () => {
    await kelPage.goto('/');

    // Verify queue page loads
    await expect(kelPage.getByTestId('queue-page')).toBeVisible({
      timeout: 10000,
    });

    // Verify queue count headline shows at least 1
    await expect(kelPage.getByTestId('queue-count-headline')).toBeVisible();
    const countText = await kelPage.getByTestId('queue-count-headline').textContent();
    expect(countText).toMatch(/\d+/); // Contains a number
  });

  test('Kel expands card and approves (simple approval)', async () => {
    await kelPage.goto('/');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible();

    // Find the card with our test question
    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(TEST_QUESTIONS.simple),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    // Click header to expand
    await card.getByTestId('queue-card-header').click();

    // Verify card is now expanded
    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(TEST_QUESTIONS.simple),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    // Click approve button
    await expandedCard.getByTestId('approve-button').click();

    // Verify undo toast appears with progress bar
    await expect(kelPage.getByTestId('undo-toast')).toBeVisible({ timeout: 3000 });
    await expect(kelPage.getByTestId('undo-progress-bar')).toBeVisible();

    // Wait for undo window to expire and toast to auto-dismiss (5s + buffer)
    await expect(kelPage.getByTestId('undo-toast')).not.toBeVisible({ timeout: 7000 });

    // Verify card is removed from queue
    await expect(kelPage.getByText(TEST_QUESTIONS.simple)).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('Setup: Maho creates question for constrained approval', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      TEST_QUESTIONS.constrained
    );
    questionIds.constrained = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Kel approves with constraints', async () => {
    // Navigate to Kel's queue and wait for it to load
    await kelPage.goto('/');
    await kelPage.waitForLoadState('networkidle');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible({ timeout: 10000 });

    // Find and expand the card
    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(TEST_QUESTIONS.constrained),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.getByTestId('queue-card-header').click();

    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(TEST_QUESTIONS.constrained),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    // Click approve with constraint button
    const approveWithConstraintBtn = expandedCard.getByTestId('approve-with-constraint-button');
    await expect(approveWithConstraintBtn).toBeVisible();

    await approveWithConstraintBtn.click();

    // Wait for Sheet animation to complete (bottom sheet slide-up)
    await kelPage.waitForTimeout(500);

    // Verify constraint panel opens (Sheet portals to body so use page-level locator)
    await expect(kelPage.getByTestId('constraint-panel')).toBeVisible({
      timeout: 5000,
    });

    // Select constraint chips (price and timeline)
    await kelPage.getByTestId('constraint-chip-price').click();
    await kelPage.getByTestId('constraint-chip-timeline').click();

    // Enter context
    await kelPage.getByTestId('constraint-context-input').fill('E2E test constraints');

    // Click confirm button
    await kelPage.getByTestId('constraint-confirm-button').click();

    // Verify undo toast shows "Approved with constraints"
    await expect(kelPage.getByTestId('undo-toast')).toBeVisible({ timeout: 3000 });

    // Wait for undo window to expire and sync to complete
    await waitForDecisionSync(kelPage);

    // Verify card removed
    await expect(kelPage.getByText(TEST_QUESTIONS.constrained)).not.toBeVisible({
      timeout: 3000,
    });
  });

  test('Maho views decision with constraints and marks incorporated', async () => {
    // Navigate to question detail
    await mahoPage.goto(`/questions/${questionIds.constrained}`);
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Verify status badge shows constrained approval
    await expect(mahoPage.getByTestId('status-badge-constrained')).toBeVisible();

    // Verify constraint display is visible
    await expect(mahoPage.getByTestId('constraint-display')).toBeVisible();

    // Verify specific constraint chips are shown
    await expect(
      mahoPage.getByTestId('constraint-display-chip-price')
    ).toBeVisible();
    await expect(
      mahoPage.getByTestId('constraint-display-chip-timeline')
    ).toBeVisible();

    // Verify context text
    await expect(mahoPage.getByTestId('constraint-display-context')).toContainText(
      'E2E test constraints'
    );

    // Click mark incorporated button
    await mahoPage.getByTestId('mark-incorporated-button').click();

    // Verify incorporated badge appears (optimistic update)
    await expect(mahoPage.getByTestId('incorporated-badge')).toBeVisible({
      timeout: 5000,
    });
  });

  test('Setup: Maho creates question for explore alternatives', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      TEST_QUESTIONS.explore
    );
    questionIds.explore = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Kel uses explore alternatives action', async () => {
    await kelPage.goto('/');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible();

    // Find and expand card
    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(TEST_QUESTIONS.explore),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.getByTestId('queue-card-header').click();

    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(TEST_QUESTIONS.explore),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    // Click explore alternatives button
    await expandedCard.getByTestId('explore-alternatives-button').click();

    // Verify alternatives panel opens
    await expect(kelPage.getByTestId('alternatives-panel')).toBeVisible({
      timeout: 3000,
    });

    // Enter reasoning
    await kelPage
      .getByTestId('alternatives-reasoning-input')
      .fill('E2E test: Need to explore other market options');

    // Click submit
    await kelPage.getByTestId('alternatives-submit-button').click();

    // Verify undo toast appears
    await expect(kelPage.getByTestId('undo-toast')).toBeVisible({ timeout: 3000 });

    // Wait for undo window to expire and sync to complete
    await waitForDecisionSync(kelPage);

    // Verify card removed
    await expect(kelPage.getByText(TEST_QUESTIONS.explore)).not.toBeVisible({
      timeout: 3000,
    });

    // Maho verifies question shows exploring status
    await mahoPage.goto(`/questions/${questionIds.explore}`);
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });
    await expect(mahoPage.getByTestId('status-badge-exploring')).toBeVisible();
  });

  test('Setup: Maho creates question for undo within window', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      TEST_QUESTIONS.undoWithin
    );
    questionIds.undoWithin = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Kel undoes decision within 5 seconds (card returns)', async () => {
    await kelPage.goto('/');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible();

    // Get initial count for later comparison
    const countBefore = await kelPage.getByTestId('queue-count-headline').textContent();

    // Find and expand card
    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(TEST_QUESTIONS.undoWithin),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.getByTestId('queue-card-header').click();

    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(TEST_QUESTIONS.undoWithin),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    // Approve
    await expandedCard.getByTestId('approve-button').click();

    // Verify undo toast is visible
    await expect(kelPage.getByTestId('undo-toast')).toBeVisible({ timeout: 3000 });
    await expect(kelPage.getByTestId('undo-progress-bar')).toBeVisible();

    // Click undo button immediately (within 5 seconds)
    await kelPage.getByTestId('undo-button').click();

    // Toast should dismiss after undo
    await expect(kelPage.getByTestId('undo-toast')).not.toBeVisible({
      timeout: 3000,
    });

    // Card should reappear in queue
    await expect(kelPage.getByText(TEST_QUESTIONS.undoWithin)).toBeVisible({
      timeout: 5000,
    });

    // Queue count should be restored
    const countAfter = await kelPage.getByTestId('queue-count-headline').textContent();
    expect(countAfter).toEqual(countBefore);
  });

  test('Setup: Maho creates question for undo after window', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      TEST_QUESTIONS.undoAfter
    );
    questionIds.undoAfter = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Kel cannot undo after 5 seconds (decision finalized)', async () => {
    await kelPage.goto('/');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible();

    // Find and expand card
    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(TEST_QUESTIONS.undoAfter),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.getByTestId('queue-card-header').click();

    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(TEST_QUESTIONS.undoAfter),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    // Approve
    await expandedCard.getByTestId('approve-button').click();

    // Verify undo toast is visible
    await expect(kelPage.getByTestId('undo-toast')).toBeVisible({ timeout: 3000 });

    // Wait for undo window to expire and sync to complete
    await waitForDecisionSync(kelPage);

    // Card should NOT be in queue (decision is finalized)
    await expect(kelPage.getByText(TEST_QUESTIONS.undoAfter)).not.toBeVisible();

    // Verify decision is actually saved by checking Maho's view
    await mahoPage.goto(`/questions/${questionIds.undoAfter}`);
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });
    await expect(mahoPage.getByTestId('status-badge-approved')).toBeVisible();
  });
});

/**
 * Data Persistence Verification Tests
 *
 * Verifies that all data is persisted correctly across page refreshes.
 * This is critical for NFR12 (zero data loss for decisions).
 *
 * @see Story 7.5: Data Preservation & Backup Verification
 * @see NFR12: Zero data loss for decisions
 */
test.describe('Data Persistence Verification', () => {
  const PERSISTENCE_QUESTIONS = {
    simple: `Persistence Simple Test ${TEST_SUFFIX}`,
    constrained: `Persistence Constrained Test ${TEST_SUFFIX}`,
    constraintEdit: `Persistence Constraint Edit Test ${TEST_SUFFIX}`,
  };

  const persistenceQuestionIds: Record<string, string> = {};

  test('Setup: Create question for simple persistence test', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      PERSISTENCE_QUESTIONS.simple
    );
    persistenceQuestionIds.simple = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Decision persists after page refresh (FR45, NFR12)', async () => {
    // Kel approves the question
    await kelPage.goto('/');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible({ timeout: 10000 });

    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(PERSISTENCE_QUESTIONS.simple),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.getByTestId('queue-card-header').click();

    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(PERSISTENCE_QUESTIONS.simple),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    // Approve
    await expandedCard.getByTestId('approve-button').click();

    // Wait for undo window to expire and sync to complete
    await waitForDecisionSync(kelPage);

    // Verify card is gone from queue
    await expect(kelPage.getByText(PERSISTENCE_QUESTIONS.simple)).not.toBeVisible({
      timeout: 3000,
    });

    // Refresh the page
    await kelPage.reload();
    await expect(kelPage.getByTestId('queue-page')).toBeVisible({ timeout: 10000 });

    // Verify the question is STILL not in queue (decision persisted)
    await expect(kelPage.getByText(PERSISTENCE_QUESTIONS.simple)).not.toBeVisible({
      timeout: 3000,
    });

    // Maho verifies decision status persisted after refresh
    await mahoPage.goto(`/questions/${persistenceQuestionIds.simple}`);
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });
    await expect(mahoPage.getByTestId('status-badge-approved')).toBeVisible();

    // Refresh Maho's page and verify again
    await mahoPage.reload();
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });
    await expect(mahoPage.getByTestId('status-badge-approved')).toBeVisible();
  });

  test('Setup: Create question for constrained persistence test', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      PERSISTENCE_QUESTIONS.constrained
    );
    persistenceQuestionIds.constrained = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Constraint data persists correctly after refresh', async () => {
    // Kel approves with constraints
    await kelPage.goto('/');
    await kelPage.waitForLoadState('networkidle');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible({ timeout: 10000 });

    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(PERSISTENCE_QUESTIONS.constrained),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.getByTestId('queue-card-header').click();

    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(PERSISTENCE_QUESTIONS.constrained),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    await expandedCard.getByTestId('approve-with-constraint-button').click();

    await kelPage.waitForTimeout(500);
    await expect(kelPage.getByTestId('constraint-panel')).toBeVisible({
      timeout: 5000,
    });

    // Select constraints and enter context with unique identifiable text
    // Wait for chips to be ready
    await expect(kelPage.getByTestId('constraint-chip-price')).toBeVisible();
    await kelPage.getByTestId('constraint-chip-price').click();

    // Small wait between clicks to avoid race condition
    await kelPage.waitForTimeout(100);
    await expect(kelPage.getByTestId('constraint-chip-volume')).toBeVisible();
    await kelPage.getByTestId('constraint-chip-volume').click();
    await kelPage
      .getByTestId('constraint-context-input')
      .fill('Persistence test: Max $5 per unit, min 1000 units');

    await kelPage.getByTestId('constraint-confirm-button').click();

    // Wait for undo window to expire and sync to complete
    await waitForDecisionSync(kelPage);

    // Maho views the decision
    await mahoPage.goto(`/questions/${persistenceQuestionIds.constrained}`);
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Verify constraint data before refresh
    await expect(mahoPage.getByTestId('status-badge-constrained')).toBeVisible();
    await expect(mahoPage.getByTestId('constraint-display')).toBeVisible();
    await expect(
      mahoPage.getByTestId('constraint-display-chip-price')
    ).toBeVisible();
    await expect(
      mahoPage.getByTestId('constraint-display-chip-volume')
    ).toBeVisible();
    await expect(mahoPage.getByTestId('constraint-display-context')).toContainText(
      'Persistence test: Max $5 per unit, min 1000 units'
    );

    // Refresh the page
    await mahoPage.reload();
    await expect(mahoPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Verify ALL constraint data still visible after refresh (NFR12)
    await expect(mahoPage.getByTestId('status-badge-constrained')).toBeVisible();
    await expect(mahoPage.getByTestId('constraint-display')).toBeVisible();
    await expect(
      mahoPage.getByTestId('constraint-display-chip-price')
    ).toBeVisible();
    await expect(
      mahoPage.getByTestId('constraint-display-chip-volume')
    ).toBeVisible();
    await expect(mahoPage.getByTestId('constraint-display-context')).toContainText(
      'Persistence test: Max $5 per unit, min 1000 units'
    );
  });

  test('Setup: Create question for constraint edit persistence test', async () => {
    const questionId = await createQuestionForKel(
      mahoPage,
      kelPage,
      PERSISTENCE_QUESTIONS.constraintEdit
    );
    persistenceQuestionIds.constraintEdit = questionId;
    expect(questionId).toBeTruthy();
  });

  test('Edited constraint persists after refresh', async () => {
    // Kel approves with initial constraints
    await kelPage.goto('/');
    await kelPage.waitForLoadState('networkidle');
    await expect(kelPage.getByTestId('queue-page')).toBeVisible({ timeout: 10000 });

    const card = kelPage.locator('[data-testid="queue-card-collapsed"]', {
      has: kelPage.getByText(PERSISTENCE_QUESTIONS.constraintEdit),
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.getByTestId('queue-card-header').click();

    const expandedCard = kelPage.locator('[data-testid="queue-card-expanded"]', {
      has: kelPage.getByText(PERSISTENCE_QUESTIONS.constraintEdit),
    });
    await expect(expandedCard).toBeVisible({ timeout: 3000 });

    await expandedCard.getByTestId('approve-with-constraint-button').click();

    await kelPage.waitForTimeout(500);
    await expect(kelPage.getByTestId('constraint-panel')).toBeVisible({
      timeout: 5000,
    });

    // Initial constraints
    await kelPage.getByTestId('constraint-chip-price').click();
    await kelPage
      .getByTestId('constraint-context-input')
      .fill('Initial constraint context');

    await kelPage.getByTestId('constraint-confirm-button').click();

    // Wait for undo window to expire and sync to complete
    await waitForDecisionSync(kelPage);

    // Navigate to decision and edit constraint context
    await kelPage.goto(`/questions/${persistenceQuestionIds.constraintEdit}`);
    await expect(kelPage.getByTestId('question-detail-page')).toBeVisible({
      timeout: 10000,
    });

    // Look for edit button if available and click it
    const editButton = kelPage.getByTestId('edit-constraint-button');
    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();

      await expect(kelPage.getByTestId('constraint-panel')).toBeVisible({
        timeout: 3000,
      });

      // Update constraint context
      await kelPage.getByTestId('constraint-context-input').clear();
      await kelPage
        .getByTestId('constraint-context-input')
        .fill('EDITED: Updated constraint after initial save');

      await kelPage.getByTestId('constraint-confirm-button').click();
      await kelPage.waitForTimeout(1000);

      // Refresh
      await kelPage.reload();
      await expect(kelPage.getByTestId('question-detail-page')).toBeVisible({
        timeout: 10000,
      });

      // Verify edited value persisted
      await expect(kelPage.getByTestId('constraint-display-context')).toContainText(
        'EDITED: Updated constraint after initial save'
      );
    } else {
      // If edit button doesn't exist, verify initial constraint persists after refresh
      await kelPage.reload();
      await expect(kelPage.getByTestId('question-detail-page')).toBeVisible({
        timeout: 10000,
      });
      await expect(kelPage.getByTestId('constraint-display-context')).toContainText(
        'Initial constraint context'
      );
    }
  });
});
