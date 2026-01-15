/**
 * Market Intelligence Question Detail Page Tests
 *
 * Tests the MI question detail page (/market-intelligence/questions/[id]).
 * Verifies page renders with correct test IDs, UUID validation, and uses QuestionDetailClient.
 *
 * Note: Auth redirect tests are covered by E2E tests (questions-redirect.spec.ts)
 * since testing async Server Components with Supabase auth is complex.
 *
 * @see Story 17.4: Questions Page Integration
 */

import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock QuestionDetailClient component
vi.mock('@/app/(dashboard)/questions/[id]/QuestionDetailClient', () => ({
  QuestionDetailClient: ({ questionId }: { questionId: string }) => (
    <div data-testid="question-detail-client-mock" data-question-id={questionId}>
      Question Detail Client
    </div>
  ),
}));

// Mock MiBreadcrumb component
vi.mock('@/components/market-intelligence', () => ({
  MiBreadcrumb: ({ current }: { current: string }) => (
    <nav data-testid="mi-breadcrumb-mock" data-current={current}>
      Breadcrumb: {current}
    </nav>
  ),
}));

// Mock Supabase server client - return sync mock, auth handling tested via E2E
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123', email: 'test@example.com' } },
        error: null,
      }),
    },
  })),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => null),
    })
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Import the page component (default export required by Next.js)
import MiQuestionDetailPage from './page';

// Valid UUID v4 for testing
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('MiQuestionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UUID validation', () => {
    it('redirects to questions list for invalid UUID', async () => {
      await MiQuestionDetailPage({ params: Promise.resolve({ id: 'invalid-id' }) });

      expect(redirect).toHaveBeenCalledWith('/market-intelligence/questions');
    });

    it('redirects for non-v4 UUID format', async () => {
      // UUID v1 format (wrong version digit)
      await MiQuestionDetailPage({
        params: Promise.resolve({ id: '550e8400-e29b-11d4-a716-446655440000' }),
      });

      expect(redirect).toHaveBeenCalledWith('/market-intelligence/questions');
    });

    it('does not redirect for valid UUID v4', async () => {
      await MiQuestionDetailPage({ params: Promise.resolve({ id: VALID_UUID }) });

      expect(redirect).not.toHaveBeenCalledWith('/market-intelligence/questions');
    });
  });

  describe('when user is authenticated', () => {
    it('renders the page with correct test ID wrapper', async () => {
      const Page = await MiQuestionDetailPage({
        params: Promise.resolve({ id: VALID_UUID }),
      });
      render(Page as React.ReactElement);

      expect(screen.getByTestId('mi-question-detail-page')).toBeInTheDocument();
    });

    it('renders QuestionDetailClient component', async () => {
      const Page = await MiQuestionDetailPage({
        params: Promise.resolve({ id: VALID_UUID }),
      });
      render(Page as React.ReactElement);

      expect(screen.getByTestId('question-detail-client-mock')).toBeInTheDocument();
    });

    it('passes questionId to QuestionDetailClient', async () => {
      const Page = await MiQuestionDetailPage({
        params: Promise.resolve({ id: VALID_UUID }),
      });
      render(Page as React.ReactElement);

      const client = screen.getByTestId('question-detail-client-mock');
      expect(client.getAttribute('data-question-id')).toBe(VALID_UUID);
    });

    it('renders MiBreadcrumb with correct current page', async () => {
      const Page = await MiQuestionDetailPage({
        params: Promise.resolve({ id: VALID_UUID }),
      });
      render(Page as React.ReactElement);

      const breadcrumb = screen.getByTestId('mi-breadcrumb-mock');
      expect(breadcrumb).toBeInTheDocument();
      expect(breadcrumb.getAttribute('data-current')).toBe('Question Details');
    });
  });
});
