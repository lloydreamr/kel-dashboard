'use client';

import Image from 'next/image';

import { extractDomain } from '@/types/evidence';

import type { Evidence } from '@/types/evidence';

interface EvidenceItemProps {
  evidence: Evidence;
  /** 1-based index for display (1, 2, 3...) */
  number: number;
  /** Called when item is clicked (opens panel) */
  onClick?: () => void;
  /** Whether to show edit/remove actions (Maho only) */
  canModify?: boolean;
  /** Called when edit button is clicked */
  onEdit?: () => void;
  /** Called when remove button is clicked */
  onRemove?: () => void;
}

/**
 * Single evidence item card with optional action buttons.
 * Shows favicon, title, domain, and optional excerpt.
 * Clicking opens the evidence panel (Story 3.4).
 */
export function EvidenceItem({
  evidence,
  number,
  onClick,
  canModify = false,
  onEdit,
  onRemove,
}: EvidenceItemProps) {
  const domain = extractDomain(evidence.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  // Handle edit click - prevent event bubbling to onClick
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  // Handle remove click - prevent event bubbling to onClick
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        data-testid="evidence-item"
        className="flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left min-h-[48px] transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label={`View evidence: ${evidence.title}`}
      >
        {/* Number badge */}
        <span
          data-testid="evidence-number"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
        >
          {number}
        </span>

        {/* Favicon */}
        <Image
          src={faviconUrl}
          alt=""
          width={16}
          height={16}
          unoptimized
          data-testid="evidence-favicon"
          className="mt-0.5 flex-shrink-0 rounded"
        />

        {/* Content */}
        <div className="flex-1 min-w-0 pr-16">
          <h4
            data-testid="evidence-title"
            className="font-medium text-foreground truncate"
          >
            {evidence.title}
          </h4>
          <p
            data-testid="evidence-domain"
            className="text-sm text-muted-foreground truncate"
          >
            {domain}
          </p>
          {evidence.excerpt && (
            <p
              data-testid="evidence-excerpt"
              className="mt-1 text-sm text-muted-foreground line-clamp-2"
            >
              {evidence.excerpt}
            </p>
          )}
        </div>

        {/* Chevron indicator */}
        <svg
          className="h-5 w-5 flex-shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Action buttons - Maho only */}
      {canModify && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleEditClick}
            data-testid="evidence-edit-button"
            className="flex h-[48px] w-[48px] items-center justify-center rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Edit evidence: ${evidence.title}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleRemoveClick}
            data-testid="evidence-remove-button"
            className="flex h-[48px] w-[48px] items-center justify-center rounded-md bg-muted/80 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Remove evidence: ${evidence.title}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
