'use client';

/**
 * ResearchDetailClient Component
 *
 * Client component for research document detail page.
 * Fetches research doc data and renders the detail view.
 */

import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Suspense } from 'react';

import {
  DetailPageHeader,
  DetailPageSkeleton,
  DetailSection,
  EntityNotFound,
  RelatedEntitiesSection,
  SourceFileLink,
} from '@/components/shared';
import { useResearchDoc } from '@/hooks/research';
import { RESEARCH_CATEGORY_LABELS } from '@/types/researchDoc';

import type { ResearchCategoryFilterKey } from '@/types/researchDoc';

type ResearchDetailClientProps = {
  id: string;
};

/**
 * Get badge variant based on category
 */
function getCategoryVariant(
  category: string | null
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (category) {
    case 'consumers':
      return 'default';
    case 'trends':
      return 'secondary';
    case 'distribution':
      return 'secondary';
    case 'regulatory':
      return 'destructive';
    case 'general':
      return 'outline';
    default:
      return 'outline';
  }
}

export function ResearchDetailClient({ id }: ResearchDetailClientProps) {
  const { data: doc, isLoading, error } = useResearchDoc(id);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !doc) {
    return (
      <EntityNotFound
        entityType="Research Document"
        backHref="/market-intelligence/research"
        backLabel="Browse Research"
      />
    );
  }

  const categoryLabel =
    doc.category && doc.category in RESEARCH_CATEGORY_LABELS
      ? RESEARCH_CATEGORY_LABELS[doc.category as ResearchCategoryFilterKey]
      : doc.category ?? 'General';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with back button and title */}
      <DetailPageHeader
        title={doc.title}
        backHref="/market-intelligence/research"
        backLabel="Research"
        badge={categoryLabel}
        badgeVariant={getCategoryVariant(doc.category)}
      />

      {/* Summary */}
      {doc.summary && (
        <DetailSection title="Summary" defaultExpanded>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{doc.summary}</Markdown>
          </div>
        </DetailSection>
      )}

      {/* Full Content */}
      {doc.content && (
        <DetailSection title="Content">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{doc.content}</Markdown>
          </div>
        </DetailSection>
      )}

      {/* Related Entities */}
      <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg" />}>
        <RelatedEntitiesSection entityType="research_doc" entityId={id} />
      </Suspense>

      {/* Source File */}
      {doc.source_file && (
        <SourceFileLink sourceFile={doc.source_file} className="pt-4" />
      )}
    </div>
  );
}
