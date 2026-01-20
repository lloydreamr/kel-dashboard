/**
 * useProducts Hook
 *
 * TanStack Query hook for fetching all products with company names.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { productsRepo } from '@/lib/repositories';

import type { ProductWithCompany } from '@/types';

/**
 * Hook for fetching all products with joined company names.
 * Returns products ordered by name alphabetically.
 *
 * @returns Query result with products array
 *
 * @example
 * const { data: products, isLoading, error } = useProducts();
 */
export function useProducts(): UseQueryResult<ProductWithCompany[], Error> {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: () => productsRepo.getAll(),
  });
}
