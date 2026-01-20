/**
 * Tests for conflict detection and resolution.
 *
 * Tests cover:
 * - Conflict detection based on timestamp comparison
 * - Resolution: keep-mine (force user's version)
 * - Resolution: keep-server (discard offline action)
 * - Resolution: cancel (return action to queue)
 * - Feature flag behavior (OFFLINE_MODE=false)
 *
 * @see Story 8.4: Conflict Detection & Resolution
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { detectConflict, resolveConflict } from './conflicts';

import type { OfflineAction } from '@/lib/offline/types';
import type { ConflictData } from './types';
import type { Question } from '@/types/question';

// Mock feature flags - enabled by default
vi.mock('@/lib/features', () => ({
  FEATURES: { OFFLINE_MODE: true },
}));

// Mock offline queue operations
const mockDeleteById = vi.fn();
const mockUpdateStatus = vi.fn();
vi.mock('@/lib/offline', () => ({
  deleteById: (id: number) => mockDeleteById(id),
  updateStatus: (...args: unknown[]) => mockUpdateStatus(...args),
}));

// Mock repositories
const mockGetById = vi.fn();
const mockUpdateQuestionStatus = vi.fn();
const mockCreateDecision = vi.fn();

vi.mock('@/lib/repositories/questions', () => ({
  questionsRepo: {
    getById: (id: string) => mockGetById(id),
    updateStatus: (...args: unknown[]) => mockUpdateQuestionStatus(...args),
  },
}));

vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    create: (data: unknown) => mockCreateDecision(data),
  },
}));

// Sample offline action factory
function createMockAction(overrides: Partial<OfflineAction> = {}): OfflineAction {
  return {
    id: 1,
    action: 'approve',
    payload: {
      questionId: 'q-123',
      createdBy: 'user-456',
    },
    createdAt: Date.now() - 60000, // 1 minute ago
    status: 'pending',
    retryCount: 0,
    ...overrides,
  };
}

// Sample server question factory
function createMockQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-123',
    title: 'Test Question',
    context: 'Test context',
    status: 'pending',
    category: 'product',
    priority: 'medium',
    created_by: 'user-456',
    created_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    updated_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
    organization_id: 'org-123',
    ...overrides,
  } as Question;
}

describe('Conflict Detection', () => {
  beforeEach(() => {
    mockGetById.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectConflict', () => {
    it('returns null when server was not updated after action was created', async () => {
      // Action created 1 minute ago
      const action = createMockAction({
        createdAt: Date.now() - 60000,
      });

      // Server last updated 2 minutes ago (before action)
      const serverQuestion = createMockQuestion({
        updated_at: new Date(Date.now() - 120000).toISOString(),
      });
      mockGetById.mockResolvedValue(serverQuestion);

      const conflict = await detectConflict(action);

      expect(conflict).toBeNull();
      expect(mockGetById).toHaveBeenCalledWith('q-123');
    });

    it('returns ConflictData when server was updated after action was created', async () => {
      // Action created 2 minutes ago
      const action = createMockAction({
        createdAt: Date.now() - 120000,
      });

      // Server last updated 1 minute ago (after action)
      const serverQuestion = createMockQuestion({
        updated_at: new Date(Date.now() - 60000).toISOString(),
        status: 'approved',
      });
      mockGetById.mockResolvedValue(serverQuestion);

      const conflict = await detectConflict(action);

      expect(conflict).not.toBeNull();
      expect(conflict?.questionId).toBe('q-123');
      expect(conflict?.offlineAction).toBe(action);
      expect(conflict?.serverState).toBe(serverQuestion);
    });

    // Note: Feature flag disabled test requires separate test file with different mock
    // since vi.mock is hoisted. Testing with OFFLINE_MODE=true in this file.

    it('returns null when timestamps are equal (edge case)', async () => {
      const timestamp = Date.now() - 60000;

      const action = createMockAction({
        createdAt: timestamp,
      });

      const serverQuestion = createMockQuestion({
        updated_at: new Date(timestamp).toISOString(),
      });
      mockGetById.mockResolvedValue(serverQuestion);

      const conflict = await detectConflict(action);

      // Equal timestamps = no conflict (only greater triggers conflict)
      expect(conflict).toBeNull();
    });

    it('propagates errors from questionsRepo', async () => {
      const action = createMockAction();
      mockGetById.mockRejectedValue(new Error('Question not found'));

      await expect(detectConflict(action)).rejects.toThrow('Question not found');
    });
  });
});

describe('Conflict Resolution', () => {
  const profileId = 'profile-789';

  beforeEach(() => {
    mockDeleteById.mockReset().mockResolvedValue(undefined);
    mockUpdateStatus.mockReset().mockResolvedValue(undefined);
    mockCreateDecision.mockReset().mockResolvedValue({ id: 'decision-1' });
    mockUpdateQuestionStatus.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createConflict(actionOverrides: Partial<OfflineAction> = {}): ConflictData {
    const action = createMockAction(actionOverrides);
    const serverQuestion = createMockQuestion({
      updated_at: new Date(Date.now() - 30000).toISOString(),
      status: 'approved',
    });

    return {
      questionId: 'q-123',
      offlineAction: action,
      serverState: serverQuestion,
    };
  }

  describe('resolveConflict with keep-mine', () => {
    it('creates decision and updates question status', async () => {
      const conflict = createConflict();

      await resolveConflict(conflict, 'keep-mine', profileId);

      expect(mockCreateDecision).toHaveBeenCalledWith({
        question_id: 'q-123',
        decision_type: 'approved',
        constraints: null,
        constraint_context: null,
        reasoning: null,
        created_by: profileId,
      });
      expect(mockUpdateQuestionStatus).toHaveBeenCalledWith('q-123', 'approved');
    });

    it('includes constraints when present in action', async () => {
      const conflict = createConflict({
        action: 'approve_with_constraint',
        payload: {
          questionId: 'q-123',
          createdBy: 'user-456',
          constraints: [{ type: 'budget', context: '10k limit' }],
          constraintContext: 'Additional context',
        },
      });

      await resolveConflict(conflict, 'keep-mine', profileId);

      expect(mockCreateDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'budget', context: '10k limit' }],
          constraint_context: 'Additional context',
        })
      );
    });

    it('removes action from offline queue', async () => {
      const conflict = createConflict({ id: 42 });

      await resolveConflict(conflict, 'keep-mine', profileId);

      expect(mockDeleteById).toHaveBeenCalledWith(42);
    });

    it('handles explore_alternatives action type', async () => {
      const conflict = createConflict({
        action: 'explore_alternatives',
        payload: {
          questionId: 'q-123',
          createdBy: 'user-456',
          reasoning: 'Need more options',
        },
      });

      await resolveConflict(conflict, 'keep-mine', profileId);

      expect(mockCreateDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          decision_type: 'explore_alternatives',
          reasoning: 'Need more options',
        })
      );
      expect(mockUpdateQuestionStatus).toHaveBeenCalledWith('q-123', 'exploring_alternatives');
    });
  });

  describe('resolveConflict with keep-server', () => {
    it('deletes the offline action without updating server', async () => {
      const conflict = createConflict({ id: 42 });

      await resolveConflict(conflict, 'keep-server', profileId);

      expect(mockDeleteById).toHaveBeenCalledWith(42);
      expect(mockCreateDecision).not.toHaveBeenCalled();
      expect(mockUpdateQuestionStatus).not.toHaveBeenCalled();
    });
  });

  describe('resolveConflict with cancel', () => {
    it('returns action to pending status in queue', async () => {
      const conflict = createConflict({ id: 42, retryCount: 2 });

      await resolveConflict(conflict, 'cancel', profileId);

      expect(mockUpdateStatus).toHaveBeenCalledWith(
        42,
        'pending',
        2,
        'Conflict resolution cancelled'
      );
      expect(mockDeleteById).not.toHaveBeenCalled();
      expect(mockCreateDecision).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles action without id (undefined)', async () => {
      const conflict = createConflict({ id: undefined });

      // Should not throw
      await resolveConflict(conflict, 'keep-server', profileId);

      expect(mockDeleteById).not.toHaveBeenCalled();
    });
  });
});
