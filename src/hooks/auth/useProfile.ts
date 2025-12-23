/**
 * useProfile Hook
 *
 * TanStack Query hook for fetching current user's profile.
 * Used to determine if current user is Maho or Kel.
 */

import { useQuery } from '@tanstack/react-query';

import { profilesRepo } from '@/lib/repositories/profiles';

import type { Profile } from '@/types/database';

export const profileQueryKey = ['profile'] as const;

/**
 * Hook for fetching current user's profile.
 *
 * @returns Query result with profile data
 *
 * @example
 * const { data: profile } = useProfile();
 * const isKel = profile?.role === 'kel';
 */
export function useProfile() {
  return useQuery<Profile | null, Error>({
    queryKey: profileQueryKey,
    queryFn: () => profilesRepo.getCurrent(),
    staleTime: 1000 * 60 * 5, // Profile won't change frequently, cache for 5 min
  });
}
