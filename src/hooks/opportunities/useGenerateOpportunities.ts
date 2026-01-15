/**
 * useGenerateOpportunities Hook
 *
 * TanStack Query mutation hook for triggering AI opportunity generation.
 * Includes cooldown to prevent abuse and tracks last refresh timestamp.
 *
 * Story 16-5: Manual Opportunity Refresh
 */

import { useEffect, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';

import type {
  GenerateOpportunitiesResponse,
  GenerateOpportunitiesErrorResponse,
} from '@/lib/ai/opportunity-types';

const COOLDOWN_SECONDS = 30;
const LAST_REFRESH_KEY = 'kel:opportunities:lastRefresh';

/**
 * Hook for triggering AI opportunity generation.
 * Includes cooldown to prevent abuse and tracks last refresh timestamp.
 *
 * @returns Mutation + cooldown state + last refresh timestamp
 *
 * @example
 * const { mutate, isPending, isCooldown, cooldownSeconds, lastRefresh } = useGenerateOpportunities();
 */
export function useGenerateOpportunities() {
  const queryClient = useQueryClient();
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(LAST_REFRESH_KEY);
      if (!stored) return null;
      const date = new Date(stored);
      // Validate the date is valid (not NaN)
      return isNaN(date.getTime()) ? null : date;
    } catch {
      // localStorage may be unavailable (e.g., Safari private mode)
      return null;
    }
  });

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const mutation = useMutation<GenerateOpportunitiesResponse, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/ai/generate-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as GenerateOpportunitiesErrorResponse;
        throw new Error(errorData.error || 'Failed to generate opportunities');
      }

      return response.json() as Promise<GenerateOpportunitiesResponse>;
    },
    onSuccess: (data) => {
      // Update last refresh timestamp
      const now = new Date();
      setLastRefresh(now);
      try {
        localStorage.setItem(LAST_REFRESH_KEY, now.toISOString());
      } catch {
        // localStorage may be unavailable - continue without persistence
      }

      // Start cooldown (AC9)
      setCooldownSeconds(COOLDOWN_SECONDS);

      // Show success toast with breakdown
      const breakdown = Object.entries(data.breakdown)
        .filter(([, count]) => count > 0)
        .map(([category, count]) => `${count} ${category.replace(/_/g, ' ')}`)
        .join(', ');

      toast.success(`Generated ${data.generated} opportunities`, {
        description: breakdown || 'No opportunities found',
      });

      // Invalidate to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
    },
    onError: (error) => {
      // Error toast with retry action (AC6)
      toast.error('Failed to generate opportunities', {
        description: error instanceof Error ? error.message : 'Unknown error',
        action: {
          label: 'Retry',
          onClick: () => mutation.mutate(),
        },
      });
    },
  });

  return {
    ...mutation,
    isCooldown: cooldownSeconds > 0,
    cooldownSeconds,
    lastRefresh,
  };
}
