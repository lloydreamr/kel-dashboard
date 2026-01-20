'use client';

/**
 * AskPageClient Component
 *
 * Main chat interface for asking questions about market intelligence.
 * Uses AI SDK v6's useChat hook with streaming responses from /api/ai/chat.
 *
 * Story 15.3: Ask AI Chat Interface
 * Story 15.4: Suggested Questions - expanded questions, direct submit
 * Story 15.5: Chat Export and Share - copy and new conversation features
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { toast } from 'sonner';

import { ChatHeader, ChatInput, ChatMessage, TypingIndicator, SuggestedQuestions } from '@/components/chat';
import { extractSourcesFromMessage, formatConversationForClipboard } from '@/lib/ai/formatConversation';
import { useChatStore } from '@/stores/chat';

/**
 * Suggested questions for empty state (Story 15.4 AC 1, 2)
 * Showcases AI capabilities: competitor, pricing, trend, comparison questions
 */
const SUGGESTED_QUESTIONS = [
  'Who are the main competitors in puffed snacks?',
  'What price point should Kel target for the 20-peso segment?',
  'What are the emerging flavor trends in Philippine snacks?',
  'Compare URC vs Oishi distribution reach',
  'What is URC\'s distribution network strategy?',
  'What product gaps exist in the Philippine snack market?',
];

export function AskPageClient() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Get stored messages for session persistence (AC 5)
  // Story 15.5: Include clearMessages for new conversation feature
  const {
    messages: storedMessages,
    setMessages: setStoredMessages,
    clearMessages,
  } = useChatStore();

  // Create transport with custom API endpoint and request preparation
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/chat',
    prepareSendMessagesRequest: async ({ messages: chatMessages }) => {
      // Extract question from the last user message
      const lastUserMessage = chatMessages.filter((m) => m.role === 'user').pop();
      // Extract text content from message parts
      let questionText = '';
      if (lastUserMessage?.parts) {
        for (const part of lastUserMessage.parts) {
          if (part.type === 'text') {
            questionText += part.text;
          }
        }
      }
      return {
        body: {
          question: questionText,
        },
      };
    },
  }), []);

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport,
    // Initialize with stored messages for session persistence (AC 5)
    // Note: AI SDK v5.0+ renamed initialMessages to messages
    messages: storedMessages,
    onError: (err) => {
      console.error('Chat error:', err);
      toast.error('Failed to send message. Please try again.');
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Sync messages to store for session persistence (AC 5)
  // This allows messages to persist when navigating away and back
  useEffect(() => {
    if (messages.length > 0) {
      setStoredMessages(messages);
    }
  }, [messages, setStoredMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const question = inputValue.trim();
    setInputValue('');

    await sendMessage({ text: question });
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Handle suggested question click - direct submit (Story 15.4 AC 3)
  const handleSuggestionClick = async (question: string) => {
    if (isStreaming) return; // Prevent double-submit
    setInputValue('');       // Clear input FIRST (prevents stale text)
    await sendMessage({ text: question });
  };

  // Story 15.5: Copy conversation to clipboard (AC 1, 2)
  const handleCopyConversation = async () => {
    const formattedText = formatConversationForClipboard(messages);
    try {
      await navigator.clipboard.writeText(formattedText);
      toast.success('Copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Story 15.5: Start new conversation (AC 3, 4, 5)
  const handleNewConversation = () => {
    clearMessages();
    setStoredMessages([]); // Critical: Force sync empty state to store (validation report issue #2)
  };

  // Show error state
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height))] p-8 text-center">
        <p className="text-destructive mb-4">Failed to load chat. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height))]">
      {/* Story 15.5: Chat header with copy and new conversation actions */}
      <ChatHeader
        onCopy={handleCopyConversation}
        onNewConversation={handleNewConversation}
        showActions={messages.length > 0}
        showClearConfirm={messages.length > 2}
      />

      {/* Messages area with aria-live for screen reader announcements */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSuggestionClick} disabled={isStreaming} />
        ) : (
          messages.map((message) => {
            // Extract sources from message parts for assistant messages
            const sources = message.role === 'assistant'
              ? extractSourcesFromMessage(message)
              : [];

            return (
              <ChatMessage
                key={message.id}
                message={message}
                sources={sources}
              />
            );
          })
        )}
        {isStreaming && <TypingIndicator />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t p-4 pb-safe">
        <form onSubmit={handleSubmit}>
          <ChatInput
            value={inputValue}
            onChange={handleInputChange}
            disabled={isStreaming}
            placeholder="Ask about market intelligence..."
          />
        </form>
      </div>
    </div>
  );
}

/**
 * Empty state with welcome message and suggested questions
 * Story 15.4: Uses extracted SuggestedQuestions component
 */
type EmptyStateProps = {
  onSuggestionClick: (question: string) => void;
  disabled?: boolean;
};

function EmptyState({ onSuggestionClick, disabled = false }: EmptyStateProps) {
  return (
    <div
      data-testid="chat-empty-state"
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-medium mb-2">Ask about Market Intelligence</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get insights from our knowledge base about companies, products,
        consumers, and market trends.
      </p>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Try asking:</p>
        <SuggestedQuestions
          questions={SUGGESTED_QUESTIONS}
          onQuestionClick={onSuggestionClick}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
