'use client';

import { Camera, Image, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface QuickCaptureData {
  /** The captured photo file */
  photo: File;
  /** Optional note describing the photo */
  note: string;
  /** Photo preview URL (for display before upload) */
  previewUrl: string;
}

interface QuickCaptureSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback to close the sheet */
  onOpenChange: (open: boolean) => void;
  /** Callback when capture is submitted */
  onCapture: (data: QuickCaptureData) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

/**
 * Bottom sheet for quick photo capture during field research.
 * Allows taking/selecting a photo and adding an optional note.
 *
 * Story 10-5: Quick Capture Mode
 */
export function QuickCaptureSheet({
  open,
  onOpenChange,
  onCapture,
  isSubmitting = false,
}: QuickCaptureSheetProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setPhoto(file);
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    },
    []
  );

  const handleRemovePhoto = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPhoto(null);
    setPreviewUrl(null);
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [previewUrl]);

  const handleSubmit = useCallback(() => {
    if (photo && previewUrl) {
      onCapture({
        photo,
        note: note.trim(),
        previewUrl,
      });
    }
  }, [photo, previewUrl, note, onCapture]);

  const handleClose = useCallback(() => {
    // Clean up preview URL when closing
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPhoto(null);
    setPreviewUrl(null);
    setNote('');
    onOpenChange(false);
  }, [previewUrl, onOpenChange]);

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const openGallery = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[85vh] rounded-t-2xl"
        data-testid="quick-capture-sheet"
      >
        <SheetHeader className="pb-4">
          <SheetTitle>Quick Capture</SheetTitle>
          <SheetDescription>
            Take a photo and add an optional note
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            data-testid="camera-input"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="gallery-input"
          />

          {/* Photo area */}
          {!photo ? (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8"
              data-testid="capture-placeholder"
            >
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={openCamera}
                  className="flex h-20 w-20 flex-col items-center gap-2"
                  data-testid="camera-button"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Camera</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={openGallery}
                  className="flex h-20 w-20 flex-col items-center gap-2"
                  data-testid="gallery-button"
                >
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Gallery</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Tap to capture or select a photo
              </p>
            </div>
          ) : (
            <div className="relative" data-testid="photo-preview">
              <img
                src={previewUrl!}
                alt="Captured preview"
                className="max-h-64 w-full rounded-lg object-contain"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2"
                onClick={handleRemovePhoto}
                data-testid="remove-photo-button"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove photo</span>
              </Button>
            </div>
          )}

          {/* Note field */}
          <div className="space-y-2">
            <label
              htmlFor="capture-note"
              className="block text-sm font-medium text-foreground"
            >
              Note <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="capture-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What does this photo show?"
              rows={2}
              className={cn(
                'w-full rounded-md border border-border bg-background px-4 py-3',
                'text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20'
              )}
              data-testid="capture-note-input"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!photo || isSubmitting}
              className="flex-1"
              data-testid="capture-submit-button"
            >
              {isSubmitting ? 'Saving...' : 'Save Capture'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
