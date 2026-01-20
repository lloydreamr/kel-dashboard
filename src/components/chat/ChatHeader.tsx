/**
 * ChatHeader Component
 *
 * Header with copy and new conversation actions for the chat interface.
 * Only shows when messages exist. Includes confirmation dialog for clearing
 * conversations with > 2 messages.
 *
 * Story 15.5: Chat Export and Share (AC 1-5)
 */

'use client';

import { Copy, RotateCcw } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export type ChatHeaderProps = {
  /** Handler for copy conversation action */
  onCopy: () => void;
  /** Handler for new conversation action */
  onNewConversation: () => void;
  /** Whether to show action buttons (when messages exist) */
  showActions: boolean;
  /** Whether to show confirmation dialog before clearing */
  showClearConfirm?: boolean;
};

/**
 * Chat header with export and clear actions
 *
 * AlertDialog has built-in keyboard accessibility:
 * - Enter confirms action
 * - Escape cancels/closes
 * - Focus is trapped within dialog
 */
export function ChatHeader({
  onCopy,
  onNewConversation,
  showActions,
  showClearConfirm = false,
}: ChatHeaderProps) {
  if (!showActions) return null;

  return (
    <div
      data-testid="chat-header"
      className="flex items-center justify-end gap-2 px-4 py-2 border-b"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        aria-label="Copy conversation"
        data-testid="copy-conversation-button"
        className="min-h-[48px] min-w-[48px]"
      >
        <Copy className="h-5 w-5" />
      </Button>

      {showClearConfirm ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="New conversation"
              data-testid="new-conversation-button"
              className="min-h-[48px] min-w-[48px]"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start new conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear your current conversation. You can copy it first
                if you want to save it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onNewConversation}>
                Start New
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewConversation}
          aria-label="New conversation"
          data-testid="new-conversation-button"
          className="min-h-[48px] min-w-[48px]"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
