/**
 * Server-Side Query Client Factory
 *
 * Creates a QueryClient for server-side data prefetching with Next.js App Router.
 * - Server: Creates new client per request (ensures fresh cache)
 * - Browser: Reuses singleton (maintains cache consistency)
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
 */
import { QueryClient, isServer } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // Match existing client config
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: reuse existing client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
