'use client';

/**
 * RelatedEntitiesSection Component
 *
 * Displays related entities grouped by type.
 * Uses Accordion on mobile for collapsible sections.
 * Links each entity to its detail page.
 */

import { Building2, Package, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useRelatedEntities } from '@/hooks/entityConnections';
import { cn } from '@/lib/utils';

import type { EntityConnection } from '@/lib/repositories';

export type RelatedEntitiesSectionProps = {
  /** Type of the current entity */
  entityType: 'company' | 'product' | 'research_doc';
  /** ID of the current entity */
  entityId: string;
  /** Additional CSS classes */
  className?: string;
};

type GroupedRelations = {
  companies: EntityConnection[];
  products: EntityConnection[];
  research_docs: EntityConnection[];
};

/**
 * Get icon for entity type
 */
function getEntityIcon(type: string) {
  switch (type) {
    case 'company':
      return Building2;
    case 'product':
      return Package;
    case 'research_doc':
      return FileText;
    default:
      return FileText;
  }
}

/**
 * Get display label for entity type
 */
function getEntityTypeLabel(type: string, plural = false): string {
  switch (type) {
    case 'company':
      return plural ? 'Companies' : 'Company';
    case 'product':
      return plural ? 'Products' : 'Product';
    case 'research_doc':
      return plural ? 'Research Docs' : 'Research Doc';
    default:
      return type;
  }
}

/**
 * Get detail page URL for an entity
 */
function getEntityUrl(type: string, id: string): string {
  switch (type) {
    case 'company':
      return `/market-intelligence/companies/${id}`;
    case 'product':
      return `/market-intelligence/products/${id}`;
    case 'research_doc':
      return `/market-intelligence/research/${id}`;
    default:
      return '#';
  }
}

/**
 * Loading skeleton for related entities
 */
function RelatedEntitiesSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Single related entity link
 */
function RelatedEntityLink({
  connection,
  direction,
}: {
  connection: EntityConnection;
  direction: 'outgoing' | 'incoming';
}) {
  // For outgoing, we link to target; for incoming, we link to source
  const targetType = direction === 'outgoing' ? connection.target_type : connection.source_type;
  const targetId = direction === 'outgoing' ? connection.target_id : connection.source_id;
  const Icon = getEntityIcon(targetType);

  // Use relationship type as label, fallback to entity type
  const displayLabel = connection.relationship || getEntityTypeLabel(targetType);

  return (
    <Link
      href={getEntityUrl(targetType, targetId)}
      className="flex items-center gap-2 rounded-md px-3 py-2 min-h-[48px] hover:bg-accent transition-colors"
      data-testid={`related-entity-link-${targetId}`}
    >
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm font-medium">{displayLabel}</span>
      <Badge variant="outline" className="text-xs ml-auto">
        {getEntityTypeLabel(targetType)}
      </Badge>
    </Link>
  );
}

/**
 * Group of related entities by type
 */
function RelatedEntityGroup({
  type,
  connections,
  direction,
}: {
  type: string;
  connections: EntityConnection[];
  direction: 'outgoing' | 'incoming';
}) {
  if (connections.length === 0) return null;

  const Icon = getEntityIcon(type);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        {getEntityTypeLabel(type, true)} ({connections.length})
      </div>
      <div className="space-y-1">
        {connections.map((connection) => (
          <RelatedEntityLink
            key={connection.id}
            connection={connection}
            direction={direction}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Content component that fetches and displays related entities
 */
function RelatedEntitiesContent({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string;
}) {
  const { data: related, isLoading, error } = useRelatedEntities(entityType, entityId);

  if (isLoading) {
    return <RelatedEntitiesSkeleton />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive py-4">
        Failed to load related entities
      </div>
    );
  }

  if (!related) {
    return null;
  }

  // Group connections by entity type
  const groupOutgoing = (connections: EntityConnection[]): GroupedRelations => {
    return connections.reduce<GroupedRelations>(
      (acc, conn) => {
        const type = conn.target_type as keyof GroupedRelations;
        if (acc[type]) {
          acc[type].push(conn);
        }
        return acc;
      },
      { companies: [], products: [], research_docs: [] }
    );
  };

  const groupIncoming = (connections: EntityConnection[]): GroupedRelations => {
    return connections.reduce<GroupedRelations>(
      (acc, conn) => {
        const type = conn.source_type as keyof GroupedRelations;
        if (acc[type]) {
          acc[type].push(conn);
        }
        return acc;
      },
      { companies: [], products: [], research_docs: [] }
    );
  };

  const outgoingGroups = groupOutgoing(related.outgoing);
  const incomingGroups = groupIncoming(related.incoming);

  const totalConnections = related.outgoing.length + related.incoming.length;

  if (totalConnections === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No related entities found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Outgoing connections */}
      {related.outgoing.length > 0 && (
        <div className="space-y-4">
          {Object.entries(outgoingGroups).map(([type, connections]) => (
            <RelatedEntityGroup
              key={`out-${type}`}
              type={type}
              connections={connections}
              direction="outgoing"
            />
          ))}
        </div>
      )}

      {/* Incoming connections */}
      {related.incoming.length > 0 && (
        <div className="space-y-4">
          {Object.entries(incomingGroups).map(([type, connections]) => (
            <RelatedEntityGroup
              key={`in-${type}`}
              type={type}
              connections={connections}
              direction="incoming"
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main RelatedEntitiesSection component
 */
export function RelatedEntitiesSection({
  entityType,
  entityId,
  className,
}: RelatedEntitiesSectionProps) {
  const content = (
    <div className={cn('rounded-lg bg-muted/50 p-4', className)}>
      <Suspense fallback={<RelatedEntitiesSkeleton />}>
        <RelatedEntitiesContent entityType={entityType} entityId={entityId} />
      </Suspense>
    </div>
  );

  return (
    <>
      {/* Mobile: Collapsible accordion */}
      <Accordion
        type="single"
        collapsible
        defaultValue="related"
        className="md:hidden"
      >
        <AccordionItem value="related" className="border-none">
          <AccordionTrigger className="min-h-[48px] text-lg font-semibold hover:no-underline">
            Related Entities
          </AccordionTrigger>
          <AccordionContent>{content}</AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Desktop: Always visible */}
      <section className="hidden md:block space-y-2">
        <h2 className="text-lg font-semibold">Related Entities</h2>
        {content}
      </section>
    </>
  );
}
