/**
 * Chat Store
 *
 * Zustand store for AI chat state.
 * Maintains conversation history during browser session (not persisted).
 * Uses pattern from pitchMode.ts.
 *
 * Story 15.3: Ask AI Chat Interface
 *
 * @see useChatStore hook for component usage
 */

import { create } from 'zustand';

import type { UIMessage } from '@ai-sdk/react';

/**
 * Extended chat message with optional metadata
 * Extends AI SDK UIMessage type with source and confidence info
 *
 * Story 15.5: Added createdAt for export formatting
 */
export interface ChatMessage extends UIMessage {
  /** Optional confidence level from AI response */
  confidence?: 'High' | 'Medium' | 'Low';
  /** Message creation timestamp (may be undefined for older messages) */
  createdAt?: Date;
}

interface ChatState {
  /** Array of chat messages in conversation (session-only) */
  messages: ChatMessage[];
  /** Whether AI is currently streaming a response */
  isStreaming: boolean;
}

interface ChatActions {
  /** Add a new message to the conversation */
  addMessage: (message: ChatMessage) => void;
  /** Replace all messages (used by useChat sync) */
  setMessages: (messages: ChatMessage[]) => void;
  /** Clear all messages and start fresh */
  clearMessages: () => void;
  /** Set streaming state */
  setIsStreaming: (value: boolean) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()((set) => ({
  // Initial state - empty conversation, not streaming
  messages: [],
  isStreaming: false,

  // Actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
  setIsStreaming: (value) => set({ isStreaming: value }),
}));

// Export types for consumers
export type { ChatState, ChatActions, ChatStore };
