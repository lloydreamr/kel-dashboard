/**
 * useGeneratePitchSummary Hook
 *
 * TanStack Query mutation hook for AI-powered pitch summary generation.
 * Calls the generate-pitch-summary API and returns ephemeral summary.
 *
 * Story 18-3: Export with AI Summary
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  GeneratePitchSummaryResponse,
  GeneratePitchSummaryErrorResponse,
} from '@/app/api/ai/generate-pitch-summary/route';

/**
 * Input for pitch summary generation
 */
interface GeneratePitchSummaryInput {
  /** Pitch draft ID to generate summary for */
  pitchDraftId: string;
}

/**
 * Hook for generating AI pitch summary.
 *
 * The summary is ephemeral - it's generated on-demand for export
 * and not persisted to the database.
 *
 * Includes loading states, error handling, and toast notifications.
 *
 * @returns Mutation for generating pitch summary
 *
 * @example
 * const generateSummary = useGeneratePitchSummary();
 *
 * generateSummary.mutate({ pitchDraftId: 'uuid' });
 *
 * // Or with async/await
 * const result = await generateSummary.mutateAsync({ pitchDraftId: 'uuid' });
 * console.log(result.summary);
 */
export function useGeneratePitchSummary() {
  return useMutation<GeneratePitchSummaryResponse, Error, GeneratePitchSummaryInput>({
    mutationFn: async ({ pitchDraftId }) => {
      const response = await fetch('/api/ai/generate-pitch-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch_draft_id: pitchDraftId }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as GeneratePitchSummaryErrorResponse;

        // Create descriptive error based on code
        let errorMessage = errorData.error || 'Failed to generate summary';
        if (errorData.code === 'EMPTY_PITCH') {
          errorMessage = 'Add content to your pitch before generating a summary.';
        } else if (errorData.code === 'RATE_LIMIT') {
          errorMessage = 'Please wait a moment before generating another summary.';
        } else if (errorData.code === 'TIMEOUT') {
          errorMessage = 'Summary generation took too long. Please try again.';
        }

        throw new Error(errorMessage);
      }

      return response.json() as Promise<GeneratePitchSummaryResponse>;
    },
    onSuccess: (data) => {
      const sectionsCount = data.metadata.sections_analyzed;
      toast.success('Summary generated', {
        description: `Based on ${sectionsCount} sections analyzed`,
      });
    },
    onError: (error) => {
      toast.error('Failed to generate summary', {
        description: error.message,
      });
    },
  });
}
