/**
 * MiBreadcrumb Component
 *
 * Breadcrumb navigation for Market Intelligence sub-pages.
 * Shows "Market Intelligence" → current page path with navigation links.
 *
 * @example
 * ```tsx
 * <MiBreadcrumb current="Visualization" />
 * // Renders: Market Intelligence > Visualization
 * ```
 */

import Link from 'next/link';

import { ChevronRight } from 'lucide-react';

interface MiBreadcrumbProps {
  /** Current page name to display */
  current: string;
}

export function MiBreadcrumb({ current }: MiBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      data-testid="mi-breadcrumb"
      // AC4: 48px touch target for entire breadcrumb row (tablet/mobile support)
      className="flex items-center text-sm text-muted-foreground mb-4 min-h-[48px]"
    >
      <Link
        href="/market-intelligence"
        className="hover:text-foreground transition-colors min-h-[48px] flex items-center"
      >
        Market Intelligence
      </Link>
      <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
      <span className="text-foreground" aria-current="page">{current}</span>
    </nav>
  );
}
