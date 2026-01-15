'use client';

/**
 * StatCard Component
 *
 * Displays a statistic card for the Market Intelligence dashboard.
 * Shows a count with title, icon, and links to the detail browse page.
 */

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  /** Card title */
  title: string;
  /** Statistic count value */
  count: number;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Navigation link href */
  href: string;
  /** Optional description text */
  description?: string;
  /** Test ID suffix (e.g., "companies" -> "mi-stat-card-companies") */
  testIdSuffix: string;
}

export function StatCard({
  title,
  count,
  icon: Icon,
  href,
  description,
  testIdSuffix,
}: StatCardProps) {
  return (
    <Link href={href} className="block">
      <Card
        data-testid={`mi-stat-card-${testIdSuffix}`}
        className="min-h-[48px] transition-shadow hover:shadow-md cursor-pointer"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{count}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
