/**
 * Chat Store Tests
 *
 * Unit tests for the AI chat state management store.
 *
 * Story 15.3: Ask AI Chat Interface (Task 1)
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { useChatStore, type ChatMessage } from './chat';

// Mock message factory - UIMessage structure uses parts array, not content
function createMockMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  const defaultText = 'Test message';
  return {
    id: `msg-${Date.now()}`,
    role: 'user',
    parts: [{ type: 'text' as const, text: defaultText }],
    ...overrides,
  };
}

// Helper to extract text from message parts
function getMessageText(message: ChatMessage): string {
  if (!message.parts) return '';
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

describe('useChatStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useChatStore.setState({ messages: [], isStreaming: false });
  });

  describe('initial state', () => {
    it('starts with empty messages array', () => {
      // Arrange & Act
      const state = useChatStore.getState();

      // Assert
      expect(state.messages).toEqual([]);
    });

    it('starts with isStreaming false', () => {
      // Arrange & Act
      const state = useChatStore.getState();

      // Assert
      expect(state.isStreaming).toBe(false);
    });
  });

  describe('addMessage', () => {
    it('adds a message to the array', () => {
      // Arrange
      const message = createMockMessage({
        parts: [{ type: 'text' as const, text: 'Hello' }],
      });
      const { addMessage } = useChatStore.getState();

      // Act
      addMessage(message);

      // Assert
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(getMessageText(state.messages[0])).toBe('Hello');
    });

    it('appends multiple messages in order', () => {
      // Arrange
      const message1 = createMockMessage({
        id: '1',
        parts: [{ type: 'text' as const, text: 'First' }],
      });
      const message2 = createMockMessage({
        id: '2',
        parts: [{ type: 'text' as const, text: 'Second' }],
      });
      const { addMessage } = useChatStore.getState();

      // Act
      addMessage(message1);
      addMessage(message2);

      // Assert
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(2);
      expect(getMessageText(state.messages[0])).toBe('First');
      expect(getMessageText(state.messages[1])).toBe('Second');
    });
  });

  describe('setMessages', () => {
    it('replaces all messages', () => {
      // Arrange
      const initialMessage = createMockMessage({
        parts: [{ type: 'text' as const, text: 'Initial' }],
      });
      useChatStore.setState({ messages: [initialMessage] });

      const newMessages = [
        createMockMessage({
          id: '1',
          parts: [{ type: 'text' as const, text: 'New 1' }],
        }),
        createMockMessage({
          id: '2',
          parts: [{ type: 'text' as const, text: 'New 2' }],
        }),
      ];
      const { setMessages } = useChatStore.getState();

      // Act
      setMessages(newMessages);

      // Assert
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(2);
      expect(getMessageText(state.messages[0])).toBe('New 1');
      expect(getMessageText(state.messages[1])).toBe('New 2');
    });

    it('can set empty array', () => {
      // Arrange
      const message = createMockMessage();
      useChatStore.setState({ messages: [message] });
      const { setMessages } = useChatStore.getState();

      // Act
      setMessages([]);

      // Assert
      expect(useChatStore.getState().messages).toEqual([]);
    });
  });

  describe('clearMessages', () => {
    it('removes all messages', () => {
      // Arrange
      const messages = [
        createMockMessage({ id: '1' }),
        createMockMessage({ id: '2' }),
      ];
      useChatStore.setState({ messages });
      const { clearMessages } = useChatStore.getState();

      // Act
      clearMessages();

      // Assert
      expect(useChatStore.getState().messages).toEqual([]);
    });
  });

  describe('setIsStreaming', () => {
    it('sets isStreaming to true', () => {
      // Arrange
      const { setIsStreaming } = useChatStore.getState();

      // Act
      setIsStreaming(true);

      // Assert
      expect(useChatStore.getState().isStreaming).toBe(true);
    });

    it('sets isStreaming to false', () => {
      // Arrange
      useChatStore.setState({ isStreaming: true });
      const { setIsStreaming } = useChatStore.getState();

      // Act
      setIsStreaming(false);

      // Assert
      expect(useChatStore.getState().isStreaming).toBe(false);
    });
  });

  describe('session persistence behavior', () => {
    it('maintains messages across multiple state reads', () => {
      // Arrange
      const message = createMockMessage({
        parts: [{ type: 'text' as const, text: 'Persisted' }],
      });
      const { addMessage } = useChatStore.getState();

      // Act
      addMessage(message);

      // Assert - simulate navigation (re-read state)
      const state1 = useChatStore.getState();
      const state2 = useChatStore.getState();
      expect(state1.messages).toEqual(state2.messages);
      expect(getMessageText(state1.messages[0])).toBe('Persisted');
    });
  });
});
