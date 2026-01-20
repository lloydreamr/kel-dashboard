'use client';

/**
 * CompanyCard Component
 *
 * Displays a company profile summary with name, category badge, and market share.
 * Clickable card that navigates to company detail page.
 */

import { useRouter } from 'next/navigation';

import { CategoryBadge } from './CategoryBadge';

import type { Company } from '@/types';

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/market-intelligence/companies/${company.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="border border-border rounded-lg p-4 cursor-pointer bg-surface hover:bg-muted/50 transition-colors min-h-[48px]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid="company-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{company.name}</h3>
          {company.market_share != null && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Market Share: {Number(company.market_share).toFixed(1)}%
            </p>
          )}
        </div>
        <CategoryBadge category={company.category} />
      </div>
    </div>
  );
}
