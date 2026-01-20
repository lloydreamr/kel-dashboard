/**
 * Conflict detection and resolution for sync engine.
 *
 * Implements Server-Wins + Show Diff pattern (AR5):
 * - Detects when server data changed since offline action was created
 * - Provides resolution functions for user choices
 * - Auto-resolves to server-wins after 30 second timeout
 *
 * @see Story 8.4: Conflict Detection & Resolution
 */

import { FEATURES } from '@/lib/features';
import { deleteById, updateStatus } from '@/lib/offline';
import { decisionsRepo } from '@/lib/repositories/decisions';
import { questionsRepo } from '@/lib/repositories/questions';
import { DECISION_TYPES } from '@/types/decision';

import type { OfflineAction } from '@/lib/offline/types';
import type { ConflictData, ConflictResolution } from './types';

/**
 * Maps offline action types to database decision types.
 * Duplicated from processor.ts to avoid circular imports.
 */
const ACTION_TO_DECISION_TYPE = {
  approve: DECISION_TYPES.APPROVED,
  approve_with_constraint: DECISION_TYPES.APPROVED_WITH_CONSTRAINT,
  explore_alternatives: DECISION_TYPES.EXPLORE_ALTERNATIVES,
} as const;

/**
 * Maps offline action types to question status values.
 * Duplicated from processor.ts to avoid circular imports.
 */
const ACTION_TO_QUESTION_STATUS = {
  approve: 'approved',
  approve_with_constraint: 'approved',
  explore_alternatives: 'exploring_alternatives',
} as const;

/**
 * Detects if there's a conflict between an offline action and the server state.
 *
 * A conflict occurs when the server's question was updated AFTER the offline
 * action was created. This means someone (or the user on another device)
 * modified the question while this action was queued offline.
 *
 * Algorithm:
 * 1. Fetch current server state of the question
 * 2. Compare server's `updated_at` timestamp to action's `createdAt`
 * 3. If server is newer → conflict detected
 * 4. If action is newer or equal → no conflict, safe to proceed
 *
 * @param action - The offline action to check for conflicts
 * @returns ConflictData if conflict detected, null otherwise
 * @throws Error if question not found (treated as permanent failure in processor)
 *
 * @example
 * ```typescript
 * const conflict = await detectConflict(action);
 * if (conflict) {
 *   // Show conflict dialog to user
 *   setState({ currentConflict: conflict });
 * } else {
 *   // Safe to proceed with sync
 *   await processAction(action);
 * }
 * ```
 *
 * @see Story 8.4: AC1 - Conflict Detection
 */
export async function detectConflict(
  action: OfflineAction
): Promise<ConflictData | null> {
  // Guard: Feature flag check
  if (!FEATURES.OFFLINE_MODE) {
    return null;
  }

  // Fetch current server state
  const serverQuestion = await questionsRepo.getById(action.payload.questionId);

  // Compare timestamps: server's updated_at (ISO string) vs action's createdAt (Unix ms)
  const serverUpdatedAt = new Date(serverQuestion.updated_at).getTime();
  const actionCreatedAt = action.createdAt;

  // Conflict if server was updated AFTER the offline action was created
  if (serverUpdatedAt > actionCreatedAt) {
    console.log(
      `[sync/conflicts] Conflict detected for question ${action.payload.questionId}`,
      {
        serverUpdatedAt: new Date(serverUpdatedAt).toISOString(),
        actionCreatedAt: new Date(actionCreatedAt).toISOString(),
      }
    );

    return {
      serverState: serverQuestion,
      offlineAction: action,
      questionId: action.payload.questionId,
    };
  }

  // No conflict - safe to proceed
  return null;
}

/**
 * Resolves a conflict based on user's choice.
 *
 * Resolution behaviors:
 * - keep-mine: Force update server with offline decision (bypass timestamp check)
 * - keep-server: Discard offline action from queue, return server state
 * - cancel: Mark action back to pending, leave in queue for later
 *
 * @param conflict - The conflict data to resolve
 * @param resolution - User's choice for resolution
 * @param profileId - Current user's profile ID (for keep-mine scenario)
 * @returns The resolved question state (server state for keep-server/cancel, updated for keep-mine)
 *
 * @example
 * ```typescript
 * // User clicked "Keep Mine"
 * const result = await resolveConflict(conflict, 'keep-mine', profileId);
 * // Server now has user's offline decision
 *
 * // User clicked "Keep Server"
 * const result = await resolveConflict(conflict, 'keep-server', profileId);
 * // Offline action discarded, returns current server state
 *
 * // User clicked "Cancel"
 * const result = await resolveConflict(conflict, 'cancel', profileId);
 * // Action stays in queue for next sync attempt
 * ```
 *
 * @see Story 8.4: AC3 - User Resolution Options
 */
export async function resolveConflict(
  conflict: ConflictData,
  resolution: ConflictResolution,
  profileId: string
): Promise<void> {
  const { offlineAction, questionId } = conflict;
  const actionId = offlineAction.id;

  console.log(`[sync/conflicts] Resolving conflict for question ${questionId}`, {
    resolution,
    actionId,
  });

  switch (resolution) {
    case 'keep-mine': {
      // Force update: Apply offline action to server, ignoring timestamp conflict
      // This creates the decision and updates question status
      await decisionsRepo.create({
        question_id: questionId,
        decision_type: ACTION_TO_DECISION_TYPE[offlineAction.action],
        constraints: offlineAction.payload.constraints ?? null,
        constraint_context: offlineAction.payload.constraintContext ?? null,
        reasoning: offlineAction.payload.reasoning ?? null,
        created_by: profileId,
      });

      await questionsRepo.updateStatus(
        questionId,
        ACTION_TO_QUESTION_STATUS[offlineAction.action] as 'approved' | 'exploring_alternatives'
      );

      // Remove from queue - conflict resolved with user's version
      if (actionId !== undefined) {
        await deleteById(actionId);
      }

      console.log(`[sync/conflicts] Kept user's version for question ${questionId}`);
      break;
    }

    case 'keep-server': {
      // Server wins: Discard offline action, keep current server state
      if (actionId !== undefined) {
        await deleteById(actionId);
      }

      console.log(`[sync/conflicts] Kept server version, discarded offline action for question ${questionId}`);
      break;
    }

    case 'cancel': {
      // Cancel: Mark action back to pending, leave in queue
      // User can try again later or resolve differently
      if (actionId !== undefined) {
        await updateStatus(actionId, 'pending', offlineAction.retryCount, 'Conflict resolution cancelled');
      }

      console.log(`[sync/conflicts] Cancelled conflict resolution, action returned to queue for question ${questionId}`);
      break;
    }
  }
}
