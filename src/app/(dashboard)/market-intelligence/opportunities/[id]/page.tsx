/**
 * Opportunity Detail Page
 *
 * Server component that handles route params and renders the detail view.
 * Uses Suspense for loading state.
 */

import { Suspense } from 'react';

import { DetailPageSkeleton } from '@/components/shared';

import { OpportunityDetailClient } from './OpportunityDetailClient';

import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Opportunity | Kel Dashboard',
  };
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <OpportunityDetailClient id={id} />
    </Suspense>
  );
}
