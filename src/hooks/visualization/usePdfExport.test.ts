/**
 * usePdfExport Hook Tests
 *
 * Unit tests for PDF export functionality using html2pdf.js.
 * Story 11.2: PDF One-Pager Export (Task 2)
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { usePdfExport } from './usePdfExport';

// Mock html2pdf.js with proper factory function
// Uses outputPdf('blob') to get PDF as Blob for anchor-based download
const mockOutputPdf = vi.fn(() => Promise.resolve(new Blob(['test pdf'], { type: 'application/pdf' })));
const mockFrom = vi.fn(() => ({ outputPdf: mockOutputPdf }));
const mockSet = vi.fn(() => ({ from: mockFrom }));
const mockHtml2Pdf = vi.fn(() => ({ set: mockSet }));

vi.mock('html2pdf.js', () => ({
  default: () => mockHtml2Pdf(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('usePdfExport', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock chain for each test
    // Implementation uses outputPdf('blob') then anchor-based download
    mockOutputPdf.mockImplementation(() => Promise.resolve(new Blob(['test pdf'], { type: 'application/pdf' })));
    mockFrom.mockReturnValue({ outputPdf: mockOutputPdf });
    mockSet.mockReturnValue({ from: mockFrom });
    mockHtml2Pdf.mockReturnValue({ set: mockSet });

    // Create mock DOM element with text content (no innerHTML for security)
    mockElement = document.createElement('div');
    const textNode = document.createTextNode('Test content');
    mockElement.appendChild(textNode);
  });

  describe('initial state', () => {
    it('returns isGenerating as false initially', () => {
      // Arrange & Act
      const { result } = renderHook(() => usePdfExport());

      // Assert
      expect(result.current.isGenerating).toBe(false);
    });

    it('returns error as null initially', () => {
      // Arrange & Act
      const { result } = renderHook(() => usePdfExport());

      // Assert
      expect(result.current.error).toBeNull();
    });

    it('returns exportToPdf as a function', () => {
      // Arrange & Act
      const { result } = renderHook(() => usePdfExport());

      // Assert
      expect(typeof result.current.exportToPdf).toBe('function');
    });
  });

  describe('exportToPdf', () => {
    it('sets isGenerating to false after successful export', async () => {
      // Arrange
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        await result.current.exportToPdf(mockElement, 'test.pdf');
      });

      // Assert
      expect(result.current.isGenerating).toBe(false);
    });

    it('calls html2pdf with correct A4 configuration', async () => {
      // Arrange
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        await result.current.exportToPdf(mockElement, 'kel-positioning.pdf');
      });

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: 15,
          filename: 'kel-positioning.pdf',
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: expect.objectContaining({
            scale: 2,
            useCORS: true,
            logging: false,
          }),
          jsPDF: expect.objectContaining({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
          }),
        })
      );
    });

    it('calls from() with the provided element', async () => {
      // Arrange
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        await result.current.exportToPdf(mockElement, 'test.pdf');
      });

      // Assert
      expect(mockFrom).toHaveBeenCalledWith(mockElement);
    });

    it('calls outputPdf with blob format to trigger download', async () => {
      // Arrange
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        await result.current.exportToPdf(mockElement, 'test.pdf');
      });

      // Assert
      expect(mockOutputPdf).toHaveBeenCalledWith('blob');
    });

    it('uses provided filename', async () => {
      // Arrange
      const { result } = renderHook(() => usePdfExport());
      const filename = 'kel-positioning-2026-01-07.pdf';

      // Act
      await act(async () => {
        await result.current.exportToPdf(mockElement, filename);
      });

      // Assert
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ filename })
      );
    });
  });

  describe('error handling', () => {
    it('sets error state when export fails', async () => {
      // Arrange
      const testError = new Error('PDF generation failed');
      mockOutputPdf.mockRejectedValueOnce(testError);
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        try {
          await result.current.exportToPdf(mockElement, 'test.pdf');
        } catch {
          // Expected to throw
        }
      });

      // Assert
      expect(result.current.error).toEqual(testError);
    });

    it('throws the error for caller to handle', async () => {
      // Arrange
      const testError = new Error('PDF generation failed');
      mockOutputPdf.mockRejectedValueOnce(testError);
      const { result } = renderHook(() => usePdfExport());

      // Act & Assert
      await expect(
        act(async () => {
          await result.current.exportToPdf(mockElement, 'test.pdf');
        })
      ).rejects.toThrow('PDF generation failed');
    });

    it('sets isGenerating to false after error', async () => {
      // Arrange
      mockOutputPdf.mockRejectedValueOnce(new Error('Failed'));
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        try {
          await result.current.exportToPdf(mockElement, 'test.pdf');
        } catch {
          // Expected to throw
        }
      });

      // Assert
      expect(result.current.isGenerating).toBe(false);
    });

    it('wraps non-Error throws in Error object', async () => {
      // Arrange
      mockOutputPdf.mockRejectedValueOnce('string error');
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        try {
          await result.current.exportToPdf(mockElement, 'test.pdf');
        } catch {
          // Expected to throw
        }
      });

      // Assert
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('PDF generation failed');
    });

    it('clears error state on new export attempt', async () => {
      // Arrange - first call fails
      mockOutputPdf.mockRejectedValueOnce(new Error('First error'));
      const { result } = renderHook(() => usePdfExport());

      await act(async () => {
        try {
          await result.current.exportToPdf(mockElement, 'test.pdf');
        } catch {
          // Expected
        }
      });
      expect(result.current.error).not.toBeNull();

      // Act - second call succeeds (returns blob)
      mockOutputPdf.mockResolvedValueOnce(new Blob(['test pdf'], { type: 'application/pdf' }));
      await act(async () => {
        await result.current.exportToPdf(mockElement, 'test.pdf');
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('multiple exports', () => {
    it('can be called multiple times', async () => {
      // Arrange
      const { result } = renderHook(() => usePdfExport());

      // Act
      await act(async () => {
        await result.current.exportToPdf(mockElement, 'first.pdf');
      });
      await act(async () => {
        await result.current.exportToPdf(mockElement, 'second.pdf');
      });

      // Assert
      expect(mockOutputPdf).toHaveBeenCalledTimes(2);
    });
  });

  describe('loading state', () => {
    it('sets isGenerating during async operation', async () => {
      // Arrange
      let resolveExport: (blob: Blob) => void;
      const slowPromise = new Promise<Blob>((resolve) => {
        resolveExport = resolve;
      });
      mockOutputPdf.mockImplementationOnce(() => slowPromise);

      const { result } = renderHook(() => usePdfExport());

      // Act - start export without awaiting
      let exportPromise: Promise<void>;
      act(() => {
        exportPromise = result.current.exportToPdf(mockElement, 'test.pdf');
      });

      // Assert - should be generating during async operation
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      // Cleanup
      await act(async () => {
        resolveExport!(new Blob(['test pdf'], { type: 'application/pdf' }));
        await exportPromise;
      });

      // After completion, should be false
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('return type', () => {
    it('returns object with expected properties', () => {
      // Arrange & Act
      const { result } = renderHook(() => usePdfExport());

      // Assert
      expect(result.current).toHaveProperty('exportToPdf');
      expect(result.current).toHaveProperty('isGenerating');
      expect(result.current).toHaveProperty('error');
      expect(typeof result.current.exportToPdf).toBe('function');
      expect(typeof result.current.isGenerating).toBe('boolean');
    });
  });
});
