'use client';

/**
 * ChatMessage Component
 *
 * Displays a single message in the chat conversation.
 * User messages are right-aligned with accent background.
 * Assistant messages are left-aligned with card styling.
 *
 * Story 15.3: Ask AI Chat Interface
 */

import type { UIMessage } from '@ai-sdk/react';

import type { ChatSource } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

import { ChatSources } from './ChatSources';

export type ChatMessageProps = {
  /** The message to display */
  message: UIMessage;
  /** Sources extracted from metadata (passed from parent) */
  sources?: ChatSource[];
  /** Additional CSS classes */
  className?: string;
};

export function ChatMessage({ message, sources = [], className }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Extract text content from message parts
  let textContent = '';
  if (message.parts) {
    for (const part of message.parts) {
      if (part.type === 'text') {
        textContent += part.text;
      }
    }
  }

  // Fallback if no text parts found
  if (!textContent && typeof message === 'object' && 'content' in message) {
    textContent = String((message as { content?: unknown }).content || '');
  }

  return (
    <div
      data-testid={`chat-message-${message.role}`}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start', className)}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border'
        )}
      >
        {/* Text content */}
        <p className="whitespace-pre-wrap">{textContent}</p>

        {/* Source citations (assistant messages only) */}
        {!isUser && sources.length > 0 && <ChatSources sources={sources} />}
      </div>
    </div>
  );
}
