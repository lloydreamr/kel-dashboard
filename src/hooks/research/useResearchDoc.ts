/**
 * useResearchDoc Hook
 *
 * TanStack Query hook for fetching a single research document by ID.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { researchDocsRepo } from '@/lib/repositories';

import type { ResearchDoc } from '@/types';

/**
 * Hook for fetching a single research document by ID.
 *
 * @param id - Research document UUID
 * @returns Query result with research doc data
 *
 * @example
 * const { data: doc, isLoading, error } = useResearchDoc(id);
 */
export function useResearchDoc(id: string): UseQueryResult<ResearchDoc, Error> {
  return useQuery({
    queryKey: queryKeys.researchDocs.byId(id),
    queryFn: () => researchDocsRepo.getById(id),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
