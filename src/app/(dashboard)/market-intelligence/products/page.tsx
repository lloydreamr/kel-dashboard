import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { ProductsPageClient } from './ProductsPageClient';

export const metadata = {
  title: 'Products | Market Intelligence',
  description: 'Browse products from the knowledge base',
};

/**
 * Get test user from cookie (only in PLAYWRIGHT_TEST_MODE).
 */
async function getTestUser(): Promise<{ id: string; email: string } | null> {
  if (process.env.PLAYWRIGHT_TEST_MODE !== 'true') {
    return null;
  }

  const cookieStore = await cookies();
  const testSessionCookie = cookieStore.get('kel-test-session');

  if (!testSessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(testSessionCookie.value);
    if (
      session.is_test_session &&
      session.user?.email &&
      session.expires_at > Date.now()
    ) {
      return {
        id: session.user.id || 'test-user-id',
        email: session.user.email,
      };
    }
  } catch {
    // Invalid JSON, ignore
  }

  return null;
}

/**
 * Products page - lists products from the knowledge base.
 * Server component that handles auth check.
 */
export default async function ProductsPage() {
  // Check for test user first (only in PLAYWRIGHT_TEST_MODE)
  const testUser = await getTestUser();
  if (testUser) {
    return <ProductsPageClient />;
  }

  // Regular Supabase auth flow
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ProductsPageClient />;
}
