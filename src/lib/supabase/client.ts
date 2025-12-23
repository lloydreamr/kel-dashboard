import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for browser/client-side usage.
 * Use this in Client Components that need to interact with Supabase.
 *
 * Note: We access NEXT_PUBLIC_* env vars directly here (not through env.ts)
 * because Next.js needs to statically replace these values at build time.
 * Dynamic access via getters doesn't work on the client side.
 *
 * @example
 * import { createClient } from '@/lib/supabase/client';
 * const supabase = createClient();
 * const { data } = await supabase.from('profiles').select('*');
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
