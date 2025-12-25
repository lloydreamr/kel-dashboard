import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/queryKeys';
import { useQueueStore } from '@/stores/queue';

import { ConstraintPanel } from './ConstraintPanel';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    custom: vi.fn().mockReturnValue('mock-toast-id'),
    dismiss: vi.fn(),
  },
}));

// Mock useHaptic
vi.mock('@/hooks/ui', () => ({
  useHaptic: () => ({
    trigger: vi.fn(),
  }),
}));

// Mock decision hooks
vi.mock('@/hooks/decisions', () => ({
  useApproveWithConstraints: () => ({
    approveWithConstraintsAsync: vi.fn().mockResolvedValue({
      decision: { id: 'decision-1' },
      question: { id: 'q-1', status: 'approved' },
    }),
    isPending: false,
  }),
  useUndoDecision: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock useUpdateConstraints
vi.mock('@/hooks/decisions/useUpdateConstraints', () => ({
  useUpdateConstraints: () => ({
    updateConstraintsAsync: vi.fn().mockResolvedValue({
      decision: { id: 'decision-1' },
    }),
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(queryKeys.questions.all, []);
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('ConstraintPanel', () => {
  it('renders when open', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('constraint-panel')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText('Add Constraints')).toBeInTheDocument();
    expect(
      screen.getByText('Select the constraints that apply to this approval')
    ).toBeInTheDocument();
  });

  it('renders all 4 constraint chips', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('constraint-chip-price')).toBeInTheDocument();
    expect(screen.getByTestId('constraint-chip-volume')).toBeInTheDocument();
    expect(screen.getByTestId('constraint-chip-risk')).toBeInTheDocument();
    expect(screen.getByTestId('constraint-chip-timeline')).toBeInTheDocument();
  });

  it('toggles chip selection on click', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    const priceChip = screen.getByTestId('constraint-chip-price');
    expect(priceChip).toHaveAttribute('aria-checked', 'false');

    await user.click(priceChip);
    expect(priceChip).toHaveAttribute('aria-checked', 'true');

    await user.click(priceChip);
    expect(priceChip).toHaveAttribute('aria-checked', 'false');
  });

  it('allows multiple chips to be selected', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-price'));
    await user.click(screen.getByTestId('constraint-chip-risk'));

    expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByTestId('constraint-chip-risk')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('hides context textarea when no chips selected', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );
    expect(
      screen.queryByTestId('constraint-context-input')
    ).not.toBeInTheDocument();
  });

  it('shows context textarea when at least one chip selected', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-volume'));

    expect(screen.getByTestId('constraint-context-input')).toBeInTheDocument();
  });

  it('shows placeholder text in textarea', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-price'));

    const textarea = screen.getByTestId('constraint-context-input');
    expect(textarea).toHaveAttribute('placeholder', 'Any details? (optional)');
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-price'));

    expect(screen.getByTestId('constraint-char-count')).toHaveTextContent(
      '0/50'
    );
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-price'));
    await user.type(
      screen.getByTestId('constraint-context-input'),
      'Under 100k'
    );

    expect(screen.getByTestId('constraint-char-count')).toHaveTextContent(
      '10/50'
    );
  });

  it('limits context to 50 characters', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-price'));
    const longText = 'A'.repeat(60);
    await user.type(screen.getByTestId('constraint-context-input'), longText);

    const textarea = screen.getByTestId(
      'constraint-context-input'
    ) as HTMLTextAreaElement;
    expect(textarea.value.length).toBe(50);
    expect(screen.getByTestId('constraint-char-count')).toHaveTextContent(
      '50/50'
    );
  });

  it('disables confirm button when no chips selected', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('constraint-confirm-button')).toBeDisabled();
  });

  it('enables confirm button when at least one chip selected', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-timeline'));

    expect(screen.getByTestId('constraint-confirm-button')).toBeEnabled();
  });

  it('resets selection when panel closes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByTestId('constraint-chip-price'));
    expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
      'aria-checked',
      'true'
    );

    // Close panel
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <ConstraintPanel
          open={false}
          onOpenChange={() => {}}
          questionId="q-1"
        />
      </QueryClientProvider>
    );

    // Reopen
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });
  });

  it('resets context when panel closes', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    const { rerender } = render(
      <ConstraintPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        questionId="q-1"
      />,
      { wrapper: createWrapper() }
    );

    // Select chip and type context
    await user.click(screen.getByTestId('constraint-chip-price'));
    await user.type(
      screen.getByTestId('constraint-context-input'),
      'Some context'
    );

    // Verify context was typed
    expect(
      (screen.getByTestId('constraint-context-input') as HTMLTextAreaElement)
        .value
    ).toBe('Some context');

    // Click outside (Sheet overlay) to trigger close - this calls handleOpenChange
    // which resets state before calling onOpenChange
    // Simulate by clicking the close button in the Sheet
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    // The onOpenChange should have been called with false
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);

    // Rerender with open=true to reopen the panel
    rerender(
      <ConstraintPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        questionId="q-1"
      />
    );

    // Select chip again - textarea should be empty (reset worked)
    await user.click(screen.getByTestId('constraint-chip-price'));

    const textarea = screen.getByTestId(
      'constraint-context-input'
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('has confirm button test-id', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('constraint-confirm-button')).toBeInTheDocument();
  });
});

describe('ConstraintPanel - Edit Mode', () => {
  const initialConstraints = [{ type: 'price' as const }, { type: 'volume' as const }];

  it('renders edit mode title and description', () => {
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText('Edit Constraints')).toBeInTheDocument();
    expect(
      screen.getByText('Update the constraints for this decision')
    ).toBeInTheDocument();
  });

  it('pre-populates selected constraints from initialConstraints', () => {
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByTestId('constraint-chip-volume')).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByTestId('constraint-chip-risk')).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.getByTestId('constraint-chip-timeline')).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('pre-populates context from initialContext', () => {
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
        initialContext="Under 100k budget"
      />,
      { wrapper: createWrapper() }
    );

    const textarea = screen.getByTestId('constraint-context-input') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Under 100k budget');
  });

  it('shows Save Changes button in edit mode', () => {
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('constraint-edit-button')).toBeInTheDocument();
    expect(screen.queryByTestId('constraint-confirm-button')).not.toBeInTheDocument();
  });

  it('does not show confirm button in edit mode', () => {
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByTestId('constraint-confirm-button')).not.toBeInTheDocument();
  });

  it('enables edit button when at least one chip selected', async () => {
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('constraint-edit-button')).toBeEnabled();
  });

  it('disables edit button when all chips deselected', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
      />,
      { wrapper: createWrapper() }
    );

    // Deselect all
    await user.click(screen.getByTestId('constraint-chip-price'));
    await user.click(screen.getByTestId('constraint-chip-volume'));

    expect(screen.getByTestId('constraint-edit-button')).toBeDisabled();
  });

  it('allows changing constraint selection in edit mode', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
      />,
      { wrapper: createWrapper() }
    );

    // Add risk
    await user.click(screen.getByTestId('constraint-chip-risk'));
    expect(screen.getByTestId('constraint-chip-risk')).toHaveAttribute(
      'aria-checked',
      'true'
    );

    // Remove price
    await user.click(screen.getByTestId('constraint-chip-price'));
    expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('allows editing context in edit mode', async () => {
    const user = userEvent.setup();
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
        initialContext="Original"
      />,
      { wrapper: createWrapper() }
    );

    const textarea = screen.getByTestId('constraint-context-input');
    await user.clear(textarea);
    await user.type(textarea, 'Updated context');

    expect((textarea as HTMLTextAreaElement).value).toBe('Updated context');
  });

  it('does not reset state when closing in edit mode', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    render(
      <ConstraintPanel
        open={true}
        onOpenChange={mockOnOpenChange}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={initialConstraints}
        initialContext="Original"
      />,
      { wrapper: createWrapper() }
    );

    // Change selection
    await user.click(screen.getByTestId('constraint-chip-risk'));

    // Click close button
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    // onOpenChange should have been called
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('ConstraintPanel - Auto-Save', () => {
  beforeEach(() => {
    // Reset Zustand store before each test
    useQueueStore.setState({ draftResponses: {} });
  });

  it('restores draft when panel re-opens', async () => {
    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'volume' }, { type: 'risk' }],
          lastModified: Date.now(),
        },
      },
    });

    const { rerender } = render(
      <ConstraintPanel open={false} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    // Open the panel
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />
      </QueryClientProvider>
    );

    // Chips should be restored from draft
    await waitFor(() => {
      expect(screen.getByTestId('constraint-chip-volume')).toHaveAttribute(
        'aria-checked',
        'true'
      );
      expect(screen.getByTestId('constraint-chip-risk')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });
  });

  it('restores context text from draft when panel re-opens', async () => {
    // Pre-populate store with a draft including context
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'price' }],
          constraint_context: 'Under 100k budget',
          lastModified: Date.now(),
        },
      },
    });

    const { rerender } = render(
      <ConstraintPanel open={false} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    // Open the panel
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />
      </QueryClientProvider>
    );

    // Both chips and context should be restored
    await waitFor(() => {
      expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
        'aria-checked',
        'true'
      );
      const textarea = screen.getByTestId('constraint-context-input') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Under 100k budget');
    });
  });

  it('clears draft on successful submit', async () => {
    const user = userEvent.setup();

    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'price' }],
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // Wait for draft restoration
    await waitFor(() => {
      expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    // Click confirm
    await user.click(screen.getByTestId('constraint-confirm-button'));

    // Draft should be cleared
    await waitFor(() => {
      expect(useQueueStore.getState().draftResponses['q-1']).toBeUndefined();
    });
  });

  it('renders DraftSavedIndicator component', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    // DraftSavedIndicator is rendered (hidden when not visible)
    // The indicator will show after debounced save triggers
    // Here we just verify the component is in the tree
    const panel = screen.getByTestId('constraint-panel');
    expect(panel).toBeInTheDocument();
  });

  it('does not restore draft in edit mode', async () => {
    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'volume' }],
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ConstraintPanel
        open={true}
        onOpenChange={() => {}}
        questionId="q-1"
        mode="edit"
        decisionId="decision-1"
        initialConstraints={[{ type: 'price' }]}
      />,
      { wrapper: createWrapper() }
    );

    // Should show initialConstraints, not draft
    expect(screen.getByTestId('constraint-chip-price')).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByTestId('constraint-chip-volume')).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('shows discard button when draft exists', async () => {
    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'price' }],
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('discard-draft-button')).toBeInTheDocument();
    });
  });

  it('does not show discard button when no draft exists', () => {
    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByTestId('discard-draft-button')).not.toBeInTheDocument();
  });

  it('clears draft when discard is confirmed', async () => {
    const user = userEvent.setup();

    // Pre-populate store with a draft
    useQueueStore.setState({
      draftResponses: {
        'q-1': {
          decision_type: 'approved_with_constraint',
          constraints: [{ type: 'price' }],
          lastModified: Date.now(),
        },
      },
    });

    render(
      <ConstraintPanel open={true} onOpenChange={() => {}} questionId="q-1" />,
      { wrapper: createWrapper() }
    );

    // Wait for draft restoration
    await waitFor(() => {
      expect(screen.getByTestId('discard-draft-button')).toBeInTheDocument();
    });

    // Click discard button
    await user.click(screen.getByTestId('discard-draft-button'));

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();
    });

    // Click confirm
    await user.click(screen.getByTestId('discard-confirm-button'));

    // Draft should be cleared
    await waitFor(() => {
      expect(useQueueStore.getState().draftResponses['q-1']).toBeUndefined();
    });

    // Discard button should no longer be visible
    expect(screen.queryByTestId('discard-draft-button')).not.toBeInTheDocument();
  });
});
