/**
 * getQueryClient Unit Tests
 *
 * Tests the server/browser QueryClient factory behavior.
 * Critical infrastructure for server-side prefetching.
 *
 * @see Story 6.8: Performance Optimization
 */
import { QueryClient } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the isServer export from @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    isServer: false, // Default to browser mode
  };
});

describe('getQueryClient', () => {
  beforeEach(() => {
    // Reset modules to clear singleton between tests
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Browser environment (isServer = false)', () => {
    it('returns a QueryClient instance', async () => {
      // Arrange - mock browser environment
      vi.doMock('@tanstack/react-query', async () => {
        const actual = await vi.importActual('@tanstack/react-query');
        return { ...actual, isServer: false };
      });

      // Act
      const { getQueryClient } = await import('./get-query-client');
      const client = getQueryClient();

      // Assert
      expect(client).toBeInstanceOf(QueryClient);
    });

    it('returns the same instance on subsequent calls (singleton)', async () => {
      // Arrange - mock browser environment
      vi.doMock('@tanstack/react-query', async () => {
        const actual = await vi.importActual('@tanstack/react-query');
        return { ...actual, isServer: false };
      });

      // Act
      const { getQueryClient } = await import('./get-query-client');
      const client1 = getQueryClient();
      const client2 = getQueryClient();
      const client3 = getQueryClient();

      // Assert - all should be the same instance
      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });
  });

  describe('Server environment (isServer = true)', () => {
    it('returns a QueryClient instance', async () => {
      // Arrange - mock server environment
      vi.doMock('@tanstack/react-query', async () => {
        const actual = await vi.importActual('@tanstack/react-query');
        return { ...actual, isServer: true };
      });

      // Act
      const { getQueryClient } = await import('./get-query-client');
      const client = getQueryClient();

      // Assert
      expect(client).toBeInstanceOf(QueryClient);
    });

    it('returns a NEW instance on each call (no singleton)', async () => {
      // Arrange - mock server environment
      vi.doMock('@tanstack/react-query', async () => {
        const actual = await vi.importActual('@tanstack/react-query');
        return { ...actual, isServer: true };
      });

      // Act
      const { getQueryClient } = await import('./get-query-client');
      const client1 = getQueryClient();
      const client2 = getQueryClient();

      // Assert - should be different instances
      expect(client1).not.toBe(client2);
    });
  });

  describe('Default options', () => {
    it('configures staleTime to 60 seconds', async () => {
      // Arrange
      vi.doMock('@tanstack/react-query', async () => {
        const actual = await vi.importActual('@tanstack/react-query');
        return { ...actual, isServer: false };
      });

      // Act
      const { getQueryClient } = await import('./get-query-client');
      const client = getQueryClient();
      const options = client.getDefaultOptions();

      // Assert
      expect(options.queries?.staleTime).toBe(60 * 1000);
    });

    it('configures retry to 1', async () => {
      // Arrange
      vi.doMock('@tanstack/react-query', async () => {
        const actual = await vi.importActual('@tanstack/react-query');
        return { ...actual, isServer: false };
      });

      // Act
      const { getQueryClient } = await import('./get-query-client');
      const client = getQueryClient();
      const options = client.getDefaultOptions();

      // Assert
      expect(options.queries?.retry).toBe(1);
    });
  });
});
