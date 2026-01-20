/**
 * Stale Questions Page
 *
 * Displays filtered view of stale questions for a specific category.
 * Used when user clicks on the freshness warning badge on MilestoneCard.
 */

import { StaleQuestionsClient } from './StaleQuestionsClient';

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function StaleQuestionsPage({ params }: PageProps) {
  const { category } = await params;

  return <StaleQuestionsClient category={category} />;
}
