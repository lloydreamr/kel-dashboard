/**
 * Format Conversation Utility
 *
 * Converts chat messages to a formatted text string for clipboard export.
 * Includes Q&A pairs, timestamps, and source citations.
 *
 * Story 15.5: Chat Export and Share (AC 1, 2)
 */

import type { ChatSource, ChatResponseMetadata } from './types';
import type { ChatMessage } from '@/stores/chat';

/**
 * Extract sources from message parts
 *
 * The 15.2 API sends sources via data-metadata custom parts:
 * { type: 'data-metadata', data: { sources: [...], confidence: '...' } }
 *
 * Moved from AskPageClient for reuse in export functionality.
 */
export function extractSourcesFromMessage(message: ChatMessage): ChatSource[] {
  if (!message.parts) return [];

  for (const part of message.parts) {
    // Look for data-metadata part which contains sources
    // AI SDK stores custom data parts with type starting with 'data-'
    if (part.type.startsWith('data-')) {
      const dataPartWithPayload = part as { type: string; data?: ChatResponseMetadata };
      if (dataPartWithPayload.data?.sources) {
        return dataPartWithPayload.data.sources;
      }
    }
  }

  return [];
}

/**
 * Format conversation for clipboard export
 *
 * Produces a formatted text version of the conversation including:
 * - Header identifying the export
 * - Each message with timestamp and role (You/AI)
 * - Source citations for AI responses
 *
 * @param messages - Array of chat messages to format
 * @returns Formatted text string ready for clipboard
 */
export function formatConversationForClipboard(messages: ChatMessage[]): string {
  const lines: string[] = ['=== Kel AI Chat Export ===', ''];

  for (const message of messages) {
    const role = message.role === 'user' ? 'You' : 'AI';
    // Handle undefined createdAt explicitly (critical fix from validation)
    const timestamp = message.createdAt
      ? new Date(message.createdAt).toLocaleString()
      : 'Unknown time';

    // Extract text content from message parts
    let textContent = '';
    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === 'text') {
          textContent += part.text;
        }
      }
    }

    lines.push(`[${timestamp}] ${role}:`);
    lines.push(textContent);

    // Include source citations for AI responses (AC requirement)
    if (message.role === 'assistant') {
      const sources = extractSourcesFromMessage(message);
      if (sources.length > 0) {
        lines.push('');
        lines.push('Sources:');
        sources.forEach((s) => lines.push(`  - ${s.title} (${s.documentType})`));
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
