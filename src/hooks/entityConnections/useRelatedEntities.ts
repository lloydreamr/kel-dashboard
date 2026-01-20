/**
 * useRelatedEntities Hook
 *
 * TanStack Query hook for fetching all related entities for a given entity.
 * Returns both outgoing and incoming connections.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { entityConnectionsRepo } from '@/lib/repositories';

import type { EntityConnection } from '@/lib/repositories';

/**
 * Related entities response type
 */
export type RelatedEntitiesResult = {
  outgoing: EntityConnection[];
  incoming: EntityConnection[];
};

/**
 * Hook for fetching all related entities for a given entity.
 * Returns connections where this entity is either source or target.
 *
 * @param entityType - Type of entity ('company', 'product', 'research_doc')
 * @param entityId - UUID of the entity
 * @returns Query result with outgoing and incoming connections
 *
 * @example
 * const { data: related, isLoading } = useRelatedEntities('company', companyId);
 * // related.outgoing - entities this company points to
 * // related.incoming - entities that point to this company
 */
export function useRelatedEntities(
  entityType: string,
  entityId: string
): UseQueryResult<RelatedEntitiesResult, Error> {
  return useQuery({
    queryKey: queryKeys.entityConnections.related(entityType, entityId),
    queryFn: () => entityConnectionsRepo.getRelatedEntities(entityType, entityId),
    enabled: Boolean(entityType && entityId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
