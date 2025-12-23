'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

/**
 * Server action to sign out the current user.
 * Clears both Supabase session and test session cookie, then redirects to login.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear test session cookie if present (for PLAYWRIGHT_TEST_MODE)
  const cookieStore = await cookies();
  cookieStore.delete('kel-test-session');

  redirect('/login');
}
