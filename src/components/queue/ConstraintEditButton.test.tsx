import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConstraintEditButton } from './ConstraintEditButton';

import type { Decision } from '@/types/decision';

// Mock haptic hook
const mockTrigger = vi.fn();
vi.mock('@/hooks/ui', () => ({
  useHaptic: () => ({ trigger: mockTrigger }),
}));

// Mock decisions repository
const mockUpdate = vi.fn();
vi.mock('@/lib/repositories/decisions', () => ({
  decisionsRepo: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockDecision: Decision = {
  id: 'decision-1',
  question_id: 'q-1',
  decision_type: 'approved_with_constraint',
  constraints: [{ type: 'volume' }],
  constraint_context: 'Updated',
  reasoning: null,
  created_by: 'user-1',
  incorporated_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('ConstraintEditButton', () => {
  const defaultProps = {
    decisionId: 'decision-1',
    questionId: 'q-1',
    constraints: [{ type: 'volume' as const }],
    context: 'Updated context',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue(mockDecision);
  });

  it('renders with "Save Changes" text', () => {
    render(<ConstraintEditButton {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('constraint-edit-button')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('triggers haptic feedback on click', async () => {
    const user = userEvent.setup();

    render(<ConstraintEditButton {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByTestId('constraint-edit-button'));

    expect(mockTrigger).toHaveBeenCalledWith('medium');
  });

  it('calls updateConstraints with correct parameters', async () => {
    const user = userEvent.setup();

    render(<ConstraintEditButton {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByTestId('constraint-edit-button'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('decision-1', {
        constraints: [{ type: 'volume' }],
        constraint_context: 'Updated context',
      });
    });
  });

  it('shows loading state during mutation', async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: Decision) => void;
    mockUpdate.mockReturnValue(
      new Promise<Decision>((resolve) => {
        resolveUpdate = resolve;
      })
    );

    render(<ConstraintEditButton {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByTestId('constraint-edit-button'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    resolveUpdate!(mockDecision);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(<ConstraintEditButton {...defaultProps} disabled />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('constraint-edit-button')).toBeDisabled();
  });

  it('is disabled during mutation', async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: Decision) => void;
    mockUpdate.mockReturnValue(
      new Promise<Decision>((resolve) => {
        resolveUpdate = resolve;
      })
    );

    render(<ConstraintEditButton {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByTestId('constraint-edit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('constraint-edit-button')).toBeDisabled();
    });

    resolveUpdate!(mockDecision);
  });

  it('calls onSuccess after successful update', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<ConstraintEditButton {...defaultProps} onSuccess={onSuccess} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByTestId('constraint-edit-button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onError when update fails', async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    mockUpdate.mockRejectedValue(new Error('Update failed'));

    render(<ConstraintEditButton {...defaultProps} onError={onError} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByTestId('constraint-edit-button'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('handles context as undefined', async () => {
    const user = userEvent.setup();

    render(
      <ConstraintEditButton
        decisionId="decision-1"
        questionId="q-1"
        constraints={[{ type: 'price' }]}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-edit-button'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('decision-1', {
        constraints: [{ type: 'price' }],
        constraint_context: null,
      });
    });
  });
});
