/**
 * usePdfExport Hook
 *
 * Client-side PDF generation using html2pdf.js.
 * Uses dynamic import to avoid SSR crashes (html2pdf.js uses window/document).
 *
 * @example
 * ```tsx
 * const { exportToPdf, isGenerating, error } = usePdfExport();
 *
 * const handleDownload = async () => {
 *   if (!containerRef.current) return;
 *   try {
 *     await exportToPdf(containerRef.current, 'kel-positioning-2026-01-07.pdf');
 *     toast.success('PDF downloaded successfully');
 *   } catch {
 *     toast.error('Failed to generate PDF');
 *   }
 * };
 * ```
 */

'use client';

import { useCallback, useState } from 'react';

interface UsePdfExportReturn {
  /** Export element to PDF and trigger download */
  exportToPdf: (element: HTMLElement, filename: string) => Promise<void>;
  /** Whether PDF generation is in progress */
  isGenerating: boolean;
  /** Error from last export attempt, or null */
  error: Error | null;
}

export function usePdfExport(): UsePdfExportReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToPdf = useCallback(
    async (element: HTMLElement, filename: string) => {
      setIsGenerating(true);
      setError(null);

      try {
        // CRITICAL: Dynamic import - html2pdf.js uses window/document
        // Static import would crash during Next.js SSR
        const html2pdf = (await import('html2pdf.js')).default;

        // WORKAROUND: html2canvas doesn't support lab()/oklch() colors from Tailwind CSS v4.
        // We override colors in the onclone callback to replace any lab() colors with hex equivalents.
        const worker = html2pdf()
          .set({
            margin: 15, // 15mm margins (A4 friendly)
            filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
              scale: 2, // 2x for crisp output
              useCORS: true, // Allow cross-origin images
              logging: false, // Disable console spam
              backgroundColor: '#ffffff',
              // Override computed styles to replace lab() colors with hex
              onclone: (clonedDoc: Document) => {
                const allElements = clonedDoc.querySelectorAll('*');
                allElements.forEach((el) => {
                  const htmlEl = el as HTMLElement;
                  const computed = window.getComputedStyle(htmlEl);
                  // Override background-color if it uses lab()
                  const bgColor = computed.backgroundColor;
                  if (bgColor.includes('lab(') || bgColor.includes('oklch(')) {
                    htmlEl.style.backgroundColor = '#ffffff';
                  }
                  // Override color if it uses lab()
                  const textColor = computed.color;
                  if (textColor.includes('lab(') || textColor.includes('oklch(')) {
                    htmlEl.style.color = '#000000';
                  }
                  // Override border-color if it uses lab()
                  const borderColor = computed.borderColor;
                  if (borderColor.includes('lab(') || borderColor.includes('oklch(')) {
                    htmlEl.style.borderColor = '#e5e7eb';
                  }
                });
              },
            },
            jsPDF: {
              unit: 'mm',
              format: 'a4', // 210 × 297mm
              orientation: 'portrait',
            },
          })
          .from(element);

        // Get PDF as blob and trigger download via anchor element
        // This approach ensures Playwright can detect the download event
        const blob: Blob = await worker.outputPdf('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        const exportError =
          err instanceof Error ? err : new Error('PDF generation failed');
        setError(exportError);
        throw exportError;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return { exportToPdf, isGenerating, error };
}
