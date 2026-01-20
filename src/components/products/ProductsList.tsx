'use client';

/**
 * ProductsList Component
 *
 * Displays a list of product cards with loading, error, and empty states.
 * Follows CompaniesList pattern.
 */

import { Package } from 'lucide-react';

import { ErrorState } from '@/components/ui/error-state';

import { ProductCard } from './ProductCard';
import { ProductsListSkeleton } from './ProductsListSkeleton';

import type { ProductWithCompany } from '@/types';

interface ProductsListProps {
  products: ProductWithCompany[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

export function ProductsList({
  products,
  isLoading,
  error,
  onRetry,
}: ProductsListProps) {
  if (isLoading) {
    return <ProductsListSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load products"
        onRetry={onRetry}
      />
    );
  }

  if (products.length === 0) {
    return (
      <div
        data-testid="products-empty-state"
        role="status"
        aria-label="No products found"
        className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
      >
        <Package className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">
          No products found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="products-list" className="space-y-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
