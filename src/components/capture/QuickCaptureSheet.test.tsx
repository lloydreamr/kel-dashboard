import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuickCaptureSheet } from './QuickCaptureSheet';

describe('QuickCaptureSheet', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnCapture = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    expect(screen.getByTestId('quick-capture-sheet')).toBeInTheDocument();
    expect(screen.getByText('Quick Capture')).toBeInTheDocument();
  });

  it('shows camera and gallery buttons when no photo', () => {
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    expect(screen.getByTestId('camera-button')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-button')).toBeInTheDocument();
    expect(screen.getByTestId('capture-placeholder')).toBeInTheDocument();
  });

  it('disables submit button when no photo is selected', () => {
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    expect(screen.getByTestId('capture-submit-button')).toBeDisabled();
  });

  it('shows submitting state', () => {
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
        isSubmitting
      />
    );

    expect(screen.getByTestId('capture-submit-button')).toHaveTextContent(
      'Saving...'
    );
  });

  it('clicking camera button triggers file input', async () => {
    const user = userEvent.setup();
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    const cameraButton = screen.getByTestId('camera-button');
    const cameraInput = screen.getByTestId('camera-input');
    const clickSpy = vi.spyOn(cameraInput, 'click');

    await user.click(cameraButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('clicking gallery button triggers file input', async () => {
    const user = userEvent.setup();
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    const galleryButton = screen.getByTestId('gallery-button');
    const galleryInput = screen.getByTestId('gallery-input');
    const clickSpy = vi.spyOn(galleryInput, 'click');

    await user.click(galleryButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows photo preview after selecting a file', async () => {
    const user = userEvent.setup();
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const galleryInput = screen.getByTestId('gallery-input');

    await user.upload(galleryInput, file);

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
    });

    // Camera and gallery buttons should be hidden
    expect(screen.queryByTestId('capture-placeholder')).not.toBeInTheDocument();
    // Submit should be enabled
    expect(screen.getByTestId('capture-submit-button')).not.toBeDisabled();
  });

  it('removes photo when remove button clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    // Select a file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const galleryInput = screen.getByTestId('gallery-input');
    await user.upload(galleryInput, file);

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
    });

    // Click remove button
    await user.click(screen.getByTestId('remove-photo-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('photo-preview')).not.toBeInTheDocument();
      expect(screen.getByTestId('capture-placeholder')).toBeInTheDocument();
    });
  });

  it('allows entering a note', async () => {
    const user = userEvent.setup();
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    const noteInput = screen.getByTestId('capture-note-input');
    await user.type(noteInput, 'This is a test note');

    expect(noteInput).toHaveValue('This is a test note');
  });

  it('calls onCapture with photo and note on submit', async () => {
    const user = userEvent.setup();
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    // Select a file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const galleryInput = screen.getByTestId('gallery-input');
    await user.upload(galleryInput, file);

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
    });

    // Enter a note
    const noteInput = screen.getByTestId('capture-note-input');
    await user.type(noteInput, 'Market shelf photo');

    // Submit
    await user.click(screen.getByTestId('capture-submit-button'));

    expect(mockOnCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        photo: file,
        note: 'Market shelf photo',
        previewUrl: expect.any(String),
      })
    );
  });

  it('closes and resets when cancel clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    // Select a file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByTestId('gallery-input'), file);

    await waitFor(() => {
      expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
    });

    // Click cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('has accessible labels', () => {
    render(
      <QuickCaptureSheet
        open
        onOpenChange={mockOnOpenChange}
        onCapture={mockOnCapture}
      />
    );

    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
  });
});
