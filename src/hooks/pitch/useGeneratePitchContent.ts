/**
 * useGeneratePitchContent Hook
 *
 * TanStack Query mutation hook for AI-powered pitch content generation.
 * Calls the generate-pitch-content API and updates the cache.
 *
 * Story 18-1: AI-Assisted Pitch Content Generation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { getSectionLabel } from '@/lib/ai/pitch-prompts';

import type {
  GeneratePitchContentRequest,
  GeneratePitchContentResponse,
  GeneratePitchContentErrorResponse,
} from '@/lib/ai/pitch-types';
import type { PitchSectionType } from '@/types/pitch';

interface GeneratePitchContentInput {
  /** Pitch draft ID to generate content for */
  pitchDraftId: string;
  /** Section type to generate */
  sectionType: PitchSectionType;
  /** Optional context to focus generation */
  context?: {
    company_ids?: string[];
    product_ids?: string[];
    trend_ids?: string[];
    consumer_ids?: string[];
  };
}

/**
 * Hook for generating AI pitch content.
 *
 * Includes loading states, error handling, and cache invalidation.
 * Shows toast notifications for success/failure.
 *
 * @returns Mutation for generating pitch content
 *
 * @example
 * const generateContent = useGeneratePitchContent();
 *
 * generateContent.mutate({
 *   pitchDraftId: 'uuid',
 *   sectionType: 'market_opportunity',
 * });
 *
 * // With context focus
 * generateContent.mutate({
 *   pitchDraftId: 'uuid',
 *   sectionType: 'competitive_positioning',
 *   context: { company_ids: ['uuid1', 'uuid2'] },
 * });
 */
export function useGeneratePitchContent() {
  const queryClient = useQueryClient();

  return useMutation<GeneratePitchContentResponse, Error, GeneratePitchContentInput>({
    mutationFn: async ({ pitchDraftId, sectionType, context }) => {
      const requestBody: GeneratePitchContentRequest = {
        pitch_draft_id: pitchDraftId,
        section_type: sectionType,
        context,
      };

      const response = await fetch('/api/ai/generate-pitch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as GeneratePitchContentErrorResponse;

        // Create descriptive error based on code
        let errorMessage = errorData.error || 'Failed to generate content';
        if (errorData.code === 'EMPTY_KNOWLEDGE_BASE') {
          errorMessage = 'Add market intelligence data first to generate AI content.';
        } else if (errorData.code === 'RATE_LIMIT') {
          errorMessage = 'Please wait a moment before generating more content.';
        } else if (errorData.code === 'TIMEOUT') {
          errorMessage = 'Generation took too long. Please try again.';
        }

        throw new Error(errorMessage);
      }

      return response.json() as Promise<GeneratePitchContentResponse>;
    },
    onSuccess: (data, { pitchDraftId, sectionType }) => {
      // Invalidate sections for this draft
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchSections.byDraft(pitchDraftId),
      });

      // Invalidate draft with sections
      queryClient.invalidateQueries({
        queryKey: queryKeys.pitchDrafts.withSections(pitchDraftId),
      });

      // Show success toast with confidence info
      const sectionLabel = getSectionLabel(sectionType);
      const confidencePercent = Math.round((data.section.confidence_score ?? 0) * 100);

      toast.success(`Generated ${sectionLabel}`, {
        description: `${data.sources.length} sources used • ${confidencePercent}% confidence`,
      });
    },
    onError: (error, { sectionType }) => {
      const sectionLabel = getSectionLabel(sectionType);
      toast.error(`Failed to generate ${sectionLabel}`, {
        description: error.message,
      });
    },
  });
}

/**
 * Hook state helpers for generation UI
 */
export interface GenerationState {
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Which section is being generated (if any) */
  generatingSectionType: PitchSectionType | null;
}

/**
 * Get generation state from mutation
 *
 * @param mutation - The useGeneratePitchContent mutation
 * @param variables - Current mutation variables (if any)
 * @returns Generation state for UI
 */
export function getGenerationState(
  isPending: boolean,
  variables?: GeneratePitchContentInput
): GenerationState {
  return {
    isGenerating: isPending,
    generatingSectionType: isPending ? variables?.sectionType ?? null : null,
  };
}
