/**
 * useFilteredProducts Hook
 *
 * Hook for filtering products by category, price tier, and search query.
 * Performs client-side filtering on the full products list.
 * Supports dual-filter logic (AND) for category + price tier.
 */

import { useMemo } from 'react';

import { useProducts } from './useProducts';

import type { ProductWithCompany, ProductCategoryFilterKey, PriceTierFilterKey } from '@/types';

interface FilteredProductsResult {
  products: ProductWithCompany[];
  categoryCounts: Record<ProductCategoryFilterKey, number>;
  priceTierCounts: Record<PriceTierFilterKey, number>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for filtering products by category, price tier, and search query.
 * Returns filtered list and counts for each category and tier.
 *
 * @param category - Category filter key ('all' shows everything)
 * @param priceTier - Price tier filter key ('all' shows everything)
 * @param searchQuery - Search string to filter by name (case-insensitive)
 * @returns Filtered products, counts, loading state, and error
 *
 * @example
 * const { products, categoryCounts, priceTierCounts, isLoading } = useFilteredProducts('puffed', 'premium', 'Oishi');
 */
export function useFilteredProducts(
  category: ProductCategoryFilterKey = 'all',
  priceTier: PriceTierFilterKey = 'all',
  searchQuery: string = ''
): FilteredProductsResult {
  const { data: allProducts, isLoading, error, refetch } = useProducts();

  const { products, categoryCounts, priceTierCounts } = useMemo(() => {
    if (!allProducts) {
      return {
        products: [],
        categoryCounts: { all: 0, puffed: 0, chips: 0, nuts: 0, crackers: 0, others: 0 },
        priceTierCounts: { all: 0, value: 0, mainstream: 0, premium: 0 },
      };
    }

    // Known categories (null/unknown goes to 'others')
    const knownCategories = ['puffed', 'chips', 'nuts', 'crackers'];

    // Build category counts (always from full dataset)
    const categoryCounts: Record<ProductCategoryFilterKey, number> = {
      all: allProducts.length,
      puffed: allProducts.filter((p) => p.category === 'puffed').length,
      chips: allProducts.filter((p) => p.category === 'chips').length,
      nuts: allProducts.filter((p) => p.category === 'nuts').length,
      crackers: allProducts.filter((p) => p.category === 'crackers').length,
      others: allProducts.filter((p) => !knownCategories.includes(p.category ?? '')).length,
    };

    // Build price tier counts (always from full dataset)
    const priceTierCounts: Record<PriceTierFilterKey, number> = {
      all: allProducts.length,
      value: allProducts.filter((p) => p.price_tier === 'value').length,
      mainstream: allProducts.filter((p) => p.price_tier === 'mainstream').length,
      premium: allProducts.filter((p) => p.price_tier === 'premium').length,
    };

    // Filter by category
    let filtered: ProductWithCompany[] =
      category === 'all'
        ? allProducts
        : category === 'others'
          ? allProducts.filter((p) => !knownCategories.includes(p.category ?? ''))
          : allProducts.filter((p) => p.category === category);

    // Filter by price tier (AND logic)
    if (priceTier !== 'all') {
      filtered = filtered.filter((p) => p.price_tier === priceTier);
    }

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }

    return { products: filtered, categoryCounts, priceTierCounts };
  }, [allProducts, category, priceTier, searchQuery]);

  return { products, categoryCounts, priceTierCounts, isLoading, error: error ?? null, refetch };
}
