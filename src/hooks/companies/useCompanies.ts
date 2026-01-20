/**
 * useCompanies Hook
 *
 * TanStack Query hook for fetching all company profiles.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { companiesRepo } from '@/lib/repositories';

import type { Company } from '@/types';

/**
 * Hook for fetching all company profiles.
 * Returns companies ordered by name alphabetically.
 *
 * @returns Query result with companies array
 *
 * @example
 * const { data: companies, isLoading, error } = useCompanies();
 */
export function useCompanies(): UseQueryResult<Company[], Error> {
  return useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: () => companiesRepo.getAll(),
  });
}
