import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  base64ToFile,
  deleteQuickCapture,
  fileToBase64,
  getSignedUrl,
  uploadQuickCapture,
} from './quickCaptureStorage';

// Mock Supabase client
const mockUpload = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        createSignedUrl: mockCreateSignedUrl,
        remove: mockRemove,
      }),
    },
  }),
}));

describe('quickCaptureStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadQuickCapture', () => {
    it('uploads valid JPEG file successfully', async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed-url' },
        error: null,
      });

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadQuickCapture(file, 'user-123');

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^user-123\/\d+_[a-z0-9]+\.jpg$/),
        file,
        { cacheControl: '3600', upsert: false }
      );
      expect(result.url).toBe('https://storage.example.com/signed-url');
      expect(result.path).toMatch(/^user-123\/\d+_[a-z0-9]+\.jpg$/);
    });

    it('uploads PNG file successfully', async () => {
      mockUpload.mockResolvedValue({ error: null });
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed-url' },
        error: null,
      });

      const file = new File(['image data'], 'test.png', { type: 'image/png' });
      const result = await uploadQuickCapture(file, 'user-456');

      expect(result.path).toMatch(/^user-456\/\d+_[a-z0-9]+\.png$/);
    });

    it('rejects invalid file type', async () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });

      await expect(uploadQuickCapture(file, 'user-123')).rejects.toMatchObject({
        message: expect.stringContaining('Invalid file type'),
        code: 'INVALID_FILE',
      });
    });

    it('rejects file over 10MB', async () => {
      // Create a file larger than 10MB (per story spec)
      const largeData = new Uint8Array(11 * 1024 * 1024);
      const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });

      await expect(uploadQuickCapture(file, 'user-123')).rejects.toMatchObject({
        message: expect.stringContaining('File too large'),
        code: 'INVALID_FILE',
      });
    });

    it('throws on upload error', async () => {
      mockUpload.mockResolvedValue({
        error: { message: 'Storage quota exceeded' },
      });

      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      await expect(uploadQuickCapture(file, 'user-123')).rejects.toMatchObject({
        message: expect.stringContaining('Storage quota exceeded'),
        code: 'UPLOAD_FAILED',
      });
    });
  });

  describe('getSignedUrl', () => {
    it('returns signed URL with default expiry', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed' },
        error: null,
      });

      const url = await getSignedUrl('user-123/test.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user-123/test.jpg', 3600);
      expect(url).toBe('https://storage.example.com/signed');
    });

    it('accepts custom expiry time', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed' },
        error: null,
      });

      await getSignedUrl('user-123/test.jpg', 7200);

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user-123/test.jpg', 7200);
    });

    it('throws on error', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'File not found' },
      });

      await expect(getSignedUrl('user-123/missing.jpg')).rejects.toMatchObject({
        message: expect.stringContaining('File not found'),
        code: 'URL_FAILED',
      });
    });
  });

  describe('deleteQuickCapture', () => {
    it('deletes file successfully', async () => {
      mockRemove.mockResolvedValue({ error: null });

      await deleteQuickCapture('user-123/test.jpg');

      expect(mockRemove).toHaveBeenCalledWith(['user-123/test.jpg']);
    });

    it('throws on delete error', async () => {
      mockRemove.mockResolvedValue({
        error: { message: 'Permission denied' },
      });

      await expect(
        deleteQuickCapture('user-123/test.jpg')
      ).rejects.toMatchObject({
        message: expect.stringContaining('Permission denied'),
        code: 'DELETE_FAILED',
      });
    });
  });

  describe('fileToBase64', () => {
    it('converts file to base64 string', async () => {
      const file = new File(['Hello, World!'], 'test.txt', {
        type: 'text/plain',
      });
      const result = await fileToBase64(file);

      expect(result).toMatch(/^data:text\/plain;base64,/);
    });
  });

  describe('base64ToFile', () => {
    it('converts base64 back to File', () => {
      const base64 = 'data:image/jpeg;base64,SGVsbG8sIFdvcmxkIQ==';
      const file = base64ToFile(base64, 'test.jpg', 'image/jpeg');

      expect(file.name).toBe('test.jpg');
      expect(file.type).toBe('image/jpeg');
      expect(file.size).toBe(13); // "Hello, World!" is 13 bytes
    });
  });

  describe('round-trip conversion', () => {
    it('preserves file content through base64 conversion', async () => {
      const originalContent = 'Test image content';
      const originalFile = new File([originalContent], 'test.jpg', {
        type: 'image/jpeg',
      });

      const base64 = await fileToBase64(originalFile);
      const restoredFile = base64ToFile(base64, 'test.jpg', 'image/jpeg');

      // Read content using FileReader (File.text() not available in jsdom)
      const restoredContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(restoredFile);
      });
      expect(restoredContent).toBe(originalContent);
    });
  });
});
