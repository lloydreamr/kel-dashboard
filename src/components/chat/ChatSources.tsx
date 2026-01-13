'use client';

/**
 * ChatSources Component
 *
 * Displays source citations as clickable links.
 * Links navigate to entity detail pages in market-intelligence.
 *
 * Story 15.3: Ask AI Chat Interface
 */

import Link from 'next/link';

import type { ChatSource } from '@/lib/ai/types';

export type ChatSourcesProps = {
  /** Array of sources to display */
  sources: ChatSource[];
};

/**
 * Maps document type to route segment
 */
function getRouteSegment(documentType: string): string {
  // documentType comes from embeddings: 'companies', 'products', 'trends', 'consumers'
  // Route segments match: /market-intelligence/companies/[id]
  return documentType;
}

export function ChatSources({ sources }: ChatSourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="chat-sources"
      className="mt-2 pt-2 border-t border-border/50"
    >
      <p className="text-xs text-muted-foreground mb-1">Sources:</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <Link
            key={source.documentId}
            href={`/market-intelligence/${getRouteSegment(source.documentType)}/${source.documentId}`}
            data-testid={`chat-source-${source.documentId}`}
            className="text-xs text-muted-foreground hover:text-primary underline min-h-[24px] inline-flex items-center"
          >
            {source.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
