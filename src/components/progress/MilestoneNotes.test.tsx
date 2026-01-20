import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';


import {
  useDeleteMilestoneNote,
  useMilestoneNotes,
  useUpdateMilestoneNote,
} from '@/hooks/milestones';

import { MilestoneNotes } from './MilestoneNotes';

import type { MilestoneNote } from '@/types';

// Mock hooks
vi.mock('@/hooks/milestones', () => ({
  useMilestoneNotes: vi.fn(),
  useUpdateMilestoneNote: vi.fn(),
  useDeleteMilestoneNote: vi.fn(),
  useCreateMilestoneNote: vi.fn(),
}));

vi.mock('@/hooks/auth', () => ({
  useProfile: vi.fn(() => ({
    data: { id: 'user-1', role: 'maho' },
    isLoading: false,
    error: null,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createMockNote = (overrides?: Partial<MilestoneNote>): MilestoneNote => ({
  id: 'note-1',
  milestone_id: 'milestone-1',
  content: 'Test note',
  created_by: 'user-1',
  created_at: '2025-01-01T12:00:00Z',
  updated_at: '2025-01-01T12:00:00Z',
  ...overrides,
});

describe('MilestoneNotes', () => {
  let queryClient: QueryClient;
  const mockUpdateMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.mocked(useMilestoneNotes).mockReturnValue({
      data: [createMockNote()],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMilestoneNotes>);

     
    vi.mocked(useUpdateMilestoneNote).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    } as any);

     
    vi.mocked(useDeleteMilestoneNote).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as any);
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('renders Notes heading', () => {
    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('renders NotesList and AddNoteSection', () => {
    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    expect(screen.getByTestId('add-note-button')).toBeInTheDocument();
  });

  it('calls update mutation when note is updated', async () => {
    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    await userEvent.click(screen.getByTestId('note-edit-button'));

    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Updated content');
    await userEvent.click(screen.getByText('Save'));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      {
        noteId: 'note-1',
        milestoneId: 'milestone-1',
        input: { content: 'Updated content' },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('shows success toast on update', async () => {
    const mockMutateWithSuccess = vi.fn((input, { onSuccess }) => {
      onSuccess?.();
    });

     
    vi.mocked(useUpdateMilestoneNote).mockReturnValue({
      mutate: mockMutateWithSuccess,
      isPending: false,
    } as any);

    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    await userEvent.click(screen.getByTestId('note-edit-button'));

    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Updated');
    await userEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Note updated');
    });
  });

  it('shows error toast on update failure', async () => {
    const mockMutateWithError = vi.fn((input, { onError }) => {
      onError?.(new Error('Failed'));
    });

     
    vi.mocked(useUpdateMilestoneNote).mockReturnValue({
      mutate: mockMutateWithError,
      isPending: false,
    } as any);

    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    await userEvent.click(screen.getByTestId('note-edit-button'));

    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Updated');
    await userEvent.click(screen.getByText('Save'));

    expect(toast.error).toHaveBeenCalledWith('Failed to update note');
  });

  it('calls delete mutation when note is deleted', async () => {
    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    await userEvent.click(screen.getByTestId('note-delete-button'));
    await userEvent.click(screen.getByTestId('note-delete-confirm'));

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      { noteId: 'note-1', milestoneId: 'milestone-1' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('shows success toast on delete', async () => {
    const mockMutateWithSuccess = vi.fn((input, { onSuccess }) => {
      onSuccess?.();
    });

     
    vi.mocked(useDeleteMilestoneNote).mockReturnValue({
      mutate: mockMutateWithSuccess,
      isPending: false,
    } as any);

    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    await userEvent.click(screen.getByTestId('note-delete-button'));
    await userEvent.click(screen.getByTestId('note-delete-confirm'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Note deleted');
    });
  });

  it('shows error toast on delete failure', async () => {
    const mockMutateWithError = vi.fn((input, { onError }) => {
      onError?.(new Error('Failed'));
    });

     
    vi.mocked(useDeleteMilestoneNote).mockReturnValue({
      mutate: mockMutateWithError,
      isPending: false,
    } as any);

    renderWithProviders(<MilestoneNotes milestoneId="milestone-1" />);

    await userEvent.click(screen.getByTestId('note-delete-button'));
    await userEvent.click(screen.getByTestId('note-delete-confirm'));

    expect(toast.error).toHaveBeenCalledWith('Failed to delete note');
  });
});
