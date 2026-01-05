import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { QuestionCardActions } from './QuestionCardActions';

// Mock hooks
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockArchiveMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('@/hooks/questions/useArchiveQuestion', () => ({
  useArchiveQuestion: () => ({
    mutate: mockArchiveMutate,
    isPending: false,
  }),
}));

vi.mock('@/hooks/questions/useDeleteQuestion', () => ({
  useDeleteQuestion: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

describe('QuestionCardActions', () => {
  const questionId = 'q-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('menu functionality', () => {
    it('renders menu trigger button', () => {
      render(<QuestionCardActions questionId={questionId} />);
      expect(screen.getByTestId('question-card-menu-trigger')).toBeInTheDocument();
    });

    it('opens menu on click', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));

      expect(screen.getByTestId('question-card-menu-edit')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-menu-archive')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-menu-delete')).toBeInTheDocument();
    });

    it('calls onClick handler to stop propagation', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();

      render(<QuestionCardActions questionId={questionId} onClick={onClickMock} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));

      expect(onClickMock).toHaveBeenCalled();
    });
  });

  describe('edit action', () => {
    it('navigates to question detail with edit query param', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-edit'));

      expect(mockPush).toHaveBeenCalledWith('/questions/q-123?edit=true');
    });
  });

  describe('archive action', () => {
    it('shows confirmation dialog when archive clicked', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-archive'));

      expect(screen.getByTestId('archive-question-dialog')).toBeInTheDocument();
      expect(screen.getByText('Archive this question?')).toBeInTheDocument();
    });

    it('calls archive mutation on confirm', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-archive'));
      await user.click(screen.getByTestId('archive-question-confirm'));

      expect(mockArchiveMutate).toHaveBeenCalledWith(questionId, expect.any(Object));
    });

    it('closes dialog on cancel', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-archive'));
      await user.click(screen.getByTestId('archive-question-cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('archive-question-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('delete action', () => {
    it('shows confirmation dialog when delete clicked', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-delete'));

      expect(screen.getByTestId('delete-question-dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete this question?')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it('calls delete mutation on confirm', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-delete'));
      await user.click(screen.getByTestId('delete-question-confirm'));

      expect(mockDeleteMutate).toHaveBeenCalledWith(questionId, expect.any(Object));
    });

    it('closes dialog on cancel', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-delete'));
      await user.click(screen.getByTestId('delete-question-cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('delete-question-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('click propagation', () => {
    it('stops event propagation on trigger click', async () => {
      const user = userEvent.setup();
      const parentClickHandler = vi.fn();

      render(
        <div onClick={parentClickHandler}>
          <QuestionCardActions questionId={questionId} />
        </div>
      );

      await user.click(screen.getByTestId('question-card-menu-trigger'));

      // Parent should not receive the click
      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('calls archive mutate with onSuccess callback', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-archive'));
      await user.click(screen.getByTestId('archive-question-confirm'));

      // Verify mutate was called with options including onSuccess
      expect(mockArchiveMutate).toHaveBeenCalledWith(
        questionId,
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });

    it('calls delete mutate with onSuccess callback', async () => {
      const user = userEvent.setup();
      render(<QuestionCardActions questionId={questionId} />);

      await user.click(screen.getByTestId('question-card-menu-trigger'));
      await user.click(screen.getByTestId('question-card-menu-delete'));
      await user.click(screen.getByTestId('delete-question-confirm'));

      // Verify mutate was called with options including onSuccess
      expect(mockDeleteMutate).toHaveBeenCalledWith(
        questionId,
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });
});
