import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('FEATURES', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Ensure required Supabase vars are set for env.ts validation
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('OFFLINE_MODE', () => {
    it('defaults to false when env var is not set', async () => {
      delete process.env.NEXT_PUBLIC_OFFLINE_ENABLED;

      const { FEATURES } = await import('./features');

      expect(FEATURES.OFFLINE_MODE).toBe(false);
    });

    it('returns true when env var is "true"', async () => {
      process.env.NEXT_PUBLIC_OFFLINE_ENABLED = 'true';

      const { FEATURES } = await import('./features');

      expect(FEATURES.OFFLINE_MODE).toBe(true);
    });

    it('returns false when env var is "false"', async () => {
      process.env.NEXT_PUBLIC_OFFLINE_ENABLED = 'false';

      const { FEATURES } = await import('./features');

      expect(FEATURES.OFFLINE_MODE).toBe(false);
    });

    it('returns false when env var is empty string', async () => {
      process.env.NEXT_PUBLIC_OFFLINE_ENABLED = '';

      const { FEATURES } = await import('./features');

      expect(FEATURES.OFFLINE_MODE).toBe(false);
    });

    it('returns false when env var is any other value', async () => {
      process.env.NEXT_PUBLIC_OFFLINE_ENABLED = 'yes';

      const { FEATURES } = await import('./features');

      expect(FEATURES.OFFLINE_MODE).toBe(false);
    });
  });

  describe('type safety', () => {
    it('FEATURES object has correct structure', async () => {
      const { FEATURES } = await import('./features');

      expect(typeof FEATURES.OFFLINE_MODE).toBe('boolean');
      expect(Object.keys(FEATURES)).toContain('OFFLINE_MODE');
    });

    it('Features type is exported', async () => {
      // This test verifies the type export exists at runtime
      // TypeScript compilation will fail if type is wrong
      const featuresModule = await import('./features');

      expect(featuresModule.FEATURES).toBeDefined();
      // Type checking happens at compile time
      // This test ensures the module structure is correct
    });

    it('FEATURES object is frozen (immutable)', async () => {
      const { FEATURES } = await import('./features');

      expect(Object.isFrozen(FEATURES)).toBe(true);

      // Verify mutation throws in strict mode (which Vitest uses)
      expect(() => {
        // @ts-expect-error - testing runtime immutability
        FEATURES.OFFLINE_MODE = true;
      }).toThrow(TypeError);
    });
  });
});
