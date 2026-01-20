/**
 * Market Intelligence Questions Page
 *
 * Integrates existing Questions functionality into the Market Intelligence
 * section. Re-uses QuestionsPageClient from the original route for single
 * source of truth.
 *
 * @see Story 17.4: Questions Page Integration
 */

import { redirect } from 'next/navigation';

import { QuestionsPageClient } from '@/app/(dashboard)/questions/QuestionsPageClient';
import { MiBreadcrumb } from '@/components/market-intelligence';
import { getTestUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Questions | Market Intelligence',
  description: 'Strategic questions connected to market intelligence',
};

/**
 * MI Questions page - lists strategic questions within Market Intelligence.
 * Server component that handles auth check.
 */
// ⚠️ EXCEPTION: Next.js App Router REQUIRES export default for page.tsx files
// This is the ONLY place where export default is allowed in this project
export default async function MiQuestionsPage() {
  // Check for test user first (only in PLAYWRIGHT_TEST_MODE)
  const testUser = await getTestUser();
  if (testUser) {
    return (
      <div data-testid="mi-questions-page" className="container py-6">
        <MiBreadcrumb current="Questions" />
        <QuestionsPageClient userId={testUser.id} />
      </div>
    );
  }

  // Regular Supabase auth flow
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div data-testid="mi-questions-page" className="container py-6">
      <MiBreadcrumb current="Questions" />
      <QuestionsPageClient userId={user.id} />
    </div>
  );
}
