'use client';

/**
 * ChatInput Component
 *
 * Message input with textarea and send button.
 * Enter submits, Shift+Enter for newlines.
 * Auto-focuses on mount. 48px touch targets.
 *
 * Story 15.3: Ask AI Chat Interface
 */

import { Send } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent, type ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type ChatInputProps = {
  /** Current input value */
  value: string;
  /** Called when input value changes */
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Whether input is disabled (AI is processing) */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
};

export function ChatInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'Ask about market intelligence...',
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle Enter to submit (Shift+Enter for newline)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Form will be submitted by the parent form's onSubmit
      const form = e.currentTarget.form;
      if (form && !disabled && value.trim()) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div data-testid="chat-input" className={cn('flex gap-2', className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 min-h-[48px] max-h-32 resize-none"
        rows={1}
        data-testid="chat-input-textarea"
        aria-label="Message input"
      />
      <Button
        type="submit"
        disabled={disabled || !value.trim()}
        size="icon"
        className="min-h-[48px] min-w-[48px]"
        data-testid="chat-send-button"
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
