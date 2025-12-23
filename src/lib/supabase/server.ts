import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { env } from '@/lib/env';

import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for server-side usage (Server Components, Route Handlers, Server Actions).
 * Handles cookie management for authentication state.
 *
 * @example
 * import { createClient } from '@/lib/supabase/server';
 * const supabase = await createClient();
 * const { data } = await supabase.from('profiles').select('*');
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
