/**
 * Market Intelligence Questions Page Tests
 *
 * Tests the MI questions page (/market-intelligence/questions).
 * Verifies page renders with correct test IDs and uses QuestionsPageClient.
 *
 * Note: Auth redirect tests are covered by E2E tests (questions-redirect.spec.ts)
 * since testing async Server Components with Supabase auth is complex.
 *
 * @see Story 17.4: Questions Page Integration
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock QuestionsPageClient component
vi.mock('@/app/(dashboard)/questions/QuestionsPageClient', () => ({
  QuestionsPageClient: ({ userId }: { userId: string }) => (
    <div data-testid="questions-page-client-mock" data-user-id={userId}>
      Questions Page Client
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
import MiQuestionsPage from './page';

describe('MiQuestionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    it('renders the page with correct test ID wrapper', async () => {
      const Page = await MiQuestionsPage();
      render(Page);

      expect(screen.getByTestId('mi-questions-page')).toBeInTheDocument();
    });

    it('renders QuestionsPageClient component', async () => {
      const Page = await MiQuestionsPage();
      render(Page);

      expect(screen.getByTestId('questions-page-client-mock')).toBeInTheDocument();
    });

    it('passes userId to QuestionsPageClient', async () => {
      const Page = await MiQuestionsPage();
      render(Page);

      const client = screen.getByTestId('questions-page-client-mock');
      expect(client.getAttribute('data-user-id')).toBe('test-user-123');
    });

    it('renders MiBreadcrumb with correct current page', async () => {
      const Page = await MiQuestionsPage();
      render(Page);

      const breadcrumb = screen.getByTestId('mi-breadcrumb-mock');
      expect(breadcrumb).toBeInTheDocument();
      expect(breadcrumb.getAttribute('data-current')).toBe('Questions');
    });
  });
});
