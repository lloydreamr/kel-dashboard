/**
 * Pitch Drafts Page
 *
 * Lists all pitch drafts and allows creating new ones.
 * Entry point for AI-assisted pitch content generation.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { PitchDraftsPageClient } from './PitchDraftsPageClient';

export const metadata = {
  title: 'Pitch Drafts | Market Intelligence',
  description: 'Create and manage AI-assisted distributor pitch drafts',
};

export default function PitchDraftsPage() {
  return <PitchDraftsPageClient />;
}
