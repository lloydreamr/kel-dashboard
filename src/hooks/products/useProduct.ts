/**
 * useProduct Hook
 *
 * TanStack Query hook for fetching a single product by ID.
 * Includes company data via JOIN.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { productsRepo } from '@/lib/repositories';

import type { ProductWithCompany } from '@/types';

/**
 * Hook for fetching a single product by ID with company info.
 *
 * @param id - Product UUID
 * @returns Query result with product data including company name
 *
 * @example
 * const { data: product, isLoading, error } = useProduct(id);
 */
export function useProduct(id: string): UseQueryResult<ProductWithCompany, Error> {
  return useQuery({
    queryKey: queryKeys.products.byId(id),
    queryFn: () => productsRepo.getById(id),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
