import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQuickCapture } from './useQuickCapture';

import type { QuickCaptureData } from '@/components/capture';

// Mock dependencies
vi.mock('@/hooks/offline', () => ({
  useOnlineStatus: vi.fn(() => ({ isOnline: true })),
  isOfflineError: vi.fn(() => false),
}));

const mockUpload = vi.fn();
vi.mock('@/lib/storage', () => ({
  uploadQuickCapture: (...args: unknown[]) => mockUpload(...args),
}));

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

describe('useQuickCapture', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockCaptureData: QuickCaptureData = {
    photo: new File(['test'], 'photo.jpg', { type: 'image/jpeg' }),
    note: 'Market shelf observation',
    previewUrl: 'blob:http://localhost/preview',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

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
      title: 'Market shelf observation',
      image_url: 'user123/1234_abc.jpg',
      source_type: 'photo',
      created_by: 'user123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    });
  });

  it('uploads photo and creates evidence on submit', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () =>
        useQuickCapture({
          userId: 'user123',
          questionId: 'q1',
          onSuccess,
        }),
      { wrapper }
    );

    act(() => {
      result.current.submitCapture(mockCaptureData);
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });

    expect(mockUpload).toHaveBeenCalledWith(mockCaptureData.photo, 'user123');
    expect(mockCreatePhotoEvidence).toHaveBeenCalledWith({
      question_id: 'q1',
      title: 'Market shelf observation',
      image_url: 'user123/1234_abc.jpg',
      source_type: 'photo',
      excerpt: 'Market shelf observation',
      created_by: 'user123',
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Photo captured', expect.any(Object));
  });

  it('uses default title when no note provided', async () => {
    const { result } = renderHook(
      () => useQuickCapture({ userId: 'user123', questionId: 'q1' }),
      { wrapper }
    );

    const dataWithoutNote: QuickCaptureData = {
      ...mockCaptureData,
      note: '',
    };

    act(() => {
      result.current.submitCapture(dataWithoutNote);
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });

    expect(mockCreatePhotoEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Quick capture photo',
        excerpt: null,
      })
    );
  });

  it('shows isSubmitting during upload', async () => {
    // Create a promise we can control
    let resolveUpload: (value: { path: string }) => void;
    mockUpload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    const { result } = renderHook(
      () => useQuickCapture({ userId: 'user123' }),
      { wrapper }
    );

    act(() => {
      result.current.submitCapture(mockCaptureData);
    });

    // Wait for the mutation to start (isPending becomes true)
    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });

    // Resolve the upload
    await act(async () => {
      resolveUpload!({ path: 'test.jpg' });
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it('handles upload error', async () => {
    const uploadError = new Error('Upload failed: Network error');
    mockUpload.mockRejectedValueOnce(uploadError);

    const onError = vi.fn();
    const { result } = renderHook(
      () => useQuickCapture({ userId: 'user123', onError }),
      { wrapper }
    );

    act(() => {
      result.current.submitCapture(mockCaptureData);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(onError).toHaveBeenCalledWith(uploadError);
    expect(toast.error).toHaveBeenCalledWith('Capture failed', expect.any(Object));
    expect(mockCreatePhotoEvidence).not.toHaveBeenCalled();
  });

  it('handles evidence creation error', async () => {
    const dbError = new Error('Database error');
    mockCreatePhotoEvidence.mockRejectedValueOnce(dbError);

    const onError = vi.fn();
    const { result } = renderHook(
      () => useQuickCapture({ userId: 'user123', onError }),
      { wrapper }
    );

    act(() => {
      result.current.submitCapture(mockCaptureData);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(onError).toHaveBeenCalledWith(dbError);
    expect(toast.error).toHaveBeenCalled();
  });

  it('prevents submission when offline', async () => {
    vi.mocked(useOnlineStatus).mockReturnValue({ isOnline: false });

    const { result } = renderHook(
      () => useQuickCapture({ userId: 'user123' }),
      { wrapper }
    );

    act(() => {
      result.current.submitCapture(mockCaptureData);
    });

    // Should not call upload when offline
    expect(mockUpload).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Cannot capture while offline',
      expect.any(Object)
    );
  });

  it('works without questionId', async () => {
    const { result } = renderHook(
      () => useQuickCapture({ userId: 'user123' }), // No questionId
      { wrapper }
    );

    act(() => {
      result.current.submitCapture(mockCaptureData);
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });

    expect(mockCreatePhotoEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        question_id: null,
      })
    );
  });

  it('can reset error state', async () => {
    mockUpload.mockRejectedValueOnce(new Error('Upload failed'));

    const { result } = renderHook(
      () => useQuickCapture({ userId: 'user123' }),
      { wrapper }
    );

    act(() => {
      result.current.submitCapture(mockCaptureData);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      result.current.reset();
    });

    // Wait for the reset to take effect
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
