/**
 * QuickCaptureWidget Tests
 *
 * Tests for the integrated capture widget component.
 */

import 'fake-indexeddb/auto';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QuickCaptureWidget } from './QuickCaptureWidget';
import { captureQueue, CAPTURE_QUEUE_DB_NAME } from '@/lib/storage';

// Mock dependencies
vi.mock('@/hooks/offline', () => ({
  useOnlineStatus: vi.fn(() => ({ isOnline: true })),
  isOfflineError: vi.fn(() => false),
}));

const mockUpload = vi.fn();
vi.mock('@/lib/storage/quickCaptureStorage', () => ({
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

describe('QuickCaptureWidget', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await captureQueue.clear();

    mockUpload.mockResolvedValue({
      path: 'user123/1234_abc.jpg',
      url: 'https://storage.example.com/signed-url',
    });

    mockCreatePhotoEvidence.mockResolvedValue({
      id: 'evidence-1',
      question_id: null,
      title: 'Test capture',
      image_url: 'user123/1234_abc.jpg',
      source_type: 'photo',
      created_by: 'user123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    });
  });

  afterEach(() => {
    indexedDB.deleteDatabase(CAPTURE_QUEUE_DB_NAME);
  });

  it('renders the FAB', () => {
    render(<QuickCaptureWidget userId="user123" />, { wrapper });

    expect(screen.getByTestId('quick-capture-fab')).toBeInTheDocument();
  });

  it('opens the capture sheet when FAB is clicked', async () => {
    render(<QuickCaptureWidget userId="user123" />, { wrapper });

    fireEvent.click(screen.getByTestId('quick-capture-fab'));

    await waitFor(() => {
      expect(screen.getByTestId('quick-capture-sheet')).toBeInTheDocument();
    });
  });

  it('closes the sheet after successful capture', async () => {
    render(<QuickCaptureWidget userId="user123" />, { wrapper });

    // Open sheet
    fireEvent.click(screen.getByTestId('quick-capture-fab'));

    await waitFor(() => {
      expect(screen.getByTestId('quick-capture-sheet')).toBeInTheDocument();
    });

    // Simulate photo selection
    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const cameraInput = screen.getByTestId('camera-input');
    fireEvent.change(cameraInput, { target: { files: [file] } });

    // Submit
    fireEvent.click(screen.getByTestId('capture-submit-button'));

    // Sheet should close after success
    await waitFor(() => {
      expect(screen.queryByTestId('quick-capture-sheet')).not.toBeInTheDocument();
    });
  });

  it('shows pending sync badge when there are queued captures', async () => {
    // Make upload hang so we can see the badge
    mockUpload.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Add a capture to the queue
    await captureQueue.add({
      photoBase64: 'data:image/jpeg;base64,test',
      fileName: 'test.jpg',
      mimeType: 'image/jpeg',
      note: 'Test',
      userId: 'user123',
      questionId: null,
    });

    render(<QuickCaptureWidget userId="user123" />, { wrapper });

    // Wait for the pending badge to appear (may show "Syncing..." due to autoSync)
    await waitFor(() => {
      expect(screen.getByTestId('pending-sync-badge')).toBeInTheDocument();
    });

    // Badge should show either pending count or syncing state
    const badge = screen.getByTestId('pending-sync-badge');
    expect(badge.textContent).toMatch(/1 pending|Syncing/);
  });

  it('does not show pending badge when queue is empty', async () => {
    render(<QuickCaptureWidget userId="user123" />, { wrapper });

    // Give some time for initial load
    await waitFor(() => {
      expect(screen.getByTestId('quick-capture-fab')).toBeInTheDocument();
    });

    // Badge should not be present
    expect(screen.queryByTestId('pending-sync-badge')).not.toBeInTheDocument();
  });

  it('passes questionId to capture hook when provided', async () => {
    render(
      <QuickCaptureWidget userId="user123" questionId="q-123" />,
      { wrapper }
    );

    // Open sheet
    fireEvent.click(screen.getByTestId('quick-capture-fab'));

    await waitFor(() => {
      expect(screen.getByTestId('quick-capture-sheet')).toBeInTheDocument();
    });

    // Simulate capture
    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const cameraInput = screen.getByTestId('camera-input');
    fireEvent.change(cameraInput, { target: { files: [file] } });
    fireEvent.click(screen.getByTestId('capture-submit-button'));

    await waitFor(() => {
      expect(mockCreatePhotoEvidence).toHaveBeenCalled();
    });

    // Verify questionId was passed
    expect(mockCreatePhotoEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        question_id: 'q-123',
      })
    );
  });
});
