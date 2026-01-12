'use client';

/**
 * ProductCard Component
 *
 * Displays a clickable product card with name, company, category badge, and price tier badge.
 * Includes keyboard navigation support for accessibility.
 */

import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';

import { PriceTierBadge } from './PriceTierBadge';
import { ProductCategoryBadge } from './ProductCategoryBadge';

import type { ProductWithCompany } from '@/types';

interface ProductCardProps {
  product: ProductWithCompany;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/market-intelligence/products/${product.id}`);
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
      className={cn(
        'border rounded-lg p-4 cursor-pointer',
        'hover:bg-accent/50 transition-colors',
        'min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid="product-card"
      aria-label={`View ${product.name} details`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{product.name}</h3>
          {/* Company name from joined companies table (AC #1) */}
          {product.companies?.name && (
            <p className="text-sm text-muted-foreground truncate">
              {product.companies.name}
            </p>
          )}
          {product.price_point != null && (
            <p className="text-xs text-muted-foreground">
              ₱{product.price_point.toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <ProductCategoryBadge category={product.category} />
          <PriceTierBadge tier={product.price_tier} />
        </div>
      </div>
    </div>
  );
}
