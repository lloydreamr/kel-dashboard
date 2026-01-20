/**
 * Tests for ConflictDialog component.
 *
 * Tests cover:
 * - Dialog visibility based on conflict prop
 * - Display of offline and server versions
 * - Resolution button interactions
 * - Auto-resolve countdown behavior
 * - Disabled state during resolution
 *
 * @see Story 8.4: AC2 - ConflictDialog Display
 * @see Story 8.4: AC3 - User Resolution Options
 * @see Story 8.4: AC4 - Server-Wins Default
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConflictDialog } from './ConflictDialog';

import type { ConflictDialogProps } from './ConflictDialog';
import type { ConflictData } from '@/lib/sync';
import type { OfflineAction } from '@/lib/offline/types';
import type { Question } from '@/types/question';

// Mock feature flags
vi.mock('@/lib/features', () => ({
  FEATURES: { OFFLINE_MODE: true },
}));

// Mock sync config
vi.mock('@/lib/sync', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/sync')>();
  return {
    ...original,
    CONFLICT_CONFIG: {
      ...original.CONFLICT_CONFIG,
      AUTO_RESOLVE_TIMEOUT_MS: 5000, // 5 seconds for faster tests
      DEFAULT_RESOLUTION: 'keep-server' as const,
    },
  };
});

// Create mock conflict data
function createMockConflict(overrides: Partial<ConflictData> = {}): ConflictData {
  const mockAction: OfflineAction = {
    id: 1,
    action: 'approve',
    payload: {
      questionId: 'q-123',
      createdBy: 'user-456',
    },
    createdAt: Date.now() - 120000, // 2 minutes ago
    status: 'pending',
    retryCount: 0,
  };

  const mockServerQuestion: Question = {
    id: 'q-123',
    title: 'Test Question',
    context: 'Test context',
    status: 'approved',
    category: 'product',
    priority: 'medium',
    created_by: 'user-456',
    created_at: new Date(Date.now() - 180000).toISOString(),
    updated_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago (after action)
    organization_id: 'org-123',
  } as Question;

  return {
    questionId: 'q-123',
    offlineAction: mockAction,
    serverState: mockServerQuestion,
    ...overrides,
  };
}

describe('ConflictDialog', () => {
  let mockOnResolve: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnResolve = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderDialog = (props: Partial<ConflictDialogProps> = {}) => {
    const defaultProps: ConflictDialogProps = {
      conflict: createMockConflict(),
      onResolve: mockOnResolve,
      isResolving: false,
      autoResolveTimeoutMs: 5000,
      ...props,
    };
    return render(<ConflictDialog {...defaultProps} />);
  };

  describe('visibility', () => {
    it('renders when conflict is provided', () => {
      renderDialog();

      expect(screen.getByTestId('conflict-dialog')).toBeInTheDocument();
      expect(screen.getByText('Data Conflict Detected')).toBeInTheDocument();
    });

    it('does not render dialog content when conflict is null', () => {
      renderDialog({ conflict: null });

      expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument();
    });
  });

  describe('version display', () => {
    it('displays offline action details in Your Version section', () => {
      renderDialog();

      const yourVersion = screen.getByTestId('conflict-your-version');
      expect(yourVersion).toBeInTheDocument();
      expect(yourVersion).toHaveTextContent('YOUR VERSION (Offline)');
      expect(yourVersion).toHaveTextContent('Approved'); // ACTION_LABELS maps 'approve' to 'Approved'
    });

    it('displays server state details in Server Version section', () => {
      renderDialog();

      const serverVersion = screen.getByTestId('conflict-server-version');
      expect(serverVersion).toBeInTheDocument();
      expect(serverVersion).toHaveTextContent('SERVER VERSION (Current)');
      expect(serverVersion).toHaveTextContent('approved'); // status from serverState
    });

    it('displays constraints when present in action payload', () => {
      const conflictWithConstraints = createMockConflict();
      conflictWithConstraints.offlineAction.action = 'approve_with_constraint';
      conflictWithConstraints.offlineAction.payload.constraints = [
        { type: 'budget', context: '10k limit' },
      ];

      renderDialog({ conflict: conflictWithConstraints });

      const yourVersion = screen.getByTestId('conflict-your-version');
      expect(yourVersion).toHaveTextContent('Constraints:');
      expect(yourVersion).toHaveTextContent('budget: 10k limit');
    });
  });

  describe('resolution buttons', () => {
    it('renders all three resolution buttons', () => {
      renderDialog();

      expect(screen.getByTestId('conflict-keep-mine')).toBeInTheDocument();
      expect(screen.getByTestId('conflict-keep-server')).toBeInTheDocument();
      expect(screen.getByTestId('conflict-cancel')).toBeInTheDocument();
    });

    it('calls onResolve with "keep-mine" when Keep Mine is clicked', () => {
      renderDialog();

      fireEvent.click(screen.getByTestId('conflict-keep-mine'));

      expect(mockOnResolve).toHaveBeenCalledWith('keep-mine');
    });

    it('calls onResolve with "keep-server" when Keep Server is clicked', () => {
      renderDialog();

      fireEvent.click(screen.getByTestId('conflict-keep-server'));

      expect(mockOnResolve).toHaveBeenCalledWith('keep-server');
    });

    it('calls onResolve with "cancel" when Cancel is clicked', () => {
      renderDialog();

      fireEvent.click(screen.getByTestId('conflict-cancel'));

      expect(mockOnResolve).toHaveBeenCalledWith('cancel');
    });

    it('disables buttons when isResolving is true', () => {
      renderDialog({ isResolving: true });

      expect(screen.getByTestId('conflict-keep-mine')).toBeDisabled();
      expect(screen.getByTestId('conflict-keep-server')).toBeDisabled();
      expect(screen.getByTestId('conflict-cancel')).toBeDisabled();
    });
  });

  describe('auto-resolve countdown', () => {
    it('displays countdown text', () => {
      renderDialog({ autoResolveTimeoutMs: 5000 });

      const countdown = screen.getByTestId('conflict-countdown');
      expect(countdown).toHaveTextContent('Auto-resolving in 5 seconds...');
    });

    it('counts down each second', () => {
      renderDialog({ autoResolveTimeoutMs: 5000 });

      const countdown = screen.getByTestId('conflict-countdown');
      expect(countdown).toHaveTextContent('5 seconds');

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(countdown).toHaveTextContent('4 seconds');

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(countdown).toHaveTextContent('3 seconds');
    });

    it('auto-resolves to keep-server when countdown reaches 0', () => {
      renderDialog({ autoResolveTimeoutMs: 3000 });

      // Fast-forward to just before timeout
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(mockOnResolve).not.toHaveBeenCalled();

      // Final second triggers resolution
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(mockOnResolve).toHaveBeenCalledWith('keep-server');
    });

    it('pauses countdown when isResolving is true', () => {
      // Use a stable conflict reference
      const stableConflict = createMockConflict();

      const { rerender } = render(
        <ConflictDialog
          conflict={stableConflict}
          onResolve={mockOnResolve}
          isResolving={false}
          autoResolveTimeoutMs={5000}
        />
      );

      const countdown = screen.getByTestId('conflict-countdown');
      expect(countdown).toHaveTextContent('5 seconds');

      // Advance 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(countdown).toHaveTextContent('3 seconds');

      // Set isResolving=true with SAME conflict reference, countdown should pause
      rerender(
        <ConflictDialog
          conflict={stableConflict}
          onResolve={mockOnResolve}
          isResolving={true}
          autoResolveTimeoutMs={5000}
        />
      );

      // Advance more time - should NOT change since paused
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(countdown).toHaveTextContent('3 seconds');
      expect(mockOnResolve).not.toHaveBeenCalled();
    });

    it('resets countdown when conflict changes', () => {
      const { rerender } = render(
        <ConflictDialog
          conflict={createMockConflict()}
          onResolve={mockOnResolve}
          autoResolveTimeoutMs={5000}
        />
      );

      const countdown = screen.getByTestId('conflict-countdown');

      // Advance 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(countdown).toHaveTextContent('2 seconds');

      // New conflict arrives
      const newConflict = createMockConflict({ questionId: 'q-456' });
      rerender(
        <ConflictDialog
          conflict={newConflict}
          onResolve={mockOnResolve}
          autoResolveTimeoutMs={5000}
        />
      );

      // Countdown should reset
      expect(countdown).toHaveTextContent('5 seconds');
    });
  });

  describe('accessibility', () => {
    it('has proper dialog structure', () => {
      renderDialog();

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has descriptive title', () => {
      renderDialog();

      expect(screen.getByText('Data Conflict Detected')).toBeInTheDocument();
    });
  });
});
