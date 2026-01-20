/**
 * Research Document Detail Page
 *
 * Server component that handles route params and renders the detail view.
 * Uses Suspense for loading state.
 */

import { Suspense } from 'react';

import { DetailPageSkeleton } from '@/components/shared';

import { ResearchDetailClient } from './ResearchDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResearchDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <ResearchDetailClient id={id} />
    </Suspense>
  );
}
