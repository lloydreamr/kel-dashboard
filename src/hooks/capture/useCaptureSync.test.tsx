/**
 * useCaptureSync Hook Tests
 */

import 'fake-indexeddb/auto';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCaptureSync } from './useCaptureSync';
// Import actual captureQueue for real IndexedDB testing
import {
  captureQueue,
  CAPTURE_QUEUE_DB_NAME,
} from '@/lib/storage/captureQueue';

// Mock dependencies
vi.mock('@/hooks/offline', () => ({
  useOnlineStatus: vi.fn(() => ({ isOnline: true })),
}));

const mockUpload = vi.fn();
const mockBase64ToFile = vi.fn((base64: string, name: string, type: string) => {
  return new File(['test'], name, { type });
});

// Mock @/lib/storage barrel - preserve real captureQueue, mock storage functions
vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage')>();
  return {
    ...actual,
    uploadQuickCapture: (...args: unknown[]) => mockUpload(...args),
    base64ToFile: (...args: unknown[]) =>
      mockBase64ToFile(...(args as [string, string, string])),
  };
});

const mockCreatePhotoEvidence = vi.fn();
vi.mock('@/lib/repositories/evidence', () => ({
  evidenceRepo: {
    createPhotoEvidence: (...args: unknown[]) => mockCreatePhotoEvidence(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import mocked modules for assertions
import { toast } from 'sonner';
import { useOnlineStatus } from '@/hooks/offline';

describe('useCaptureSync', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockQueuedCapture = {
    photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
    note: 'Test note',
    category: 'market' as const,
    userId: 'user123',
    questionId: 'q1',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Clear the capture queue
    await captureQueue.clear();

    // Reset online status mock
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: true });

    // Default successful responses
    mockUpload.mockResolvedValue({
      path: 'user123/1234_abc.jpg',
      url: 'https://storage.example.com/signed-url',
    });

    mockCreatePhotoEvidence.mockResolvedValue({
      id: 'evidence-1',
      question_id: 'q1',
      title: 'Test note',
      image_url: 'user123/1234_abc.jpg',
      source_type: 'photo',
      created_by: 'user123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    });
  });

  afterEach(() => {
    // Clean up database
    indexedDB.deleteDatabase(CAPTURE_QUEUE_DB_NAME);
  });

  it('returns zero pending count when queue is empty', async () => {
    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it('returns correct pending count', async () => {
    await captureQueue.add(mockQueuedCapture);
    await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(2);
    });
  });

  it('syncs captures when syncNow is called', async () => {
    await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
    });

    await act(async () => {
      await result.current.syncNow();
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    expect(mockUpload).toHaveBeenCalled();
    expect(mockCreatePhotoEvidence).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Synced 1 capture', expect.any(Object));
  });

  it('removes capture from queue after successful sync', async () => {
    const id = await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await act(async () => {
      await result.current.syncNow();
    });

    const capture = await captureQueue.get(id);
    expect(capture).toBeNull();
  });

  it('shows isSyncing during sync', async () => {
    let resolveUpload: (value: { path: string }) => void;
    mockUpload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
    });

    // Start sync
    let syncPromise: Promise<void>;
    act(() => {
      syncPromise = result.current.syncNow();
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(true);
    });

    // Resolve upload
    await act(async () => {
      resolveUpload!({ path: 'test.jpg' });
      await syncPromise;
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
  });

  it('handles sync error gracefully', async () => {
    mockUpload.mockRejectedValueOnce(new Error('Upload failed'));

    await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await act(async () => {
      await result.current.syncNow();
    });

    // Capture should still be in queue (for retry)
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('increments attempt count on failure', async () => {
    mockUpload.mockRejectedValueOnce(new Error('Upload failed'));

    const id = await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await act(async () => {
      await result.current.syncNow();
    });

    const capture = await captureQueue.get(id);
    expect(capture?.attempts).toBe(1);
    expect(capture?.lastError).toBe('Upload failed');
  });

  it('skips captures that exceeded max attempts', async () => {
    // Add a capture with 3 attempts (max)
    const id = await captureQueue.add(mockQueuedCapture);
    await captureQueue.markAttempt(id, 'Error 1');
    await captureQueue.markAttempt(id, 'Error 2');
    await captureQueue.markAttempt(id, 'Error 3');

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await act(async () => {
      await result.current.syncNow();
    });

    // Upload should not be called for this capture
    expect(mockUpload).not.toHaveBeenCalled();

    // Capture is still in queue (for manual inspection)
    expect(result.current.pendingCount).toBe(1);
  });

  it('does not sync when offline', async () => {
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: false });

    await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await act(async () => {
      await result.current.syncNow();
    });

    expect(mockUpload).not.toHaveBeenCalled();
    expect(result.current.syncError).toBeTruthy();
  });

  it('calls onSyncComplete when all captures synced', async () => {
    const onSyncComplete = vi.fn();

    await captureQueue.add(mockQueuedCapture);

    const { result } = renderHook(
      () =>
        useCaptureSync({
          userId: 'user123',
          autoSync: false,
          onSyncComplete,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.syncNow();
    });

    expect(onSyncComplete).toHaveBeenCalled();
  });

  it('refreshes count when refreshCount is called', async () => {
    const { result } = renderHook(
      () => useCaptureSync({ userId: 'user123', autoSync: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });

    // Add captures directly to queue
    await captureQueue.add(mockQueuedCapture);
    await captureQueue.add(mockQueuedCapture);

    // Refresh count
    await act(async () => {
      await result.current.refreshCount();
    });

    expect(result.current.pendingCount).toBe(2);
  });
});
