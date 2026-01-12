/**
 * Entity Connections Repository
 *
 * All database operations for entity_connections table.
 * Provides relationship data between companies, products, and research docs.
 * Uses browser client for client-side operations.
 * RLS ensures only authenticated users can access connection data.
 */

import { createClient } from '@/lib/supabase/client';

import { mapPostgrestError } from './base';

import type { Database } from '@/types/database';

type EntityConnectionRow =
  Database['public']['Tables']['entity_connections']['Row'];

/**
 * Entity type for type-safe connection queries
 */
export type EntityType = 'company' | 'product' | 'research_doc';

/**
 * Entity connections repository - handles all relationship data queries
 */
export const entityConnectionsRepo = {
  /**
   * Get all connections where this entity is the source
   *
   * @param sourceType - Type of source entity ('company', 'product', 'research_doc')
   * @param sourceId - UUID of the source entity
   * @returns Array of connections where this entity is the source
   * @throws RepositoryError on database errors
   */
  getBySourceId: async (
    sourceType: string,
    sourceId: string
  ): Promise<EntityConnectionRow[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('entity_connections')
      .select('*')
      .eq('source_type', sourceType)
      .eq('source_id', sourceId);

    if (error) {
      throw mapPostgrestError(error);
    }
    return data ?? [];
  },

  /**
   * Get all connections where this entity is the target
   *
   * @param targetType - Type of target entity ('company', 'product', 'research_doc')
   * @param targetId - UUID of the target entity
   * @returns Array of connections where this entity is the target
   * @throws RepositoryError on database errors
   */
  getByTargetId: async (
    targetType: string,
    targetId: string
  ): Promise<EntityConnectionRow[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('entity_connections')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      throw mapPostgrestError(error);
    }
    return data ?? [];
  },

  /**
   * Get all connections where this entity is either source or target
   * Useful for displaying all related entities on detail pages
   *
   * @param entityType - Type of entity ('company', 'product', 'research_doc')
   * @param entityId - UUID of the entity
   * @returns Object with outgoing and incoming connections
   * @throws RepositoryError on database errors
   */
  getRelatedEntities: async (
    entityType: string,
    entityId: string
  ): Promise<{
    outgoing: EntityConnectionRow[];
    incoming: EntityConnectionRow[];
  }> => {
    const supabase = createClient();

    // Get connections where this entity is the source
    const { data: outgoing, error: outgoingError } = await supabase
      .from('entity_connections')
      .select('*')
      .eq('source_type', entityType)
      .eq('source_id', entityId);

    if (outgoingError) {
      throw mapPostgrestError(outgoingError);
    }

    // Get connections where this entity is the target
    const { data: incoming, error: incomingError } = await supabase
      .from('entity_connections')
      .select('*')
      .eq('target_type', entityType)
      .eq('target_id', entityId);

    if (incomingError) {
      throw mapPostgrestError(incomingError);
    }

    return {
      outgoing: outgoing ?? [],
      incoming: incoming ?? [],
    };
  },
};

// Export types for use in components and hooks
export type { EntityConnectionRow as EntityConnection };
