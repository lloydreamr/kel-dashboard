import { createBrowserClient } from '@supabase/ssr';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createClient } from './client';

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  })),
}));

describe('Supabase Browser Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.env for each test (client.ts reads directly from process.env)
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates a browser client with correct configuration', () => {
    const client = createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'test-anon-key'
    );
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it('returns a new client instance on each call', () => {
    const client1 = createClient();
    const client2 = createClient();

    // Both should trigger createBrowserClient
    expect(createBrowserClient).toHaveBeenCalledTimes(2);
    expect(client1).toBeDefined();
    expect(client2).toBeDefined();
  });
});
