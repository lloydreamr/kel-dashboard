'use client';

/**
 * ProductDetailClient Component
 *
 * Client component for product detail page.
 * Fetches product data and renders the detail view.
 */

import Link from 'next/link';
import { Suspense } from 'react';

import { Badge } from '@/components/ui/badge';

import {
  DetailPageHeader,
  DetailPageSkeleton,
  DetailSection,
  EntityNotFound,
  RelatedEntitiesSection,
  SourceFileLink,
} from '@/components/shared';
import { useProduct } from '@/hooks/products';
import { PRODUCT_CATEGORY_LABELS, PRICE_TIER_LABELS } from '@/types';

import type { ProductCategoryFilterKey, PriceTierFilterKey } from '@/types';

type ProductDetailClientProps = {
  id: string;
};

/**
 * Get badge variant based on price tier
 */
function getPriceTierVariant(
  priceTier: string | null
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (priceTier) {
    case 'premium':
      return 'default';
    case 'mainstream':
      return 'secondary';
    case 'value':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Format price point as currency
 */
function formatPrice(price: number | null): string {
  if (price === null) return 'N/A';
  return `₱${price.toFixed(2)}`;
}

export function ProductDetailClient({ id }: ProductDetailClientProps) {
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !product) {
    return (
      <EntityNotFound
        entityType="Product"
        backHref="/market-intelligence/products"
        backLabel="Browse Products"
      />
    );
  }

  const categoryLabel =
    product.category && product.category in PRODUCT_CATEGORY_LABELS
      ? PRODUCT_CATEGORY_LABELS[product.category as ProductCategoryFilterKey]
      : product.category ?? 'Unknown';

  const priceTierLabel =
    product.price_tier && product.price_tier in PRICE_TIER_LABELS
      ? PRICE_TIER_LABELS[product.price_tier as PriceTierFilterKey]
      : product.price_tier ?? null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with back button and title */}
      <DetailPageHeader
        title={product.name}
        backHref="/market-intelligence/products"
        backLabel="Products"
        badge={categoryLabel}
        badgeVariant="secondary"
      />

      {/* Company info - linked to company detail page */}
      {product.companies?.name && (
        <div className="text-sm text-muted-foreground">
          by{' '}
          {product.company_id ? (
            <Link
              href={`/market-intelligence/companies/${product.company_id}`}
              className="text-foreground hover:underline font-medium"
            >
              {product.companies.name}
            </Link>
          ) : (
            <span className="font-medium">{product.companies.name}</span>
          )}
        </div>
      )}

      {/* Pricing Information */}
      <DetailSection title="Pricing" defaultExpanded>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Price Point
            </dt>
            <dd className="mt-1 text-lg font-semibold">
              {formatPrice(product.price_point)}
            </dd>
          </div>
          {priceTierLabel && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Price Tier
              </dt>
              <dd className="mt-1">
                <Badge variant={getPriceTierVariant(product.price_tier)}>
                  {priceTierLabel}
                </Badge>
              </dd>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Market Position */}
      {product.market_position && (
        <DetailSection title="Market Position">
          <p className="text-sm text-foreground">{product.market_position}</p>
        </DetailSection>
      )}

      {/* Flavor Profile */}
      {product.flavor_profile && product.flavor_profile.length > 0 && (
        <DetailSection title="Flavor Profile">
          <div className="flex flex-wrap gap-2">
            {product.flavor_profile.map((flavor) => (
              <Badge key={flavor} variant="outline">
                {flavor}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Related Entities */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
        <RelatedEntitiesSection entityType="product" entityId={id} />
      </Suspense>

      {/* Source File */}
      {product.source_file && (
        <SourceFileLink sourceFile={product.source_file} className="pt-4" />
      )}
    </div>
  );
}
