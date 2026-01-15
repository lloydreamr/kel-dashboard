/**
 * Market Intelligence Question Detail Page
 *
 * Integrates existing Question detail functionality into the Market Intelligence
 * section. Re-uses QuestionDetailClient from the original route.
 *
 * @see Story 17.4: Questions Page Integration
 */

import { redirect } from 'next/navigation';

import { QuestionDetailClient } from '@/app/(dashboard)/questions/[id]/QuestionDetailClient';
import { MiBreadcrumb } from '@/components/market-intelligence';
import { getTestUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface MiQuestionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// UUID v4 regex pattern for validation
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * MI Question detail page - view question within Market Intelligence context.
 * Server component that handles auth and UUID validation.
 */
// ⚠️ EXCEPTION: Next.js App Router REQUIRES export default for page.tsx files
// This is the ONLY place where export default is allowed in this project
export default async function MiQuestionDetailPage({
  params,
}: MiQuestionDetailPageProps) {
  const { id } = await params;

  // Guard: Redirect invalid IDs to MI questions list
  if (!UUID_REGEX.test(id)) {
    redirect('/market-intelligence/questions');
  }

  // Check for test user first (only in PLAYWRIGHT_TEST_MODE)
  const testUser = await getTestUser();
  if (testUser) {
    return (
      <div data-testid="mi-question-detail-page" className="container py-6">
        <MiBreadcrumb current="Question Details" />
        <QuestionDetailClient questionId={id} />
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
    <div data-testid="mi-question-detail-page" className="container py-6">
      <MiBreadcrumb current="Question Details" />
      <QuestionDetailClient questionId={id} />
    </div>
  );
}
