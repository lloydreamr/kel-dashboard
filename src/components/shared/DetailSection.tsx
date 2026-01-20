'use client';

/**
 * DetailSection Component
 *
 * Labeled section for detail pages with collapsible behavior on mobile.
 * Uses Accordion on mobile for space efficiency.
 */

import type { ReactNode } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export type DetailSectionProps = {
  /** Section title/label */
  title: string;
  /** Section content */
  children: ReactNode;
  /** Whether to use collapsible behavior on mobile (default: true) */
  collapsibleOnMobile?: boolean;
  /** Whether mobile accordion starts expanded (default: true) */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
};

export function DetailSection({
  title,
  children,
  collapsibleOnMobile = true,
  defaultExpanded = true,
  className,
}: DetailSectionProps) {
  const content = (
    <div className={cn('rounded-lg bg-muted/50 p-4', className)}>
      {children}
    </div>
  );

  if (!collapsibleOnMobile) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {content}
      </section>
    );
  }

  // Create a slug for test ID
  const testIdSlug = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      {/* Mobile: Collapsible accordion */}
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultExpanded ? title : undefined}
        className="md:hidden"
        data-testid={`detail-section-${testIdSlug}`}
      >
        <AccordionItem value={title} className="border-none">
          <AccordionTrigger
            className="min-h-[48px] text-lg font-semibold hover:no-underline"
            data-testid={`detail-section-trigger-${testIdSlug}`}
          >
            {title}
          </AccordionTrigger>
          <AccordionContent>{content}</AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Desktop: Always visible */}
      <section className="hidden md:block space-y-2" data-testid={`detail-section-${testIdSlug}`}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {content}
      </section>
    </>
  );
}
