import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the @supabase/ssr module
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

// Mock the env module
vi.mock('@/lib/env', () => ({
  env: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

describe('updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns user when authenticated', async () => {
    // Arrange: Mock authenticated user
    const { createServerClient } = await import('@supabase/ssr');
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '123', email: 'maho@test.com' } },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createServerClient>);

    // Act: Call updateSession
    const { updateSession } = await import('./middleware');
    const request = new NextRequest('http://localhost:3000/dashboard');
    const result = await updateSession(request);

    // Assert: User is returned
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe('maho@test.com');
    expect(result.supabaseResponse).toBeInstanceOf(NextResponse);
  });

  it('returns null user when not authenticated', async () => {
    // Arrange: Mock no user
    const { createServerClient } = await import('@supabase/ssr');
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createServerClient>);

    // Act
    const { updateSession } = await import('./middleware');
    const request = new NextRequest('http://localhost:3000/dashboard');
    const result = await updateSession(request);

    // Assert
    expect(result.user).toBeNull();
    expect(result.supabaseResponse).toBeInstanceOf(NextResponse);
  });

  it('returns response even when auth check fails', async () => {
    // Arrange: Mock auth error
    const { createServerClient } = await import('@supabase/ssr');
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Auth error' },
        }),
      },
    } as unknown as ReturnType<typeof createServerClient>);

    // Act
    const { updateSession } = await import('./middleware');
    const request = new NextRequest('http://localhost:3000/');
    const result = await updateSession(request);

    // Assert: Should still return a valid response
    expect(result.supabaseResponse).toBeInstanceOf(NextResponse);
    expect(result.user).toBeNull();
  });

  it('calls createServerClient with correct cookies config', async () => {
    // Arrange
    const { createServerClient } = await import('@supabase/ssr');
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as unknown as ReturnType<typeof createServerClient>);

    // Act
    const { updateSession } = await import('./middleware');
    const request = new NextRequest('http://localhost:3000/test');
    await updateSession(request);

    // Assert: createServerClient was called with cookies handlers
    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });
});
