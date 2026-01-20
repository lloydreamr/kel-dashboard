/**
 * useCompany Hook
 *
 * TanStack Query hook for fetching a single company by ID.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { companiesRepo } from '@/lib/repositories';

import type { Company } from '@/types';

/**
 * Hook for fetching a single company profile by ID.
 *
 * @param id - Company UUID
 * @returns Query result with company data
 *
 * @example
 * const { data: company, isLoading, error } = useCompany(id);
 */
export function useCompany(id: string): UseQueryResult<Company, Error> {
  return useQuery({
    queryKey: queryKeys.companies.byId(id),
    queryFn: () => companiesRepo.getById(id),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
