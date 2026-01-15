'use client';

/**
 * GenerateAllSectionsButton Component
 *
 * Button to generate AI content for all pitch sections at once.
 * Useful for quickly populating a new pitch draft.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 *
 * @example
 * ```tsx
 * <GenerateAllSectionsButton
 *   pitchDraftId="uuid"
 *   existingSections={['market_opportunity']}
 * />
 * ```
 */

import { Loader2, Wand2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGeneratePitchContent } from '@/hooks/pitch';
import { PITCH_SECTION_TYPES } from '@/types/pitch';

import type { PitchSectionType } from '@/types/pitch';

interface GenerateAllSectionsButtonProps {
  /** Pitch draft ID to generate content for */
  pitchDraftId: string;
  /** Section types that already have content (will be skipped or regenerated) */
  existingSections?: PitchSectionType[];
  /** Whether to skip sections that already have content */
  skipExisting?: boolean;
  /** Optional callback after all generations complete */
  onComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button to generate AI content for multiple/all pitch sections.
 * Generates sections sequentially to avoid overwhelming the API.
 */
export function GenerateAllSectionsButton({
  pitchDraftId,
  existingSections = [],
  skipExisting = true,
  onComplete,
  className,
}: GenerateAllSectionsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSection, setCurrentSection] = useState<PitchSectionType | null>(null);
  const generateContent = useGeneratePitchContent();

  const sectionsToGenerate = skipExisting
    ? PITCH_SECTION_TYPES.filter((type) => !existingSections.includes(type))
    : PITCH_SECTION_TYPES;

  const generateAllSequentially = async () => {
    if (sectionsToGenerate.length === 0) {
      return;
    }

    setIsGenerating(true);

    for (const sectionType of sectionsToGenerate) {
      setCurrentSection(sectionType);
      try {
        await generateContent.mutateAsync({ pitchDraftId, sectionType });
      } catch {
        // Error is handled by the mutation's onError
        // Continue to next section
      }
    }

    setCurrentSection(null);
    setIsGenerating(false);
    onComplete?.();
  };

  const remainingCount = sectionsToGenerate.length;

  if (remainingCount === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={generateAllSequentially}
            disabled={isGenerating}
            variant="default"
            className={className}
            data-testid="generate-all-sections-button"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate All ({remainingCount})
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isGenerating && currentSection
              ? `Generating ${currentSection.replace('_', ' ')}...`
              : `Generate ${remainingCount} section${remainingCount > 1 ? 's' : ''} with AI`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
