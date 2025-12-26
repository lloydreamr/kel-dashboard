import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProfile } from '@/hooks/auth';

import { NoteItem } from './NoteItem';

import type { MilestoneNote, Profile } from '@/types';

// INLINE factory functions (project pattern)
const createMockNote = (overrides?: Partial<MilestoneNote>): MilestoneNote => ({
  id: 'note-123',
  milestone_id: 'milestone-456',
  content: 'This is a test note',
  created_by: 'user-789',
  created_at: '2025-01-01T12:00:00Z',
  updated_at: '2025-01-01T12:00:00Z',
  ...overrides,
});

const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'user-789',
  email: 'maho@example.com',
  role: 'maho',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

// Mock hooks
vi.mock('@/hooks/auth', () => ({
  useProfile: vi.fn(),
}));

describe('NoteItem', () => {
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

  it('renders note content and timestamp', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile(),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ content: 'My test note' });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    expect(screen.getByText('My test note')).toBeInTheDocument();
    expect(screen.getByTestId('note-item')).toBeInTheDocument();
  });

  it('shows edit/delete buttons when user is owner', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789' });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    expect(screen.getByTestId('note-edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('note-delete-button')).toBeInTheDocument();
  });

  it('hides edit/delete buttons when user is not owner (AC5)', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'different-user' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789' });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    expect(screen.queryByTestId('note-edit-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('note-delete-button')).not.toBeInTheDocument();
  });

  it('shows "You" for own notes and other user name for others', () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789', role: 'maho' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const ownNote = createMockNote({ created_by: 'user-789' });
    const { rerender } = renderWithProviders(
      <NoteItem
        note={ownNote}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    expect(screen.getByText('You')).toBeInTheDocument();

    // Other user's note (Maho viewing Kel's note)
    const otherNote = createMockNote({ created_by: 'other-user' });
    rerender(
      <QueryClientProvider client={queryClient}>
        <NoteItem
          note={otherNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onEditSuccessConsumed={mockOnEditSuccessConsumed}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Kel')).toBeInTheDocument();
  });

  it('enters edit mode when edit button clicked', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789' });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    await userEvent.click(screen.getByTestId('note-edit-button'));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onUpdate with new content when save clicked', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({
      id: 'note-123',
      created_by: 'user-789',
      content: 'Original',
    });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    await userEvent.click(screen.getByTestId('note-edit-button'));
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Updated content');
    await userEvent.click(screen.getByText('Save'));

    expect(mockOnUpdate).toHaveBeenCalledWith('note-123', 'Updated content');
  });

  it('does not call onUpdate if content unchanged', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({
      id: 'note-123',
      created_by: 'user-789',
      content: 'Unchanged',
    });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    await userEvent.click(screen.getByTestId('note-edit-button'));
    await userEvent.click(screen.getByText('Save'));

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('exits edit mode when Cancel clicked', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789', content: 'Original' });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    await userEvent.click(screen.getByTestId('note-edit-button'));
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Modified but cancelled');
    await userEvent.click(screen.getByText('Cancel'));

    // Should exit edit mode and revert content
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('closes edit mode when editSuccess becomes true', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789', content: 'Test' });
    const { rerender } = renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        editSuccess={false}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    // Enter edit mode first
    await userEvent.click(screen.getByTestId('note-edit-button'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    // Should exit edit mode on editSuccess
    rerender(
      <QueryClientProvider client={queryClient}>
        <NoteItem
          note={note}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          editSuccess={true}
          onEditSuccessConsumed={mockOnEditSuccessConsumed}
        />
      </QueryClientProvider>
    );

    expect(mockOnEditSuccessConsumed).toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('opens delete dialog when delete button clicked', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789' });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    await userEvent.click(screen.getByTestId('note-delete-button'));

    expect(screen.getByTestId('note-delete-dialog')).toBeInTheDocument();
  });

  it('disables save button when content is empty', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789', content: 'Test' });
    renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    await userEvent.click(screen.getByTestId('note-edit-button'));
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('shows loading state during update', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789' });
    const { rerender } = renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    // Enter edit mode
    await userEvent.click(screen.getByTestId('note-edit-button'));

    // Re-render with isUpdating=true
    rerender(
      <QueryClientProvider client={queryClient}>
        <NoteItem
          note={note}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          isUpdating={true}
          onEditSuccessConsumed={mockOnEditSuccessConsumed}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('keeps edit mode open when editSuccess is false (mutation failed)', async () => {
    vi.mocked(useProfile).mockReturnValue({
      data: createMockProfile({ id: 'user-789' }),
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProfile>);

    const note = createMockNote({ created_by: 'user-789', content: 'Original' });
    const { rerender } = renderWithProviders(
      <NoteItem
        note={note}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        editSuccess={false}
        onEditSuccessConsumed={mockOnEditSuccessConsumed}
      />
    );

    // Enter edit mode
    await userEvent.click(screen.getByTestId('note-edit-button'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    // Mutation completes but fails (editSuccess stays false, isUpdating becomes false)
    rerender(
      <QueryClientProvider client={queryClient}>
        <NoteItem
          note={note}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          editSuccess={false}
          isUpdating={false}
          onEditSuccessConsumed={mockOnEditSuccessConsumed}
        />
      </QueryClientProvider>
    );

    // Edit mode should REMAIN OPEN so user doesn't lose their changes
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(mockOnEditSuccessConsumed).not.toHaveBeenCalled();
  });
});
