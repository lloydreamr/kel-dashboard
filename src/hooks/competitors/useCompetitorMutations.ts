import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useOfflineGuard, isOfflineError } from '@/hooks/offline';
import { queryKeys } from '@/lib/queryKeys';
import { competitorsRepo } from '@/lib/repositories/competitors';

import type { CompetitorDataPoint, CreateCompetitorInput, UpdateCompetitorInput } from '@/types';

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

export function useCreateCompetitor() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: (input: CreateCompetitorInput) => {
      guardOffline(); // Throws OfflineError if offline
      return competitorsRepo.create(input);
    },

    // Optimistic update: Add pending competitor to list
    onMutate: async (newCompetitor) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.competitors.all });

      const previousCompetitors = queryClient.getQueryData<CompetitorDataPoint[]>(
        queryKeys.competitors.all
      );

      if (previousCompetitors) {
        const optimisticCompetitor: CompetitorDataPoint = {
          id: `temp-${Date.now()}`,
          name: newCompetitor.name,
          price_score: newCompetitor.price_score,
          quality_score: newCompetitor.quality_score,
          category: newCompetitor.category ?? null,
          notes: newCompetitor.notes ?? null,
          is_kel_position: newCompetitor.is_kel_position ?? false,
          created_by: '', // Will be set by server
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(queryKeys.competitors.all, [
          ...previousCompetitors,
          optimisticCompetitor,
        ]);
      }

      return { previousCompetitors };
    },

    onError: (error, _newCompetitor, context) => {
      if (context?.previousCompetitors) {
        queryClient.setQueryData(queryKeys.competitors.all, context.previousCompetitors);
      }
      // Skip duplicate toast if offline error (guardOffline already showed toast)
      if (isOfflineError(error)) return;
      toast.error('Failed to add competitor', {
        description: getErrorMessage(error),
      });
    },

    onSuccess: () => {
      toast.success('Competitor added');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitors.all });
    },
  });
}

export function useUpdateCompetitor() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCompetitorInput }) => {
      guardOffline(); // Throws OfflineError if offline
      return competitorsRepo.update(id, input);
    },

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.competitors.all });

      const previousCompetitors = queryClient.getQueryData<CompetitorDataPoint[]>(
        queryKeys.competitors.all
      );

      if (previousCompetitors) {
        queryClient.setQueryData(
          queryKeys.competitors.all,
          previousCompetitors.map((c) => {
            if (c.id !== id) return c;

            // Safely merge input, preserving existing fields if input fields are undefined
            return {
              ...c,
              ...Object.fromEntries(
                Object.entries(input).filter(([_, value]) => value !== undefined)
              ),
            };
          })
        );
      }

      return { previousCompetitors };
    },

    onError: (error, _variables, context) => {
      if (context?.previousCompetitors) {
        queryClient.setQueryData(queryKeys.competitors.all, context.previousCompetitors);
      }
      // Skip duplicate toast if offline error (guardOffline already showed toast)
      if (isOfflineError(error)) return;
      toast.error('Failed to update competitor', {
        description: getErrorMessage(error),
      });
    },

    onSuccess: () => {
      toast.success('Competitor updated');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitors.all });
    },
  });
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient();
  const { guardOffline } = useOfflineGuard();

  return useMutation({
    mutationFn: (id: string) => {
      guardOffline(); // Throws OfflineError if offline
      return competitorsRepo.delete(id);
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.competitors.all });

      const previousCompetitors = queryClient.getQueryData<CompetitorDataPoint[]>(
        queryKeys.competitors.all
      );

      if (previousCompetitors) {
        queryClient.setQueryData(
          queryKeys.competitors.all,
          previousCompetitors.filter((c) => c.id !== id)
        );
      }

      return { previousCompetitors };
    },

    onError: (error, _id, context) => {
      if (context?.previousCompetitors) {
        queryClient.setQueryData(queryKeys.competitors.all, context.previousCompetitors);
      }
      // Skip duplicate toast if offline error (guardOffline already showed toast)
      if (isOfflineError(error)) return;
      toast.error('Failed to remove competitor', {
        description: getErrorMessage(error),
      });
    },

    onSuccess: () => {
      toast.success('Competitor removed');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitors.all });
    },
  });
}
