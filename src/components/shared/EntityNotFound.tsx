'use client';

/**
 * EntityNotFound Component
 *
 * Friendly 404-style message for when an entity doesn't exist.
 * Includes link back to the browse page.
 */

import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EntityNotFoundProps = {
  /** Type of entity (e.g., "company", "product", "research document") */
  entityType: string;
  /** URL to navigate back to (browse page) */
  backHref: string;
  /** Label for back button (e.g., "Browse Companies") */
  backLabel: string;
  /** Additional CSS classes */
  className?: string;
};

export function EntityNotFound({
  entityType,
  backHref,
  backLabel,
  className,
}: EntityNotFoundProps) {
  return (
    <div
      data-testid="entity-not-found"
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] text-center px-4',
        className
      )}
    >
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">{entityType} Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The {entityType.toLowerCase()} you&apos;re looking for doesn&apos;t exist or may
        have been removed.
      </p>
      <Button asChild className="min-h-[48px]" data-testid="entity-not-found-back-button">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
