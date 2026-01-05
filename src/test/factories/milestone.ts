/**
 * Milestone Test Factory
 *
 * Creates mock Milestone and MilestoneNote objects for testing.
 * Used by progress component tests and hook tests.
 */

import type { Milestone, MilestoneNote } from '@/types/database';

/**
 * Creates a mock Milestone with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @example
 * // Basic usage
 * const milestone = createMockMilestone();
 *
 * @example
 * // Completed milestone
 * const completed = createMockMilestone({
 *   status: 'complete',
 *   completed_at: new Date().toISOString(),
 * });
 */
export function createMockMilestone(overrides?: Partial<Milestone>): Milestone {
  return {
    id: crypto.randomUUID(),
    category: 'market',
    status: 'not_started',
    completed_at: null,
    completed_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock Milestone in progress.
 */
export function createMockMilestoneInProgress(
  overrides?: Partial<Milestone>
): Milestone {
  return createMockMilestone({
    status: 'in_progress',
    ...overrides,
  });
}

/**
 * Creates a mock Milestone that is complete.
 */
export function createMockMilestoneComplete(
  overrides?: Partial<Milestone>
): Milestone {
  return createMockMilestone({
    status: 'complete',
    completed_at: new Date().toISOString(),
    completed_by: 'maho@example.com',
    ...overrides,
  });
}

/**
 * Creates a mock MilestoneNote with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @example
 * // Basic usage
 * const note = createMockMilestoneNote();
 *
 * @example
 * // Note linked to specific milestone
 * const linkedNote = createMockMilestoneNote({
 *   milestone_id: 'milestone-123',
 *   content: 'Progress update',
 * });
 */
export function createMockMilestoneNote(
  overrides?: Partial<MilestoneNote>
): MilestoneNote {
  return {
    id: crypto.randomUUID(),
    milestone_id: crypto.randomUUID(),
    content: 'Test milestone note content',
    created_by: 'maho@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
