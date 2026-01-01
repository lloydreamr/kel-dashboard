/**
 * Visualization Layout with Server-Side Data Prefetch
 *
 * Prefetches profile and competitor data on the server to eliminate
 * client-side query waterfalls. This significantly improves initial
 * chart render time (NFR3: < 1 second).
 *
 * @see Story 6.8: Performance Optimization
 */
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { profileQueryKey } from '@/hooks/auth/useProfile';
import { getQueryClient } from '@/lib/get-query-client';
import { queryKeys } from '@/lib/queryKeys';
import { createClient } from '@/lib/supabase/server';

export default async function VisualizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  // Prefetch BOTH queries in parallel - critical for performance
  // Eliminates the profile → competitors waterfall on the client
  // Uses server Supabase client for auth context
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.competitors.all,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('competitor_data')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        return data ?? [];
      },
    }),
    queryClient.prefetchQuery({
      queryKey: profileQueryKey,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .single();
        // PGRST116 = no rows returned (user has no profile yet)
        if (error && error.code !== 'PGRST116') throw error;
        return data ?? null;
      },
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
