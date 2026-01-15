'use client';

/**
 * GenerateContentButton Component
 *
 * Button to trigger AI content generation for a specific pitch section.
 * Shows loading state during generation and displays section type.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 *
 * @example
 * ```tsx
 * <GenerateContentButton
 *   pitchDraftId="uuid"
 *   sectionType="market_opportunity"
 *   hasExistingContent={false}
 * />
 * ```
 */

import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useGeneratePitchContent,
  getGenerationState,
} from '@/hooks/pitch';
import { SECTION_TYPE_LABELS } from '@/types/pitch';

import type { PitchSectionType } from '@/types/pitch';

interface GenerateContentButtonProps {
  /** Pitch draft ID to generate content for */
  pitchDraftId: string;
  /** Section type to generate */
  sectionType: PitchSectionType;
  /** Whether content already exists (shows regenerate vs generate) */
  hasExistingContent?: boolean;
  /** Optional context for focused generation */
  context?: {
    company_ids?: string[];
    product_ids?: string[];
    trend_ids?: string[];
    consumer_ids?: string[];
  };
  /** Optional callback after successful generation */
  onSuccess?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button to trigger AI content generation for a pitch section.
 * Adapts label and icon based on whether content exists.
 */
export function GenerateContentButton({
  pitchDraftId,
  sectionType,
  hasExistingContent = false,
  context,
  onSuccess,
  className,
}: GenerateContentButtonProps) {
  const generateContent = useGeneratePitchContent();
  const { isGenerating, generatingSectionType } = getGenerationState(
    generateContent.isPending,
    generateContent.variables
  );

  // Check if THIS section is being generated
  const isThisSectionGenerating =
    isGenerating && generatingSectionType === sectionType;

  const handleClick = () => {
    generateContent.mutate(
      { pitchDraftId, sectionType, context },
      { onSuccess }
    );
  };

  const sectionLabel = SECTION_TYPE_LABELS[sectionType];
  const buttonLabel = hasExistingContent ? 'Regenerate' : 'Generate';
  const Icon = hasExistingContent ? RefreshCw : Sparkles;

  const buttonContent = (
    <>
      {isThisSectionGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span className="sr-only md:not-sr-only">
        {isThisSectionGenerating ? 'Generating...' : buttonLabel}
      </span>
    </>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className={className}
            data-testid={`generate-${sectionType}-button`}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {buttonLabel} {sectionLabel} with AI
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
