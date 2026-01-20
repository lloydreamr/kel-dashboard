'use client';

/**
 * DetailPageHeader Component
 *
 * Shared header for all entity detail pages.
 * Includes back navigation, title, and optional badge.
 * Responsive layout with proper touch targets.
 */

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DetailPageHeaderProps = {
  /** Page title (entity name) */
  title: string;
  /** URL for back navigation */
  backHref: string;
  /** Label for back button (e.g., "Companies", "Products") */
  backLabel: string;
  /** Optional badge text (e.g., category) */
  badge?: string | null;
  /** Optional badge variant */
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
  /** Additional CSS classes */
  className?: string;
};

export function DetailPageHeader({
  title,
  backHref,
  backLabel,
  badge,
  badgeVariant = 'secondary',
  className,
}: DetailPageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      {/* Back navigation */}
      <Button
        variant="ghost"
        asChild
        className="min-h-[48px] min-w-[48px] -ml-2 gap-2"
        data-testid="detail-page-back-button"
      >
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only md:not-sr-only">Back to {backLabel}</span>
        </Link>
      </Button>

      {/* Title with optional badge */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
      </div>
    </header>
  );
}
