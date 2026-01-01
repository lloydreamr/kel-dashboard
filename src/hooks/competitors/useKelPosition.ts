/**
 * useKelPosition Hook
 *
 * Custom mutation for setting or updating Kel's target position on the chart.
 * Handles both creating new Kel position and updating existing one.
 * Enforces single Kel position rule (AC4).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useCompetitorData } from '@/hooks/competitors';
import { queryKeys } from '@/lib/queryKeys';
import { competitorsRepo } from '@/lib/repositories/competitors';

import type { CompetitorDataPoint } from '@/types';

interface SetKelPositionInput {
  price_score: number;
  quality_score: number;
  notes?: string | null;
}

/**
 * Extract user-friendly error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  // Handle Supabase errors
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { message?: string; details?: string; hint?: string; code?: string };

    if (supabaseError.details) {
      return supabaseError.details;
    }

    if (supabaseError.hint) {
      return supabaseError.hint;
    }

    if (supabaseError.message) {
      return supabaseError.message;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Hook for setting or updating Kel's target position.
 *
 * - If Kel position exists: UPDATE (preserves name, updates scores/notes)
 * - If Kel position doesn't exist: CREATE with default name
 *
 * Enforces single Kel position rule by replacing existing position.
 *
 * @returns Mutation for setting Kel position
 *
 * @example
 * const setKelPosition = useSetKelPosition();
 * setKelPosition.mutate({ price_score: 7, quality_score: 8, notes: 'Target' });
 */
export function useSetKelPosition() {
  const queryClient = useQueryClient();
  const { data: competitors } = useCompetitorData();

  return useMutation({
    mutationFn: async (input: SetKelPositionInput) => {
      // Find existing Kel position
      const existingKel = competitors?.find((c) => c.is_kel_position);

      if (existingKel) {
        // Update existing position - preserve original name from CompetitorForm if set
        return competitorsRepo.update(existingKel.id, {
          price_score: input.price_score,
          quality_score: input.quality_score,
          notes: input.notes ?? null,
          // DO NOT update name or category - preserve what user originally set
        });
      } else {
        // Create new Kel position with default name
        return competitorsRepo.create({
          name: "Kel's Target Position",
          price_score: input.price_score,
          quality_score: input.quality_score,
          notes: input.notes ?? null,
          category: null,
          is_kel_position: true,
        });
      }
    },

    // Optimistic update
    onMutate: async (input) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.competitors.all, exact: true });

      const previousCompetitors = queryClient.getQueryData<CompetitorDataPoint[]>(
        queryKeys.competitors.all
      );

      if (previousCompetitors) {
        const existingKel = previousCompetitors.find((c) => c.is_kel_position);

        if (existingKel) {
          // Optimistic update existing - preserve name and category
          queryClient.setQueryData(
            queryKeys.competitors.all,
            previousCompetitors.map((c) =>
              c.is_kel_position
                ? {
                    ...c,
                    price_score: input.price_score,
                    quality_score: input.quality_score,
                    notes: input.notes ?? null,
                    // Name and category preserved from existing
                  }
                : c
            )
          );
        } else {
          // Optimistic add new with default name
          const optimisticKel: CompetitorDataPoint = {
            id: `temp-kel-${Date.now()}`,
            name: "Kel's Target Position",
            price_score: input.price_score,
            quality_score: input.quality_score,
            category: null,
            notes: input.notes ?? null,
            is_kel_position: true,
            created_by: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          queryClient.setQueryData(queryKeys.competitors.all, [
            ...previousCompetitors,
            optimisticKel,
          ]);
        }
      }

      return { previousCompetitors };
    },

    onError: (error, _input, context) => {
      if (context?.previousCompetitors) {
        queryClient.setQueryData(queryKeys.competitors.all, context.previousCompetitors);
      }
      toast.error("Failed to set Kel's position", {
        description: getErrorMessage(error),
      });
    },

    onSuccess: () => {
      toast.success("Kel's position set");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitors.all });
    },
  });
}
