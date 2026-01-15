'use client';

/**
 * QuickNavCard Component
 *
 * Navigation card for quick access to Market Intelligence sections.
 * Uses outline variant for visual distinction from StatCard.
 */

import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';

interface QuickNavCardProps {
  /** Card title */
  title: string;
  /** Brief description of the section */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Navigation link href */
  href: string;
  /** Test ID suffix (e.g., "companies" -> "mi-nav-card-companies") */
  testIdSuffix: string;
}

export function QuickNavCard({
  title,
  description,
  icon: Icon,
  href,
  testIdSuffix,
}: QuickNavCardProps) {
  return (
    <Link href={href} className="block">
      <Card
        data-testid={`mi-nav-card-${testIdSuffix}`}
        className="min-h-[48px] border-2 transition-all duration-150 hover:border-primary hover:shadow-md cursor-pointer"
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
