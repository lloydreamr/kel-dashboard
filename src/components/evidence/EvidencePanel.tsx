'use client';

import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { extractDomain, buildUrlWithAnchor } from '@/types/evidence';

import type { Evidence } from '@/types/evidence';

interface EvidencePanelProps {
  /** Evidence to display, or null to close panel */
  evidence: Evidence | null;
  /** Called when panel should close */
  onClose: () => void;
}

/**
 * Slide-over panel displaying evidence details.
 * Opens from right side, shows source metadata and open button.
 *
 * Features:
 * - Responsive width: full (mobile), 60% (tablet), 50% (desktop)
 * - Sage-colored header matching UX14 specification
 * - Copyable URL with feedback
 * - Open source button with 48px touch target
 */
export function EvidencePanel({ evidence, onClose }: EvidencePanelProps) {
  const [copied, setCopied] = useState(false);

  if (!evidence) return null;

  const domain = extractDomain(evidence.url);
  const fullUrl = buildUrlWithAnchor(evidence.url, evidence.section_anchor);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Show user-visible feedback for copy failure
      toast.error('Failed to copy URL to clipboard');
    }
  };

  const handleOpenSource = () => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Sheet open={!!evidence} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        data-testid="evidence-panel"
        className="w-full sm:w-[60%] lg:w-[50%] lg:max-w-[540px] overflow-y-auto"
        side="right"
      >
        {/* Sage-colored header matching UX14 - using green as approximation */}
        <SheetHeader
          data-testid="evidence-panel-header"
          className="bg-green-50/50 dark:bg-green-900/20 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <Image
              src={faviconUrl}
              alt=""
              width={24}
              height={24}
              className="rounded"
              unoptimized
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex-1 min-w-0">
              <SheetTitle
                data-testid="evidence-panel-title"
                className="text-lg font-semibold truncate"
              >
                {evidence.title}
              </SheetTitle>
              <SheetDescription
                data-testid="evidence-panel-domain"
                className="text-sm text-muted-foreground truncate"
              >
                {domain}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Full URL with copy button */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Source URL
            </label>
            <div className="flex items-center gap-2">
              <code
                data-testid="evidence-panel-url"
                className="flex-1 text-sm bg-muted px-3 py-2 rounded-md overflow-x-auto whitespace-nowrap"
              >
                {fullUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="min-h-[48px] min-w-[48px] shrink-0"
                aria-label="Copy URL"
              >
                {copied ? '✓' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Excerpt if provided */}
          {evidence.excerpt && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Excerpt
              </label>
              <blockquote
                data-testid="evidence-panel-excerpt"
                className="border-l-4 border-green-300 dark:border-green-600 pl-4 py-2 text-foreground italic bg-muted/30 rounded-r-md"
              >
                &quot;{evidence.excerpt}&quot;
              </blockquote>
            </div>
          )}

          {/* Section anchor info */}
          {evidence.section_anchor && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Section:</span>{' '}
              {evidence.section_anchor.replace('#', '')}
            </div>
          )}

          {/* Open Source button - primary action */}
          <Button
            data-testid="evidence-panel-open-source"
            onClick={handleOpenSource}
            className="w-full min-h-[48px]"
            size="lg"
          >
            Open Source
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
