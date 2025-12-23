import { createServerClient } from '@supabase/ssr';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createClient } from './server';

// Mock next/headers
const mockCookieStore = {
  getAll: vi.fn(() => [{ name: 'sb-token', value: 'test-token' }]),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  })),
}));

// Mock env module
vi.mock('@/lib/env', () => ({
  env: {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
  },
}));

// Type for the cookies config we're testing
type CookiesConfig = {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (
    cookies: Array<{ name: string; value: string; options: object }>
  ) => void;
};

// Helper to extract cookies config from mock calls
function getCookiesConfig(): CookiesConfig {
  const callArgs = vi.mocked(createServerClient).mock.calls[0];
  const config = callArgs[2]?.cookies as CookiesConfig | undefined;
  if (!config) throw new Error('cookies config not found in mock call');
  return config;
}

describe('Supabase Server Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a server client with correct configuration', async () => {
    const client = await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it('cookie getAll returns cookies from store', async () => {
    await createClient();

    const cookiesConfig = getCookiesConfig();
    const cookies = cookiesConfig.getAll();
    expect(cookies).toEqual([{ name: 'sb-token', value: 'test-token' }]);
  });

  it('cookie setAll sets cookies on the store', async () => {
    await createClient();

    const cookiesConfig = getCookiesConfig();
    cookiesConfig.setAll([
      { name: 'test-cookie', value: 'test-value', options: { path: '/' } },
    ]);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'test-cookie',
      'test-value',
      { path: '/' }
    );
  });

  it('setAll handles errors gracefully (Server Component context)', async () => {
    // Make set throw an error (simulating Server Component context)
    mockCookieStore.set.mockImplementationOnce(() => {
      throw new Error('Cannot set cookies in Server Component');
    });

    await createClient();

    const cookiesConfig = getCookiesConfig();
    // Should not throw
    expect(() => {
      cookiesConfig.setAll([
        { name: 'test-cookie', value: 'test-value', options: {} },
      ]);
    }).not.toThrow();
  });
});
