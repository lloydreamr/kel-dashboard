'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

import { useServiceWorkerUpdate, useSyncOnQuerySuccess } from '@/hooks/offline';

/**
 * Wrapper component that initializes app-wide effects.
 * Handles service worker updates and sync status tracking.
 */
function AppEffects() {
  // Listen for service worker updates and show refresh prompt
  useServiceWorkerUpdate();
  // Update sync timestamp when queries succeed
  useSyncOnQuerySuccess();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppEffects />
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}
