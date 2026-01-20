/**
 * Action processor for sync engine.
 * Translates offline queue actions into repository calls.
 * Internal module - not exported from barrel.
 *
 * @see Story 8.3: Sync Engine - Task 3
 * @see Story 8.4: Conflict Detection integration
 */

import { decisionsRepo } from '@/lib/repositories/decisions';
import { profilesRepo } from '@/lib/repositories/profiles';
import { questionsRepo } from '@/lib/repositories/questions';
import { DECISION_TYPES } from '@/types/decision';

import { detectConflict } from './conflicts';

import type { OfflineAction } from '@/lib/offline/types';
import type { ConflictData, SyncResult } from './types';

/**
 * Maps offline action types to database decision types.
 */
const ACTION_TO_DECISION_TYPE = {
  approve: DECISION_TYPES.APPROVED,
  approve_with_constraint: DECISION_TYPES.APPROVED_WITH_CONSTRAINT,
  explore_alternatives: DECISION_TYPES.EXPLORE_ALTERNATIVES,
} as const;

/**
 * Maps offline action types to question status values.
 */
const ACTION_TO_QUESTION_STATUS = {
  approve: 'approved',
  approve_with_constraint: 'approved',
  explore_alternatives: 'exploring_alternatives',
} as const;

/**
 * Result of processing an action, including conflict data if detected.
 *
 * @see Story 8.4: Added conflict field
 */
export interface ProcessActionResult {
  /** The sync result type */
  result: SyncResult;
  /** Conflict data if result is 'conflict', null otherwise */
  conflict: ConflictData | null;
}

/**
 * Processes a single offline action by calling the appropriate repository methods.
 *
 * This replicates the behavior of useApproveDecision mutation:
 * 1. Get current user profile (for created_by)
 * 2. Check for conflicts (server updated since offline action created)
 * 3. Create decision via decisionsRepo.create()
 * 4. Update question status via questionsRepo.updateStatus()
 *
 * @param action - The offline action to process
 * @returns ProcessActionResult with SyncResult and optional ConflictData
 *
 * @example
 * ```typescript
 * const { result, conflict } = await processAction(action);
 * if (result === 'success') {
 *   // Action synced, invalidate cache
 * } else if (result === 'conflict') {
 *   // Show conflict dialog to user
 *   setState({ currentConflict: conflict });
 * } else if (result === 'retry') {
 *   // Network error, schedule retry with backoff
 * } else {
 *   // Permanent failure, mark as failed
 * }
 * ```
 *
 * @see Story 8.4: AC6 - Integration with Sync Engine
 */
export async function processAction(action: OfflineAction): Promise<ProcessActionResult> {
  try {
    // Step 1: Get current user profile
    const profile = await profilesRepo.getCurrent();
    if (!profile?.id) {
      // No authenticated user - retry in case of temporary auth issue
      // (token refresh, session renewal). Max retries will eventually fail it.
      console.warn('[sync/processor] No authenticated user, will retry');
      return { result: 'retry', conflict: null };
    }

    // Step 2: Check for conflict before proceeding
    const conflict = await detectConflict(action);
    if (conflict) {
      console.log(
        `[sync/processor] Conflict detected for question ${action.payload.questionId}, pausing sync`
      );
      return { result: 'conflict', conflict };
    }

    // Step 3: Create decision record
    await decisionsRepo.create({
      question_id: action.payload.questionId,
      decision_type: ACTION_TO_DECISION_TYPE[action.action],
      constraints: action.payload.constraints ?? null,
      constraint_context: action.payload.constraintContext ?? null,
      reasoning: action.payload.reasoning ?? null,
      created_by: profile.id,
    });

    // Step 4: Update question status
    await questionsRepo.updateStatus(
      action.payload.questionId,
      ACTION_TO_QUESTION_STATUS[action.action]
    );

    return { result: 'success', conflict: null };
  } catch (error) {
    // Classify error as retryable or permanent
    if (isNetworkError(error)) {
      console.warn('[sync/processor] Network error, will retry:', error);
      return { result: 'retry', conflict: null };
    }

    // Validation errors, not found, auth errors are permanent
    console.error('[sync/processor] Permanent error:', error);
    return { result: 'failed', conflict: null };
  }
}

/**
 * Determines if an error is a network error that should trigger retry.
 *
 * Network errors include:
 * - TypeError with 'fetch' in message (fetch API failures)
 * - Errors containing network-related keywords
 *
 * Non-retryable errors include:
 * - 400 Bad Request (validation)
 * - 401 Unauthorized (auth)
 * - 403 Forbidden (permissions)
 * - 404 Not Found (resource missing)
 * - 422 Unprocessable Entity (validation)
 *
 * @param error - The error to classify
 * @returns true if error is likely a network issue
 */
function isNetworkError(error: unknown): boolean {
  // TypeError from fetch API typically indicates network failure
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const networkKeywords = [
      'network',
      'timeout',
      'connection',
      'offline',
      'failed to fetch',
      'net::',
      'econnrefused',
      'econnreset',
      'enotfound',
    ];

    return networkKeywords.some((keyword) => message.includes(keyword));
  }

  return false;
}
