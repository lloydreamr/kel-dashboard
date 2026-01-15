'use client';

/**
 * PitchSectionEmptyState Component
 *
 * Empty state card for a pitch section that hasn't been generated yet.
 * Includes generate button and explanation of what the section will contain.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 *
 * @example
 * ```tsx
 * <PitchSectionEmptyState
 *   pitchDraftId="uuid"
 *   sectionType="market_opportunity"
 * />
 * ```
 */

import { Sparkles } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GenerateContentButton } from './GenerateContentButton';
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_DESCRIPTIONS,
} from '@/types/pitch';

import type { PitchSectionType } from '@/types/pitch';

interface PitchSectionEmptyStateProps {
  /** Pitch draft ID for generation */
  pitchDraftId: string;
  /** Section type to display */
  sectionType: PitchSectionType;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state prompting user to generate AI content for a section.
 */
export function PitchSectionEmptyState({
  pitchDraftId,
  sectionType,
  className,
}: PitchSectionEmptyStateProps) {
  const label = SECTION_TYPE_LABELS[sectionType];
  const description = SECTION_TYPE_DESCRIPTIONS[sectionType];

  return (
    <Card className={className} data-testid={`pitch-section-empty-${sectionType}`}>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="rounded-full bg-muted p-3">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">No content yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Generate AI-powered content using your market intelligence data.
            </p>
          </div>
          <GenerateContentButton
            pitchDraftId={pitchDraftId}
            sectionType={sectionType}
            hasExistingContent={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
