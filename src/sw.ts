import { defaultCache } from '@serwist/next/worker';
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Supabase API caching configuration for offline read-only support.
 *
 * Strategy: StaleWhileRevalidate
 * - Returns cached response immediately (fast offline access)
 * - Fetches fresh data in background when online
 * - Only caches successful GET requests (status 200)
 *
 * Matches: Supabase REST API GET requests
 * - Pattern: *.supabase.co/rest/v1/*
 * - Only GET method (reads), not POST/PATCH/DELETE (writes)
 *
 * Cache limits:
 * - Max 100 entries to prevent unbounded growth
 * - 24-hour expiration for data freshness
 */
const supabaseApiCache: RuntimeCaching = {
  matcher: ({ request, url }) => {
    // Only cache GET requests (reads)
    if (request.method !== 'GET') return false;

    // Match Supabase REST API pattern: *.supabase.co/rest/v1/*
    return url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1/');
  },
  handler: new StaleWhileRevalidate({
    cacheName: 'supabase-api-cache',
    plugins: [
      // Only cache successful responses
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      // Limit cache size and age
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        purgeOnQuotaError: true,
      }),
    ],
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Combine default Next.js caching with Supabase API caching
  runtimeCaching: [supabaseApiCache, ...defaultCache],
});

serwist.addEventListeners();
