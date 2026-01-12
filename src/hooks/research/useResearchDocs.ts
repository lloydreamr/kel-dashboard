/**
 * useResearchDocs Hook
 *
 * TanStack Query hook for fetching all research documents.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { researchDocsRepo } from '@/lib/repositories';

import type { ResearchDoc } from '@/types';

/**
 * Hook for fetching all research documents.
 * Returns docs ordered by title alphabetically.
 *
 * @returns Query result with research docs array
 *
 * @example
 * const { data: docs, isLoading, error } = useResearchDocs();
 */
export function useResearchDocs(): UseQueryResult<ResearchDoc[], Error> {
  return useQuery({
    queryKey: queryKeys.researchDocs.all,
    queryFn: () => researchDocsRepo.getAll(),
  });
}
