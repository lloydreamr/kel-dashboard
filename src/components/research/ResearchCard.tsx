'use client';

/**
 * ResearchCard Component
 *
 * Displays a research document summary with title, truncated summary, and category badge.
 * Clickable card that navigates to research doc detail page.
 */

import { useRouter } from 'next/navigation';

import { ResearchCategoryBadge } from './ResearchCategoryBadge';

import type { ResearchDoc } from '@/types';

interface ResearchCardProps {
  doc: ResearchDoc;
}

/** Maximum characters for summary before truncation */
const SUMMARY_MAX_LENGTH = 150;

function truncateSummary(summary: string | null): string | null {
  if (!summary) return null;
  if (summary.length <= SUMMARY_MAX_LENGTH) return summary;
  return summary.slice(0, SUMMARY_MAX_LENGTH).trimEnd() + '...';
}

export function ResearchCard({ doc }: ResearchCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/market-intelligence/research/${doc.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const truncatedSummary = truncateSummary(doc.summary);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open research: ${doc.title}`}
      className="border border-border rounded-lg p-4 cursor-pointer bg-surface hover:bg-muted/50 transition-colors min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid="research-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
          {truncatedSummary && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {truncatedSummary}
            </p>
          )}
        </div>
        <ResearchCategoryBadge category={doc.category} />
      </div>
    </div>
  );
}
