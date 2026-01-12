'use client';

/**
 * ProductsPageClient Component
 *
 * Client component for the products browse page.
 * Handles search, dual filtering (category + price tier), and displays product list.
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import {
  CategoryFilterChips,
  PriceTierFilterChips,
  ProductsList,
  ProductsSearch,
} from '@/components/products';
import { useFilteredProducts } from '@/hooks/products';
import { type ProductCategoryFilterKey, type PriceTierFilterKey } from '@/types';

const CATEGORY_KEYS: ProductCategoryFilterKey[] = ['all', 'puffed', 'chips', 'nuts', 'crackers', 'others'];
const PRICE_TIER_KEYS: PriceTierFilterKey[] = ['all', 'value', 'mainstream', 'premium'];

export function ProductsPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Parse and validate category filter from URL
  const rawCategory = searchParams.get('category');
  const categoryFilter: ProductCategoryFilterKey =
    rawCategory && CATEGORY_KEYS.includes(rawCategory as ProductCategoryFilterKey)
      ? (rawCategory as ProductCategoryFilterKey)
      : 'all';

  // Parse and validate price tier filter from URL
  const rawPriceTier = searchParams.get('priceTier');
  const priceTierFilter: PriceTierFilterKey =
    rawPriceTier && PRICE_TIER_KEYS.includes(rawPriceTier as PriceTierFilterKey)
      ? (rawPriceTier as PriceTierFilterKey)
      : 'all';

  // Get filtered products with counts
  const { products, categoryCounts, priceTierCounts, isLoading, error, refetch } = useFilteredProducts(
    categoryFilter,
    priceTierFilter,
    searchQuery
  );

  // Update URL without page reload
  const updateUrlParams = useCallback(
    (updates: { category?: ProductCategoryFilterKey; priceTier?: PriceTierFilterKey }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.category !== undefined) {
        if (updates.category === 'all') {
          params.delete('category');
        } else {
          params.set('category', updates.category);
        }
      }

      if (updates.priceTier !== undefined) {
        if (updates.priceTier === 'all') {
          params.delete('priceTier');
        } else {
          params.set('priceTier', updates.priceTier);
        }
      }

      const newUrl = params.toString()
        ? `/market-intelligence/products?${params.toString()}`
        : '/market-intelligence/products';
      router.push(newUrl, { scroll: false });
    },
    [searchParams, router]
  );

  const handleCategoryChange = useCallback(
    (category: ProductCategoryFilterKey) => {
      updateUrlParams({ category });
    },
    [updateUrlParams]
  );

  const handlePriceTierChange = useCallback(
    (priceTier: PriceTierFilterKey) => {
      updateUrlParams({ priceTier });
    },
    [updateUrlParams]
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div data-testid="products-page" className="container py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Browse products from the knowledge base
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <ProductsSearch value={searchQuery} onChange={handleSearchChange} />
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilterChips
            value={categoryFilter}
            counts={categoryCounts}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Price Tier Filter */}
        <div className="mb-6">
          <PriceTierFilterChips
            value={priceTierFilter}
            counts={priceTierCounts}
            onChange={handlePriceTierChange}
          />
        </div>

        {/* Products List */}
        <ProductsList
          products={products}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </div>
  );
}
