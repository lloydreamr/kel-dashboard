/**
 * Pitch Draft Detail Page
 *
 * View and edit a single pitch draft with AI content generation.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { PitchDraftDetailClient } from './PitchDraftDetailClient';

export const metadata = {
  title: 'Edit Pitch | Market Intelligence',
  description: 'Edit and generate AI content for your pitch draft',
};

interface PitchDraftDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PitchDraftDetailPage({
  params,
}: PitchDraftDetailPageProps) {
  const { id } = await params;
  return <PitchDraftDetailClient pitchDraftId={id} />;
}
