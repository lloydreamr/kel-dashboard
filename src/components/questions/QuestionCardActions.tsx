'use client';

/**
 * QuestionCardActions Component
 *
 * Kebab menu with quick actions (Edit, Archive, Delete) for question cards.
 * Only visible to Maho. Includes confirmation dialogs for destructive actions.
 */

import { Archive, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useArchiveQuestion } from '@/hooks/questions/useArchiveQuestion';
import { useDeleteQuestion } from '@/hooks/questions/useDeleteQuestion';

interface QuestionCardActionsProps {
  questionId: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Quick actions menu for question cards.
 *
 * Features:
 * - Edit: Navigates to question detail with ?edit=true
 * - Archive: Soft delete with confirmation
 * - Delete: Hard delete with confirmation
 *
 * @example
 * <QuestionCardActions
 *   questionId="123"
 *   onClick={(e) => e.stopPropagation()}
 * />
 */
export function QuestionCardActions({
  questionId,
  onClick,
}: QuestionCardActionsProps) {
  const router = useRouter();
  const { mutate: archiveQuestion, isPending: isArchiving } = useArchiveQuestion();
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    setIsMenuOpen(false);
    router.push(`/questions/${questionId}?edit=true`);
  };

  const handleArchiveClick = () => {
    setIsMenuOpen(false);
    setShowArchiveDialog(true);
  };

  const handleArchiveConfirm = () => {
    archiveQuestion(questionId, {
      onSuccess: () => {
        setShowArchiveDialog(false);
      },
    });
  };

  const handleDeleteClick = () => {
    setIsMenuOpen(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    deleteQuestion(questionId, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClick?.(e);
            }}
            className="p-2 rounded-md hover:bg-muted min-h-[48px] min-w-[48px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            data-testid="question-card-menu-trigger"
            aria-label="Question actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="min-h-[44px] cursor-pointer"
            data-testid="question-card-menu-edit"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleArchiveClick();
            }}
            className="min-h-[44px] cursor-pointer"
            data-testid="question-card-menu-archive"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick();
            }}
            className="min-h-[44px] cursor-pointer text-destructive focus:text-destructive"
            data-testid="question-card-menu-delete"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent data-testid="archive-question-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this question?</AlertDialogTitle>
            <AlertDialogDescription>
              The question will be moved to the archive. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="min-h-[48px] min-w-[100px]"
              data-testid="archive-question-cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={isArchiving}
              className="min-h-[48px] min-w-[100px]"
              data-testid="archive-question-confirm"
            >
              {isArchiving ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="delete-question-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="min-h-[48px] min-w-[100px]"
              data-testid="delete-question-cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="min-h-[48px] min-w-[100px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="delete-question-confirm"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
