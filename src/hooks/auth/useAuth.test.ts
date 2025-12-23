import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useSignInWithOtp } from './useAuth';

// Mock Supabase client
const mockSignInWithOtp = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  })),
}));

describe('useSignInWithOtp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
  });

  it('starts with idle status', () => {
    const { result } = renderHook(() => useSignInWithOtp());

    expect(result.current.status).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('rejects unauthorized emails without API call', async () => {
    const { result } = renderHook(() => useSignInWithOtp());

    await act(async () => {
      await result.current.signIn('unauthorized@example.com');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe('This email is not authorized');
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('allows maho@ emails', async () => {
    const { result } = renderHook(() => useSignInWithOtp());

    await act(async () => {
      await result.current.signIn('maho@example.com');
    });

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'maho@example.com',
      })
    );
    expect(result.current.isSuccess).toBe(true);
  });

  it('allows kel@ emails', async () => {
    const { result } = renderHook(() => useSignInWithOtp());

    await act(async () => {
      await result.current.signIn('kel@company.org');
    });

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'kel@company.org',
      })
    );
    expect(result.current.isSuccess).toBe(true);
  });

  it('sets loading state during API call', async () => {
    let resolvePromise: (value: unknown) => void;
    mockSignInWithOtp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useSignInWithOtp());

    // Start the sign-in but don't await it
    act(() => {
      result.current.signIn('maho@example.com');
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('loading');
    });

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ error: null });
    });

    // Should be success
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('handles API errors', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'API Error' },
    });

    const { result } = renderHook(() => useSignInWithOtp());

    await act(async () => {
      await result.current.signIn('maho@example.com');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe('API Error');
  });

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useSignInWithOtp());

    // First, trigger an error
    await act(async () => {
      await result.current.signIn('unauthorized@example.com');
    });

    expect(result.current.isError).toBe(true);

    // Then reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('includes emailRedirectTo in options', async () => {
    const { result } = renderHook(() => useSignInWithOtp());

    await act(async () => {
      await result.current.signIn('maho@example.com');
    });

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        }),
      })
    );
  });
});
