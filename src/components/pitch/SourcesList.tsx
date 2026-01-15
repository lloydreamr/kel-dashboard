'use client';

/**
 * SourcesList Component
 *
 * Displays list of MI sources used for AI-generated pitch content.
 * Shows source type, name, and relevance score in a compact format.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 *
 * @example
 * ```tsx
 * <SourcesList sources={section.sources} />
 * ```
 */

import { Building2, Package, Users, TrendingUp, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SOURCE_TYPE_LABELS } from '@/types/pitch';
import { cn } from '@/lib/utils';

import type { PitchSourceType } from '@/types/pitch';

interface Source {
  id: string;
  source_type: PitchSourceType;
  source_id: string;
  relevance_score: number | null;
  source_name?: string;
}

interface SourcesListProps {
  /** Array of sources to display */
  sources: Source[];
  /** Maximum sources to show before collapsing */
  maxVisible?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon mapping for source types
 */
const SOURCE_ICONS: Record<PitchSourceType, typeof Building2> = {
  companies: Building2,
  products: Package,
  consumers: Users,
  trends: TrendingUp,
  research_docs: FileText,
};

/**
 * Color mapping for source types
 */
const SOURCE_COLORS: Record<PitchSourceType, string> = {
  companies: 'bg-blue-50 text-blue-700 border-blue-200',
  products: 'bg-purple-50 text-purple-700 border-purple-200',
  consumers: 'bg-green-50 text-green-700 border-green-200',
  trends: 'bg-orange-50 text-orange-700 border-orange-200',
  research_docs: 'bg-gray-50 text-gray-700 border-gray-200',
};

/**
 * Single source item display
 */
function SourceItem({ source }: { source: Source }) {
  const Icon = SOURCE_ICONS[source.source_type];
  const label = source.source_name || SOURCE_TYPE_LABELS[source.source_type];
  const colorClass = SOURCE_COLORS[source.source_type];

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal gap-1', colorClass)}
      data-testid={`source-${source.source_type}`}
    >
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{label}</span>
      {source.relevance_score !== null && (
        <span className="opacity-60">
          {Math.round(source.relevance_score * 100)}%
        </span>
      )}
    </Badge>
  );
}

/**
 * Displays list of MI sources used for AI-generated content.
 */
export function SourcesList({
  sources,
  maxVisible = 5,
  className,
}: SourcesListProps) {
  if (sources.length === 0) {
    return null;
  }

  const visibleSources = sources.slice(0, maxVisible);
  const hiddenCount = sources.length - maxVisible;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-muted-foreground font-medium">
        Sources ({sources.length})
      </p>
      <div className="flex flex-wrap gap-1.5" data-testid="sources-list">
        {visibleSources.map((source) => (
          <SourceItem key={source.id} source={source} />
        ))}
        {hiddenCount > 0 && (
          <Badge variant="secondary" className="text-xs font-normal">
            +{hiddenCount} more
          </Badge>
        )}
      </div>
    </div>
  );
}
