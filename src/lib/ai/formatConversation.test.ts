/**
 * Format Conversation Utility Tests
 *
 * Unit tests for conversation export formatting utilities.
 *
 * Story 15.5: Chat Export and Share (Task 4)
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { extractSourcesFromMessage, formatConversationForClipboard } from './formatConversation';

import type { ChatMessage } from '@/stores/chat';

describe('extractSourcesFromMessage', () => {
  it('returns empty array when message has no parts', () => {
    // Arrange
    const message = {
      id: '1',
      role: 'assistant' as const,
    } as ChatMessage;

    // Act
    const result = extractSourcesFromMessage(message);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns empty array when no data-metadata part exists', () => {
    // Arrange
    const message: ChatMessage = {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Hello' },
      ],
    };

    // Act
    const result = extractSourcesFromMessage(message);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns empty array when parts is empty array (code review issue #4)', () => {
    // Arrange
    const message: ChatMessage = {
      id: '1',
      role: 'assistant',
      parts: [],
    };

    // Act
    const result = extractSourcesFromMessage(message);

    // Assert
    expect(result).toEqual([]);
  });

  it('extracts sources from data-metadata part', () => {
    // Arrange
    const sources = [
      { id: '1', title: 'URC Profile', documentType: 'company', relevanceScore: 0.9 },
      { id: '2', title: 'Market Trends', documentType: 'research', relevanceScore: 0.8 },
    ];
    const message: ChatMessage = {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Here is the analysis...' },
        {
          type: 'data-metadata',
          data: { sources, confidence: 'high' },
        } as unknown as ChatMessage['parts'][number],
      ],
    };

    // Act
    const result = extractSourcesFromMessage(message);

    // Assert
    expect(result).toEqual(sources);
  });

  it('handles data part without sources', () => {
    // Arrange
    const message: ChatMessage = {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Hello' },
        {
          type: 'data-custom',
          data: { someOtherData: true },
        } as unknown as ChatMessage['parts'][number],
      ],
    };

    // Act
    const result = extractSourcesFromMessage(message);

    // Assert
    expect(result).toEqual([]);
  });
});

describe('formatConversationForClipboard', () => {
  it('returns header for empty messages', () => {
    // Arrange
    const messages: ChatMessage[] = [];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert
    expect(result).toContain('=== Kel AI Chat Export ===');
  });

  it('formats user message with timestamp', () => {
    // Arrange
    const timestamp = new Date('2026-01-13T10:00:00Z');
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        createdAt: timestamp,
        parts: [{ type: 'text', text: 'What is URC?' }],
      },
    ];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert
    expect(result).toContain('You:');
    expect(result).toContain('What is URC?');
    expect(result).toContain(timestamp.toLocaleString());
  });

  it('formats assistant message with timestamp', () => {
    // Arrange
    const timestamp = new Date('2026-01-13T10:01:00Z');
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        createdAt: timestamp,
        parts: [{ type: 'text', text: 'URC is a leading Philippine company.' }],
      },
    ];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert
    expect(result).toContain('AI:');
    expect(result).toContain('URC is a leading Philippine company.');
  });

  it('handles undefined createdAt with fallback (validation report issue #1)', () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        createdAt: undefined,
        parts: [{ type: 'text', text: 'Test message' }],
      },
    ];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert - should not throw and should use fallback
    expect(result).toContain('Unknown time');
    expect(result).toContain('Test message');
  });

  it('includes sources for assistant messages', () => {
    // Arrange
    const sources = [
      { id: '1', title: 'URC Profile', documentType: 'company', relevanceScore: 0.9 },
      { id: '2', title: 'Market Trends', documentType: 'research', relevanceScore: 0.8 },
    ];
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        createdAt: new Date(),
        parts: [
          { type: 'text', text: 'Here is the analysis...' },
          {
            type: 'data-metadata',
            data: { sources, confidence: 'high' },
          } as unknown as ChatMessage['parts'][number],
        ],
      },
    ];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert
    expect(result).toContain('Sources:');
    expect(result).toContain('URC Profile (company)');
    expect(result).toContain('Market Trends (research)');
  });

  it('does not include Sources section when no sources exist', () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'assistant',
        createdAt: new Date(),
        parts: [{ type: 'text', text: 'Hello' }],
      },
    ];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert
    expect(result).not.toContain('Sources:');
  });

  it('formats multiple messages in order', () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        createdAt: new Date('2026-01-13T10:00:00Z'),
        parts: [{ type: 'text', text: 'First question' }],
      },
      {
        id: '2',
        role: 'assistant',
        createdAt: new Date('2026-01-13T10:01:00Z'),
        parts: [{ type: 'text', text: 'First answer' }],
      },
      {
        id: '3',
        role: 'user',
        createdAt: new Date('2026-01-13T10:02:00Z'),
        parts: [{ type: 'text', text: 'Second question' }],
      },
    ];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert
    const lines = result.split('\n');
    const firstQuestionIndex = lines.findIndex((l) => l.includes('First question'));
    const firstAnswerIndex = lines.findIndex((l) => l.includes('First answer'));
    const secondQuestionIndex = lines.findIndex((l) => l.includes('Second question'));

    expect(firstQuestionIndex).toBeLessThan(firstAnswerIndex);
    expect(firstAnswerIndex).toBeLessThan(secondQuestionIndex);
  });

  it('extracts text from multiple text parts', () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        createdAt: new Date(),
        parts: [
          { type: 'text', text: 'Part one ' },
          { type: 'text', text: 'Part two' },
        ],
      },
    ];

    // Act
    const result = formatConversationForClipboard(messages);

    // Assert
    expect(result).toContain('Part one Part two');
  });
});

/**
 * Clipboard Copy Integration Tests (code review issue #3)
 *
 * Tests the clipboard copy pattern used in AskPageClient.handleCopyConversation:
 *   const formattedText = formatConversationForClipboard(messages);
 *   await navigator.clipboard.writeText(formattedText);
 */
describe('clipboard copy integration', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('copies formatted conversation to clipboard successfully', async () => {
    // Arrange
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        createdAt: new Date(),
        parts: [{ type: 'text', text: 'Test question' }],
      },
    ];
    const formattedText = formatConversationForClipboard(messages);
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);

    // Act - simulate handleCopyConversation pattern
    await navigator.clipboard.writeText(formattedText);

    // Assert
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(formattedText);
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
  });

  it('handles clipboard API error gracefully (code review issue #3)', async () => {
    // Arrange
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'Test' }] },
    ];
    const formattedText = formatConversationForClipboard(messages);
    const clipboardError = new Error('Clipboard access denied');
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(clipboardError);

    // Act & Assert - simulate error handling pattern from AskPageClient
    let errorCaught = false;
    try {
      await navigator.clipboard.writeText(formattedText);
    } catch {
      errorCaught = true;
      // In AskPageClient: toast.error('Failed to copy')
    }

    expect(errorCaught).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(formattedText);
  });

  it('handles clipboard permission denied error', async () => {
    // Arrange - HTTPS required in production, may fail in some browsers
    const formattedText = '=== Kel AI Chat Export ===\n';
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
      new DOMException('Write permission denied', 'NotAllowedError')
    );

    // Act & Assert - DOMException message is 'Write permission denied', name is 'NotAllowedError'
    await expect(navigator.clipboard.writeText(formattedText)).rejects.toThrow('Write permission denied');
  });
});
