import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMilestoneNotes } from '@/hooks/milestones';

import { NotesList } from './NotesList';

import type { MilestoneNote } from '@/types';

// Mock hooks
vi.mock('@/hooks/milestones', () => ({
  useMilestoneNotes: vi.fn(),
}));

vi.mock('@/hooks/auth', () => ({
  useProfile: vi.fn(() => ({
    data: { id: 'user-1', role: 'maho' },
    isLoading: false,
    error: null,
  })),
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

describe('NotesList', () => {
  let queryClient: QueryClient;
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnEditSuccessConsumed = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('shows loading skeleton while fetching', () => {
    vi.mocked(useMilestoneNotes).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useMilestoneNotes>);

    renderWithProviders(
      <NotesList
        milestoneId="milestone-1"
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    expect(screen.getByTestId('notes-list-skeleton')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading notes')).toBeInTheDocument();
  });

  it('shows empty state when no notes exist', () => {
     
    vi.mocked(useMilestoneNotes).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(
      <NotesList
        milestoneId="milestone-1"
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    expect(screen.getByTestId('notes-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('No notes yet. Add one to capture decisions.')
    ).toBeInTheDocument();
  });

  it('renders notes when they exist', () => {
    const notes = [
      createMockNote({ id: 'note-1', content: 'First note' }),
      createMockNote({ id: 'note-2', content: 'Second note' }),
    ];

    vi.mocked(useMilestoneNotes).mockReturnValue({
      data: notes,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMilestoneNotes>);

    renderWithProviders(
      <NotesList
        milestoneId="milestone-1"
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    expect(screen.getByTestId('notes-list')).toBeInTheDocument();
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  it('passes correct props to NoteItem components', () => {
    const notes = [createMockNote({ id: 'note-1' })];

    vi.mocked(useMilestoneNotes).mockReturnValue({
      data: notes,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMilestoneNotes>);

    renderWithProviders(
      <NotesList
        milestoneId="milestone-1"
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        updatingNoteId="note-1"
        deletingNoteId={null}
        editSuccessNoteId="note-1"
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    // NoteItem should render with the note
    expect(screen.getByTestId('note-item')).toBeInTheDocument();
  });
});
